import json
import logging
from typing import List, Dict, Any
import httpx
from app.config import settings
from app.models.schemas import CoachRequest, CoachResponse

logger = logging.getLogger(__name__)


class AICoachService:
    """Service for generating AI coaching feedback."""

    def __init__(self):
        # Was hardcoded to "http://localhost:11434" — pulled from settings
        # for consistency with the rest of the app (WHISPER_MODEL,
        # LARAVEL_WEBHOOK_SECRET, etc. all come from settings already).
        # Add OLLAMA_URL to app/config.py with a default of
        # "http://localhost:11434" if it isn't there yet.
        self.ollama_url = settings.OLLAMA_URL

    async def get_coaching_feedback(self, request: CoachRequest) -> CoachResponse:
        """Generate coaching feedback based on practice data."""
        try:
            response = await self._get_ollama_response(request.practice_data)
        except Exception as e:
            # Previously a bare `except Exception: pass`-equivalent — an
            # Ollama outage or malformed response looked identical to
            # "working as intended." Now it's visible in logs.
            logger.warning(f"Ollama request failed, using fallback feedback: {e}")
            response = self._generate_fallback_feedback(request.practice_data)

        return response

    def _build_prompt(self, practice_data: Dict[str, Any]) -> str:
        return f"""You are HarmonyHub's AI vocal coach. Analyze the following practice data
and respond with ONLY a JSON object, no other text, no markdown code fences,
matching this exact shape:

{{
  "feedback": "2-3 sentence overall summary of how this chorister is doing",
  "suggestions": ["specific actionable tip", "specific actionable tip", "specific actionable tip"],
  "encouragement": "one warm, specific encouraging sentence",
  "areas_to_improve": ["area 1", "area 2"],
  "strengths": ["strength 1", "strength 2"],
  "next_steps": ["concrete next step 1", "concrete next step 2"]
}}

Base every field on the actual numbers below — never invent statistics that
aren't given to you. Keep the tone positive and encouraging, like a
supportive choir director, but specific rather than generic.

Practice Data:
{json.dumps(practice_data, indent=2)}
"""

    async def _get_ollama_response(self, practice_data: Dict[str, Any]) -> CoachResponse:
        """Get a structured response from Ollama.

        Uses Ollama's `format: "json"` mode so the model is constrained to
        return valid JSON directly, rather than free text we'd have to
        parse apart afterward (the previous _parse_ai_response() never
        actually did that parsing — it returned hardcoded placeholder
        fields for everything except the raw truncated text).
        """
        prompt = self._build_prompt(practice_data)

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": prompt,
                    "format": "json",
                    "stream": False,
                },
            )
            response.raise_for_status()
            result = response.json()

        raw_text = result.get("response", "{}")

        try:
            parsed = json.loads(raw_text)
        except json.JSONDecodeError as e:
            # Even with format="json", a model can occasionally wrap output
            # in markdown fences or add stray text. Fail loudly here so the
            # caller's except block routes to the rule-based fallback,
            # rather than silently returning an empty/wrong CoachResponse.
            raise ValueError(f"Ollama did not return valid JSON: {e}\nRaw: {raw_text[:200]}")

        return CoachResponse(
            feedback=parsed.get("feedback", ""),
            suggestions=parsed.get("suggestions", []),
            encouragement=parsed.get("encouragement", ""),
            areas_to_improve=parsed.get("areas_to_improve", []),
            strengths=parsed.get("strengths", []),
            next_steps=parsed.get("next_steps", []),
        )

    def _generate_fallback_feedback(self, practice_data: Dict[str, Any]) -> CoachResponse:
        """Generate rule-based feedback when AI is unavailable."""
        total_sessions = practice_data.get("total_sessions", 0)
        avg_accuracy = practice_data.get("average_accuracy", 0)
        streak = practice_data.get("streak_days", 0)

        strengths = []
        if avg_accuracy >= 70:
            strengths.append("Good pitch accuracy")
        if streak >= 3:
            strengths.append(f"Consistent practice ({streak} day streak!)")
        if not strengths:
            strengths = ["Starting your vocal journey"]

        areas = []
        if avg_accuracy < 70:
            areas.append("Pitch accuracy")
        if streak < 3:
            areas.append("Practice consistency")
        if not areas:
            areas = ["Advanced techniques"]

        return CoachResponse(
            feedback=f"Based on your {total_sessions} practice sessions with {avg_accuracy}% average accuracy...",
            suggestions=[
                "Practice with the Pitch Perfect game for 10 minutes daily",
                "Focus on breath control before singing",
                "Use the loop feature for difficult sections",
            ],
            encouragement=f"Keep going! Your {streak} day streak shows dedication!",
            areas_to_improve=areas,
            strengths=strengths,
            next_steps=[
                "Complete your next curriculum stage",
                "Practice for at least 15 minutes today",
            ],
        )