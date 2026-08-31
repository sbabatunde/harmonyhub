from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime


class KaraokeStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class KaraokeRequest(BaseModel):
    song_id: int
    audio_url: str
    callback_url: Optional[str] = None
    language: str = "en"


class KaraokeResponse(BaseModel):
    task_id: str
    status: KaraokeStatus
    message: str = ""


class LyricsSegment(BaseModel):
    start: float
    end: float
    text: str
    confidence: Optional[float] = None


class KaraokeResult(BaseModel):
    model_config = ConfigDict(json_encoders={datetime: lambda v: v.isoformat()})
    
    song_id: int
    status: KaraokeStatus
    instrumental_path: Optional[str] = None
    vocal_path: Optional[str] = None
    lyrics: List[LyricsSegment] = []
    parts: Optional[Dict[str, str]] = None
    error: Optional[str] = None
    processed_at: datetime = Field(default_factory=datetime.now)


class CoachRequest(BaseModel):
    user_id: int
    practice_data: Dict[str, Any]


class CoachResponse(BaseModel):
    feedback: str
    suggestions: List[str]
    encouragement: str
    areas_to_improve: List[str]
    strengths: List[str]
    next_steps: List[str]


class HealthResponse(BaseModel):
    status: str
    version: str = "1.0.0"
    service: str = "HarmonyHub AI Service"