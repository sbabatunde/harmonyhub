import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "HarmonyHub AI Service")
    APP_ENV: str = os.getenv("APP_ENV", "development")
    APP_DEBUG: bool = os.getenv("APP_DEBUG", "true").lower() == "true"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8001))

    BASE_DIR: Path = Path(__file__).parent.parent
    UPLOAD_DIR: Path = BASE_DIR / os.getenv("UPLOAD_DIR", "storage/uploads")
    PROCESSED_DIR: Path = BASE_DIR / os.getenv("PROCESSED_DIR", "storage/processed")
    LYRICS_DIR: Path = BASE_DIR / os.getenv("LYRICS_DIR", "storage/lyrics")
    
    # Laravel storage path for copying AI-processed files
    LARAVEL_STORAGE_PATH: Path = Path(os.getenv(
        "LARAVEL_STORAGE_PATH",
        "C:/xammp/htdocs/HarmonyHub Project/harmonyhub-backend/storage/app/public"
    ))

    DEMUCS_MODEL: str = os.getenv("DEMUCS_MODEL", "htdemucs")
    WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "small")
    OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2")

    LARAVEL_API_URL: str = os.getenv("LARAVEL_API_URL", "http://localhost:8000/api")
    LARAVEL_WEBHOOK_SECRET: str = os.getenv("LARAVEL_WEBHOOK_SECRET", "")

    def ensure_directories(self):
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        self.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
        self.LYRICS_DIR.mkdir(parents=True, exist_ok=True)
        self.LARAVEL_STORAGE_PATH.mkdir(parents=True, exist_ok=True)

settings = Settings()
settings.ensure_directories()