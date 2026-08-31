"""Run Demucs with soundfile backend and fast settings."""
import sys
import logging
import soundfile as sf
import torch

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("demucs-runner")

def patched_load(path, *args, **kwargs):
    logger.info(f"Loading audio with soundfile: {path}")
    audio, sr = sf.read(path, always_2d=True)
    audio_tensor = torch.from_numpy(audio.T).float()
    return audio_tensor, sr

def patched_save(path, audio, sample_rate=None, encoding=None, bits_per_sample=None, **kwargs):
    """Save audio with soundfile. Accepts Demucs's keyword arguments."""
    logger.info(f"Saving audio with soundfile: {path}")
    
    # Handle different audio tensor shapes
    if audio.dim() == 3:
        audio = audio.squeeze(0)  # Remove batch dim
    if audio.dim() == 2:
        audio_np = audio.numpy().T  # (samples, channels)
    else:
        audio_np = audio.numpy()  # (samples,)
    
    # Use provided sample_rate or default
    sr = sample_rate if sample_rate else 44100
    
    sf.write(str(path), audio_np, sr)
    logger.info(f"Saved: {path}")

import torchaudio
torchaudio.load = patched_load
torchaudio.save = patched_save

# Add fast options
sys.argv.extend([
    "--shifts", "0",
    "--segment", "7",
])

from demucs.separate import main
main()