# IMPORTANT: this event loop policy fix must run before uvicorn/asyncio does
import sys
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import uuid
from app.config import settings
from app.models.schemas import (
    KaraokeRequest,
    KaraokeResponse,
    KaraokeStatus,
    CoachRequest,
    CoachResponse,
    HealthResponse,
)
from app.services.karaoke_service import KaraokeService
from app.services.ai_coach_service import AICoachService

app = FastAPI(
    title="HarmonyHub AI Service",
    description="AI services for HarmonyHub music education platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

karaoke_service = KaraokeService()
ai_coach_service = AICoachService()

tasks = {}

# Global flag to prevent concurrent processing
is_processing = False
processing_lock = asyncio.Lock()


@app.get("/", response_model=HealthResponse)
async def root():
    return HealthResponse(status="running")


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="healthy")


@app.post("/karaoke/process", response_model=KaraokeResponse)
async def process_karaoke(request: KaraokeRequest, background_tasks: BackgroundTasks):
    """Process a song for karaoke (one at a time)."""
    global is_processing
    
    # Check if another song is already processing
    if is_processing:
        return KaraokeResponse(
            task_id="rejected",
            status=KaraokeStatus.FAILED,
            message="Another song is already being processed. Please wait for it to finish.",
        )
    
    is_processing = True
    task_id = str(uuid.uuid4())
    tasks[task_id] = {"status": KaraokeStatus.PROCESSING}
    
    async def process_with_cleanup():
        global is_processing
        try:
            await karaoke_service.process_song(request)
        finally:
            is_processing = False
            tasks[task_id]["status"] = KaraokeStatus.READY if tasks.get(task_id) else KaraokeStatus.FAILED
    
    background_tasks.add_task(process_with_cleanup)
    
    return KaraokeResponse(
        task_id=task_id,
        status=KaraokeStatus.PROCESSING,
        message="Karaoke processing started",
    )


@app.get("/karaoke/status/{task_id}")
async def get_karaoke_status(task_id: str):
    """Get karaoke processing status."""
    task = tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@app.post("/coach/feedback", response_model=CoachResponse)
async def get_coach_feedback(request: CoachRequest):
    """Get AI coaching feedback."""
    return await ai_coach_service.get_coaching_feedback(request)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.APP_DEBUG,
    )