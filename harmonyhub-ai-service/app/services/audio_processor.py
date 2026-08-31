import numpy as np
import soundfile as sf
import librosa
from pathlib import Path
from typing import Optional, Dict, Any


class AudioProcessor:
    """Utility class for audio processing operations."""
    
    @staticmethod
    def get_audio_info(file_path: str) -> Dict[str, Any]:
        """Get audio file information."""
        try:
            info = sf.info(file_path)
            return {
                "duration": info.duration,
                "sample_rate": info.samplerate,
                "channels": info.channels,
                "format": info.format,
            }
        except Exception as e:
            return {"error": str(e)}
    
    @staticmethod
    def convert_to_wav(input_path: str, output_path: str, sample_rate: int = 44100) -> bool:
        """Convert audio file to WAV format."""
        try:
            audio, sr = librosa.load(input_path, sr=sample_rate, mono=False)
            sf.write(output_path, audio.T if audio.ndim > 1 else audio, sample_rate)
            return True
        except Exception as e:
            print(f"Error converting audio: {e}")
            return False
    
    @staticmethod
    def normalize_audio(input_path: str, output_path: str) -> bool:
        """Normalize audio to a standard level."""
        try:
            audio, sr = librosa.load(input_path, sr=None, mono=False)
            max_val = np.max(np.abs(audio))
            if max_val > 0:
                audio = audio / max_val * 0.95
            sf.write(output_path, audio.T if audio.ndim > 1 else audio, sr)
            return True
        except Exception as e:
            print(f"Error normalizing audio: {e}")
            return False
    
    @staticmethod
    def detect_bpm(audio_path: str) -> Optional[float]:
        """Detect the BPM of an audio file."""
        try:
            y, sr = librosa.load(audio_path, sr=None, mono=True)
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
            return float(tempo)
        except Exception as e:
            print(f"Error detecting BPM: {e}")
            return None
    
    @staticmethod
    def get_audio_duration(file_path: str) -> Optional[float]:
        """Get the duration of an audio file in seconds."""
        try:
            return librosa.get_duration(path=file_path)
        except Exception as e:
            print(f"Error getting duration: {e}")
            return None