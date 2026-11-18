# harmonyhub-ai-service/scripts/extract_pitch.py
import sys
import json
import librosa
import numpy as np

def extract(audio_path: str) -> list:
    y, sr = librosa.load(audio_path, sr=22050, mono=True)
    f0, voiced, _ = librosa.pyin(
        y,
        fmin=float(librosa.note_to_hz('C2')),
        fmax=float(librosa.note_to_hz('C7')),
        sr=sr,
        frame_length=2048,
    )
    hop_duration = 512 / sr
    curve = []
    for i, (f, v) in enumerate(zip(f0, voiced)):
        if v and f is not None and not np.isnan(f):
            curve.append({
                "t": round(i * hop_duration, 3),
                "freq": round(float(f), 2),
            })
    return curve

if __name__ == "__main__":
    path = sys.argv[1]
    curve = extract(path)
    print(json.dumps(curve))