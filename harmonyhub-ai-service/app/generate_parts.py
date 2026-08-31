"""Generate voice parts from isolated vocals using pitch shifting."""
import sys
import logging
import soundfile as sf
import librosa
import numpy as np
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("parts-generator")

# Voice part shifts (in semitones from original)
# Positive = higher, Negative = lower
PART_SHIFTS = {
    'soprano': +3,    # Higher than original (for female high voice)
    'alto': 0,        # Original pitch (female lower voice)
    'tenor': -5,      # Lower (male high voice)
    'bass': -12,      # Much lower (male low voice)
}

def generate_part(vocal_path: str, output_path: str, semitones_shift: int, quality: str = 'good'):
    """Generate a voice part by pitch-shifting the vocals."""
    logger.info(f"Loading vocals: {vocal_path}")
    
    # Load audio (mono for simplicity)
    audio, sr = librosa.load(vocal_path, sr=None, mono=True)
    
    logger.info(f"Original: {len(audio)/sr:.1f} seconds, {sr}Hz")
    
    if semitones_shift == 0:
        # No shift needed - just copy
        shifted = audio
    else:
        logger.info(f"Pitch shifting by {semitones_shift:+d} semitones...")
        shifted = librosa.effects.pitch_shift(
            audio, 
            sr=sr, 
            n_steps=semitones_shift,
            bins_per_octave=12,
        )
    
    # Normalize
    max_val = np.max(np.abs(shifted))
    if max_val > 0:
        shifted = shifted / max_val * 0.95
    
    # Save
    sf.write(output_path, shifted, sr)
    logger.info(f"Saved: {output_path} ({semitones_shift:+d} semitones)")

def main():
    """Generate all voice parts from a vocal track."""
    if len(sys.argv) < 2:
        print("Usage: python generate_parts.py <vocal_path> [output_dir]")
        sys.exit(1)
    
    vocal_path = Path(sys.argv[1])
    output_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else vocal_path.parent
    
    if not vocal_path.exists():
        print(f"Error: {vocal_path} not found")
        sys.exit(1)
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print("\n" + "="*50)
    print("  HarmonyHub Voice Parts Generator")
    print("="*50 + "\n")
    
    for part_name, shift in PART_SHIFTS.items():
        output_path = output_dir / f"{part_name}.wav"
        print(f"\n🎵 Generating {part_name.upper()} part (shift: {shift:+d})...")
        generate_part(str(vocal_path), str(output_path), shift)
    
    print("\n" + "="*50)
    print("  ✅ All parts generated successfully!")
    print("="*50)
    print(f"\nOutput directory: {output_dir}")
    print("\nGenerated files:")
    for part_name in PART_SHIFTS:
        print(f"  ├── {part_name}.wav")
    print("\nUpload these files as song parts in HarmonyHub!")

if __name__ == "__main__":
    main()