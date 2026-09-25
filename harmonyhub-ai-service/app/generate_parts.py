"""Generate voice parts from isolated vocals using formant-aware pitch shifting."""
import sys
import io
import logging
import warnings
from pathlib import Path

import numpy as np
import soundfile as sf
import librosa

# Force UTF-8 output on Windows so emoji/special chars don't crash
if sys.platform == "win32":
    try:
        sys.stdout = io.TextIOWrapper(
            sys.stdout.buffer, encoding="utf-8", errors="replace"
        )
        sys.stderr = io.TextIOWrapper(
            sys.stderr.buffer, encoding="utf-8", errors="replace"
        )
    except Exception:
        pass

warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("parts-generator")


# Conservative shifts — formant preservation keeps timbre natural.
PART_SHIFTS = {
    "soprano": +4,
    "alto":    +1,
    "tenor":   -3,
    "bass":    -8,
}

TARGET_SR = 44100
FADE_SECONDS = 0.02


def _apply_fades(audio: np.ndarray, sr: int, fade_seconds: float) -> np.ndarray:
    fade_len = max(1, int(sr * fade_seconds))
    if audio.ndim == 1:
        audio[:fade_len] *= np.linspace(0.0, 1.0, fade_len)
        audio[-fade_len:] *= np.linspace(1.0, 0.0, fade_len)
    else:
        ramp_in = np.linspace(0.0, 1.0, fade_len)
        ramp_out = np.linspace(1.0, 0.0, fade_len)
        audio[:, :fade_len] *= ramp_in
        audio[:, -fade_len:] *= ramp_out
    return audio


def _normalize(audio: np.ndarray, peak: float = 0.95) -> np.ndarray:
    max_val = float(np.max(np.abs(audio)))
    if max_val > 0:
        audio = audio / max_val * peak
    return audio


def _pitch_shift_formant_preserving(
    audio: np.ndarray, sr: int, semitones: float
) -> np.ndarray:
    """Pitch-shift with formant preservation when Rubber Band is available."""
    try:
        import pyrubberband as pyrb
        shifted = pyrb.pitch_shift(audio.T, sr, n_steps=semitones)
        return shifted.T
    except Exception as e:
        logging.getLogger("parts-generator").warning(
            f"pyrubberband unavailable, falling back to librosa: {e}"
        )

    return librosa.effects.pitch_shift(
        audio,
        sr=sr,
        n_steps=semitones,
        bins_per_octave=12,
        n_fft=2048,
        hop_length=512,
    )


def _apply_part_eq(audio: np.ndarray, sr: int, part: str) -> np.ndarray:
    try:
        from scipy.signal import butter, sosfilt
    except ImportError:
        return audio

    nyquist = sr / 2.0

    if part == "soprano":
        cutoff = min(3000, nyquist - 100)
        sos = butter(2, cutoff / nyquist, btype="highpass", output="sos")
        wet = sosfilt(sos, audio, axis=-1)
        return 0.6 * audio + 0.4 * wet

    if part == "bass":
        cutoff = min(300, nyquist - 100)
        sos = butter(2, cutoff / nyquist, btype="lowpass", output="sos")
        wet = sosfilt(sos, audio, axis=-1)
        return 0.6 * audio + 0.4 * wet

    return audio


def generate_part(
    vocal_path: Path,
    output_path: Path,
    semitones: float,
    part_name: str,
) -> None:
    logger.info(f"  Loading: {vocal_path.name}")
    audio, sr = librosa.load(str(vocal_path), sr=TARGET_SR, mono=False)

    if audio.ndim == 1:
        audio = audio[np.newaxis, :]

    duration = audio.shape[1] / sr
    logger.info(f"  Source: {duration:.1f}s @ {sr}Hz, {audio.shape[0]}ch")

    if abs(semitones) < 0.01:
        shifted = audio.copy()
    else:
        logger.info(f"  Shifting {semitones:+.1f} semitones...")
        shifted = _pitch_shift_formant_preserving(audio, sr, semitones)

    shifted = shifted[:, : audio.shape[1]]
    shifted = _apply_part_eq(shifted, sr, part_name)
    shifted = _apply_fades(shifted, sr, FADE_SECONDS)
    shifted = _normalize(shifted)

    sf.write(str(output_path), shifted.T, sr, subtype="PCM_16")
    logger.info(f"  Saved: {output_path.name}")


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python generate_parts.py <vocal_path> [output_dir]")
        sys.exit(1)

    vocal_path = Path(sys.argv[1])
    output_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else vocal_path.parent

    if not vocal_path.exists():
        print(f"Error: {vocal_path} not found")
        sys.exit(1)

    output_dir.mkdir(parents=True, exist_ok=True)

    # Plain ASCII output — no emoji, no fancy box drawing
    print("=" * 60)
    print("  HarmonyHub Voice Parts Generator (formant-aware)")
    print("=" * 60)

    for part_name, shift in PART_SHIFTS.items():
        print(f"\n[{part_name.upper()}] shift {shift:+.1f} semitones")
        output_path = output_dir / f"{part_name}.wav"
        try:
            generate_part(vocal_path, output_path, shift, part_name)
        except Exception as e:
            logger.error(f"  Failed: {e}")
            continue

    print("\n" + "=" * 60)
    print("  Parts generated")
    print("=" * 60)
    print(f"Output: {output_dir}\n")


if __name__ == "__main__":
    main()