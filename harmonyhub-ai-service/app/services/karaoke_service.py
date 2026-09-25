import os
import json
import asyncio
import subprocess
import logging
import sys
import shutil
from functools import partial
import httpx
from pathlib import Path
from typing import Optional, List, Tuple, Dict
from datetime import datetime
from app.config import settings
from app.services.audio_processor import AudioProcessor
from app.models.schemas import (
    KaraokeStatus,
    KaraokeResult,
    LyricsSegment,
    KaraokeRequest,
)

logger = logging.getLogger(__name__)


def log(msg: str) -> None:
    print(f"[KARAOKE] {msg}", flush=True)


class KaraokeService:
    """Process a song into karaoke + voice parts."""

    def __init__(self):
        self.audio_processor = AudioProcessor()
        self._whisper_model = None

    # ------------------------------------------------------------------ Whisper
    def _get_whisper_model(self):
        if self._whisper_model is None:
            import whisper
            log(f"Loading Whisper model '{settings.WHISPER_MODEL}'...")
            self._whisper_model = whisper.load_model(settings.WHISPER_MODEL)
            log("Whisper model loaded")
        return self._whisper_model

    # ------------------------------------------------------------------ Pipeline
    async def process_song(self, request: KaraokeRequest) -> KaraokeResult:
        log(f"=== Starting karaoke processing for song {request.song_id} ===")

        try:
            # 1) Download
            log(f"Step 1: Downloading audio from {request.audio_url}")
            audio_path = await self._download_audio(
                request.audio_url, request.song_id
            )
            log("Step 1 complete")

            # 2) Demucs split
            log("Step 2: Demucs vocal/instrumental separation...")
            instrumental_path, vocal_path = await self._separate_audio(
                audio_path, request.song_id
            )
            log("Step 2 complete")

            # 3) Copy instrumental + vocals to Laravel
            log("Step 2.5: Copying stems to Laravel storage...")
            instrumental_url, vocal_url = await self._copy_to_laravel(
                instrumental_path, vocal_path, request.song_id
            )
            log("Step 2.5 complete")

            # 4) Generate 4 voice parts
            log("Step 2.6: Generating voice parts...")
            parts = await self._generate_parts(vocal_path, request.song_id)
            log(f"Step 2.6 complete: {len(parts)} parts")

            # 5) Transcribe lyrics
            log("Step 3: Whisper transcription...")
            lyrics = await self._transcribe_lyrics(vocal_path, request.language)
            log(f"Step 3 complete: {len(lyrics)} lyric segments")

            # 6) Build result
            result = KaraokeResult(
                song_id=request.song_id,
                status=KaraokeStatus.READY,
                instrumental_path=instrumental_url,
                vocal_path=vocal_url,
                lyrics=lyrics,
                parts=parts,
                processed_at=datetime.now(),
            )

            # 7) Webhook
            if request.callback_url:
                log("Step 5: Sending webhook to Laravel")
                await self._send_webhook(request.callback_url, result)

            log("=== Karaoke processing complete ===")
            return result

        except Exception as e:
            log(f"ERROR: Karaoke processing failed: {e}")
            logger.error(
                f"Karaoke processing failed for song {request.song_id}: {e}",
                exc_info=True,
            )

            error_result = KaraokeResult(
                song_id=request.song_id,
                status=KaraokeStatus.FAILED,
                error=str(e),
                processed_at=datetime.now(),
            )

            if request.callback_url:
                await self._send_webhook(request.callback_url, error_result)

            return error_result

    # ------------------------------------------------------------------ Download
    async def _download_audio(self, url: str, song_id: int) -> str:
        log(f"Downloading from: {url}")
        audio_dir = settings.UPLOAD_DIR / str(song_id)
        audio_dir.mkdir(parents=True, exist_ok=True)

        audio_path = audio_dir / f"original_{song_id}.mp3"

        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.get(url)
            response.raise_for_status()
            with open(audio_path, "wb") as f:
                f.write(response.content)

        log(f"Downloaded {Path(audio_path).stat().st_size} bytes")
        return str(audio_path)

    # ------------------------------------------------------------------ Demucs
    async def _separate_audio(
        self, audio_path: str, song_id: int
    ) -> Tuple[str, str]:
        output_dir = settings.PROCESSED_DIR / str(song_id)
        output_dir.mkdir(parents=True, exist_ok=True)

        patch_script = settings.BASE_DIR / "app" / "run_demucs.py"

        cmd = [
            sys.executable,
            str(patch_script),
            "--out", str(output_dir),
            "--two-stems", "vocals",
            audio_path,
        ]

        log(f"Running Demucs for song {song_id}...")
        log(f"Audio size: {Path(audio_path).stat().st_size} bytes")

        try:
            result = await asyncio.wait_for(
                asyncio.to_thread(
                    subprocess.run,
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=1800,
                ),
                timeout=1800,
            )
        except asyncio.TimeoutError:
            raise Exception("Demucs timed out after 30 minutes")
        except Exception as e:
            raise Exception(f"Demucs subprocess error: {e}")

        if result.returncode != 0:
            raise Exception(f"Demucs failed: {result.stderr[-500:]}")

        demucs_output_dir = (
            output_dir / settings.DEMUCS_MODEL / Path(audio_path).stem
        )
        instrumental_path = demucs_output_dir / "no_vocals.wav"
        vocal_path = demucs_output_dir / "vocals.wav"

        if not instrumental_path.exists() or not vocal_path.exists():
            raise Exception(f"Demucs output not found in {demucs_output_dir}")

        return str(instrumental_path), str(vocal_path)

    # ------------------------------------------------------------------ Copy
    async def _copy_to_laravel(
        self, instrumental_path: str, vocal_path: str, song_id: int
    ) -> Tuple[str, str]:
        laravel_dir = settings.LARAVEL_STORAGE_PATH / "ai-processed"
        laravel_dir.mkdir(parents=True, exist_ok=True)

        instrumental_dst = laravel_dir / f"song_{song_id}_instrumental.wav"
        vocal_dst = laravel_dir / f"song_{song_id}_vocals.wav"

        shutil.copy2(instrumental_path, instrumental_dst)
        shutil.copy2(vocal_path, vocal_dst)

        log(f"Copied instrumental -> {instrumental_dst}")
        log(f"Copied vocals       -> {vocal_dst}")

        return (
            f"storage/ai-processed/song_{song_id}_instrumental.wav",
            f"storage/ai-processed/song_{song_id}_vocals.wav",
        )

    # ------------------------------------------------------------------ Parts
    async def _generate_parts(
        self, vocal_path: str, song_id: int
    ) -> Dict[str, str]:
        log(f"Generating voice parts for song {song_id}...")

        parts_script = settings.BASE_DIR / "app" / "generate_parts.py"

        # Generate inside AI storage first
        parts_dir = settings.PROCESSED_DIR / str(song_id) / "parts"
        parts_dir.mkdir(parents=True, exist_ok=True)

        cmd = [
            sys.executable,
            str(parts_script),
            vocal_path,
            str(parts_dir),
        ]

        try:
            result = await asyncio.wait_for(
                asyncio.to_thread(
                    subprocess.run,
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=900,   # 15 minutes for 4 parts
                ),
                timeout=960,
            )
        except asyncio.TimeoutError:
            log("Parts generation timed out (non-fatal)")
            return {}
        except Exception as e:
            log(f"Parts generation subprocess error (non-fatal): {e}")
            return {}

        if result.returncode != 0:
            log(f"Parts generation failed (non-fatal): {result.stderr[-500:]}")
            return {}

        # Copy generated parts to Laravel so the frontend can stream them
        laravel_parts_dir = settings.LARAVEL_STORAGE_PATH / "ai-processed" / "parts"
        laravel_parts_dir.mkdir(parents=True, exist_ok=True)

        parts: Dict[str, str] = {}
        for part_name in ["soprano", "alto", "tenor", "bass"]:
            src = parts_dir / f"{part_name}.wav"
            if not src.exists():
                log(f"Missing part: {part_name}")
                continue

            dst = laravel_parts_dir / f"song_{song_id}_{part_name}.wav"
            shutil.copy2(src, dst)

            url = f"storage/ai-processed/parts/song_{song_id}_{part_name}.wav"
            parts[part_name] = url
            log(f"Part ready: {part_name} -> {url}")

        return parts

    # ------------------------------------------------------------------ Whisper
    async def _transcribe_lyrics(
        self, vocal_path: str, language: str = "en"
    ) -> List[LyricsSegment]:
        log("Loading Whisper model...")
        model = self._get_whisper_model()

        log("Running transcription...")
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(
            None,
            partial(
                model.transcribe,
                vocal_path,
                language=language,
                task="transcribe",
                verbose=False,
            ),
        )
        log("Transcription complete")

        lyrics: List[LyricsSegment] = []
        for seg in result.get("segments", []):
            lyrics.append(
                LyricsSegment(
                    start=seg["start"],
                    end=seg["end"],
                    text=seg["text"].strip(),
                    confidence=seg.get("confidence"),
                )
            )
        return lyrics

    # ------------------------------------------------------------------ Webhook
    async def _send_webhook(
        self, callback_url: str, result: KaraokeResult
    ) -> None:
        log(f"Sending webhook to {callback_url}")
        try:
            async with httpx.AsyncClient(timeout=120) as client:
                response = await client.post(
                    callback_url,
                    json=result.model_dump(mode="json"),
                    headers={
                        "X-Webhook-Secret": settings.LARAVEL_WEBHOOK_SECRET
                    },
                )
                response.raise_for_status()
                log("Webhook sent successfully")
        except Exception as e:
            log(f"Webhook failed: {e}")
            logger.error(f"Webhook failed: {e}", exc_info=True)