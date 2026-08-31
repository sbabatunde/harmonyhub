"""Run Demucs with soundfile backend for cross-platform compatibility."""
import sys
import logging
import soundfile as sf
import torch

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("demucs-runner")

# Patch torchaudio.load to use soundfile (avoids torchcodec/FFmpeg issues)
def patched_load(path, *args, **kwargs):
    logger.info(f"Loading audio with soundfile: {path}")
    audio, sr = sf.read(path, always_2d=True)
    # Convert to (channels, samples) tensor
    audio_tensor = torch.from_numpy(audio.T).float()
    return audio_tensor, sr

def patched_save(path, audio, sr, *args, **kwargs):
    logger.info(f"Saving audio with soundfile: {path}")
    if audio.dim() == 3:
        audio = audio.squeeze(0)
    if audio.dim() == 2:
        audio_np = audio.numpy().T
    else:
        audio_np = audio.numpy()
    sf.write(path, audio_np, sr)

# Apply patches
import torchaudio
torchaudio.load = patched_load
torchaudio.save = patched_save

# Run Demucs
from demucs.separate import main
main()