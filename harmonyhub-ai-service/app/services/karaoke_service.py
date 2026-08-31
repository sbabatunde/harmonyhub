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

def log(msg):
    print(f"[KARAOKE] {msg}", flush=True)


class KaraokeService:
    """Service for processing songs into karaoke tracks with voice parts."""

    def __init__(self):
        self.audio_processor = AudioProcessor()
        self._whisper_model = None

    def _get_whisper_model(self):
        if self._whisper_model is None:
            import whisper
            log(f"Loading Whisper model '{settings.WHISPER_MODEL}'...")
            self._whisper_model = whisper.load_model(settings.WHISPER_MODEL)
            log("Whisper model loaded")
        return self._whisper_model

    async def process_song(self, request: KaraokeRequest) -> KaraokeResult:
        """Process a song for karaoke with voice parts."""
        log(f"=== Starting karaoke processing for song {request.song_id} ===")
        
        try:
            # Step 1: Download audio
            log(f"Step 1: Downloading audio from {request.audio_url}")
            audio_path = await self._download_audio(request.audio_url, request.song_id)
            log(f"Step 1 complete: {audio_path}")

            # Step 2: Separate vocals and instrumental
            log("Step 2: Starting Demucs separation...")
            instrumental_path, vocal_path = await self._separate_audio(audio_path, request.song_id)
            log("Step 2 complete")

            # Step 2.5: Copy files to Laravel storage
            instrumental_url, vocal_url = await self._copy_to_laravel(
                instrumental_path, vocal_path, request.song_id
            )
            log("Step 2.5 complete: Files copied to Laravel storage")

            # Step 2.6: Generate voice parts
            parts = await self._generate_parts(vocal_path, request.song_id)
            log(f"Step 2.6 complete: Generated {len(parts)} voice parts")

            # Step 3: Transcribe lyrics
            log("Step 3: Starting Whisper transcription...")
            lyrics = await self._transcribe_lyrics(vocal_path, request.language)
            log(f"Step 3 complete: {len(lyrics)} lyrics segments")

            # Step 4: Create result
            result = KaraokeResult(
                song_id=request.song_id,
                status=KaraokeStatus.READY,
                instrumental_path=instrumental_url,
                vocal_path=vocal_url,
                lyrics=lyrics,
                parts=parts,
                processed_at=datetime.now(),
            )

            # Step 5: Send webhook
            if request.callback_url:
                log(f"Step 5: Sending webhook to {request.callback_url}")
                await self._send_webhook(request.callback_url, result)

            log("=== Karaoke processing complete ===")
            return result

        except Exception as e:
            log(f"ERROR: Karaoke processing failed: {e}")
            logger.error(f"Karaoke processing failed: {e}", exc_info=True)

            error_result = KaraokeResult(
                song_id=request.song_id,
                status=KaraokeStatus.FAILED,
                error=str(e),
                processed_at=datetime.now(),
            )

            if request.callback_url:
                await self._send_webhook(request.callback_url, error_result)

            return error_result

    async def _download_audio(self, url: str, song_id: int) -> str:
        """Download audio file from URL."""
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

    async def _separate_audio(self, audio_path: str, song_id: int) -> Tuple[str, str]:
        """Separate vocals and instrumental using Demucs."""
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
        log(f"Audio file size: {Path(audio_path).stat().st_size} bytes")

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
            raise Exception("Demucs processing timed out after 30 minutes")
        except Exception as e:
            raise Exception(f"Demucs subprocess error: {e}")

        if result.returncode != 0:
            raise Exception(f"Demucs failed: {result.stderr[-500:]}")

        demucs_output_dir = output_dir / settings.DEMUCS_MODEL / Path(audio_path).stem
        instrumental_path = demucs_output_dir / "no_vocals.wav"
        vocal_path = demucs_output_dir / "vocals.wav"

        if not instrumental_path.exists() or not vocal_path.exists():
            raise Exception(f"Demucs output not found in {demucs_output_dir}")

        log("Demucs separation complete")
        return str(instrumental_path), str(vocal_path)

    async def _copy_to_laravel(self, instrumental_path: str, vocal_path: str, song_id: int) -> Tuple[str, str]:
        """Copy processed files to Laravel's public storage."""
        laravel_dir = settings.LARAVEL_STORAGE_PATH / "ai-processed"
        laravel_dir.mkdir(parents=True, exist_ok=True)
        
        instrumental_src = Path(instrumental_path)
        vocal_src = Path(vocal_path)
        
        instrumental_dst = laravel_dir / f"song_{song_id}_instrumental.wav"
        vocal_dst = laravel_dir / f"song_{song_id}_vocals.wav"
        
        shutil.copy2(str(instrumental_src), str(instrumental_dst))
        shutil.copy2(str(vocal_src), str(vocal_dst))
        
        log(f"Copied instrumental to: {instrumental_dst}")
        log(f"Copied vocals to: {vocal_dst}")
        
        instrumental_url = f"storage/ai-processed/song_{song_id}_instrumental.wav"
        vocal_url = f"storage/ai-processed/song_{song_id}_vocals.wav"
        
        return instrumental_url, vocal_url

    async def _generate_parts(self, vocal_path: str, song_id: int) -> Dict[str, str]:
        """Generate voice parts (Soprano, Alto, Tenor, Bass) from vocals."""
        import librosa
        import soundfile as sf
        import numpy as np
        
        log(f"Generating voice parts for song {song_id}...")
        
        parts = {}
        part_shifts = {
            'soprano': +3,
            'alto': 0,
            'tenor': -5,
            'bass': -12,
        }
        
        try:
            # Load vocals
            audio, sr = librosa.load(vocal_path, sr=None, mono=True)
            log(f"Loaded vocals: {len(audio)/sr:.1f} seconds at {sr}Hz")
            
            # Laravel storage directory for parts
            laravel_dir = settings.LARAVEL_STORAGE_PATH / "ai-processed" / "parts"
            laravel_dir.mkdir(parents=True, exist_ok=True)
            
            for part_name, shift in part_shifts.items():
                log(f"Generating {part_name.upper()} (shift: {shift:+d})...")
                
                if shift == 0:
                    shifted = audio
                else:
                    shifted = await asyncio.to_thread(
                        librosa.effects.pitch_shift,
                        audio,
                        sr=sr,
                        n_steps=shift,
                    )
                
                # Normalize
                max_val = np.max(np.abs(shifted))
                if max_val > 0:
                    shifted = shifted / max_val * 0.95
                
                # Save to Laravel storage
                output_path = laravel_dir / f"song_{song_id}_{part_name}.wav"
                await asyncio.to_thread(
                    sf.write,
                    str(output_path),
                    shifted,
                    sr,
                )
                
                parts[part_name] = f"storage/ai-processed/parts/song_{song_id}_{part_name}.wav"
                log(f"Generated: {parts[part_name]}")
            
            log("All voice parts generated successfully")
            return parts
            
        except Exception as e:
            log(f"Parts generation failed (non-fatal): {e}")
            logger.error(f"Parts generation error: {e}", exc_info=True)
            return {}

    async def _transcribe_lyrics(self, vocal_path: str, language: str = "en") -> List[LyricsSegment]:
        """Transcribe lyrics using Whisper."""
        log("Loading Whisper model...")
        model = self._get_whisper_model()

        log("Running transcription...")
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(
            None,
            partial(model.transcribe, vocal_path, language=language, task="transcribe", verbose=False),
        )
        log("Transcription complete")

        lyrics = []
        for segment in result.get("segments", []):
            lyrics.append(
                LyricsSegment(
                    start=segment["start"],
                    end=segment["end"],
                    text=segment["text"].strip(),
                    confidence=segment.get("confidence"),
                )
            )

        return lyrics

    async def _send_webhook(self, callback_url: str, result: KaraokeResult):
        """Send webhook to Laravel backend."""
        log(f"Sending webhook to {callback_url}")
        try:
            async with httpx.AsyncClient(timeout=120) as client:
                response = await client.post(
                    callback_url,
                    json=result.model_dump(mode="json"),
                    headers={"X-Webhook-Secret": settings.LARAVEL_WEBHOOK_SECRET},
                )
                response.raise_for_status()
                log("Webhook sent successfully")
        except Exception as e:
            log(f"Webhook failed: {e}")
            logger.error(f"Webhook failed: {e}", exc_info=True)