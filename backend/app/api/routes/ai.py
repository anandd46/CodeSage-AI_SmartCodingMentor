"""
CodeSage AI — AI Core Routes
Debug, Explain, Optimize, Multi-turn Chat, Code Analysis
"""

import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime

from app.core.security import get_current_user
from app.core import database
from app.services import gemini_service
from app.services.analytics_service import analytics_engine

logger = logging.getLogger("codesage.ai")
router = APIRouter(prefix="/api/ai", tags=["AI"])


# ── Request Models ─────────────────────────────────────────────────────────────
class DebugRequest(BaseModel):
    code: str
    language: str = "python"
    error_message: Optional[str] = None
    save_history: bool = True


class ExplainRequest(BaseModel):
    topic: str
    language: str = "English"
    user_level: str = "Beginner"


class OptimizeRequest(BaseModel):
    code: str
    language: str = "python"
    focus: str = "all"  # time | space | readability | all


class ChatMessage(BaseModel):
    role: str  # "user" | "model"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    session_id: Optional[str] = None
    context: str = "general"  # general | dsa | debug | interview


class VoiceRequest(BaseModel):
    transcript: str
    context: str = "general"


# ── Endpoints ─────────────────────────────────────────────────────────────────
@router.post("/debug")
async def debug_code(req: DebugRequest, current_user: dict = Depends(get_current_user)):
    """XAI Debugging — Explainable AI code analysis."""
    logger.info(f"Debug: user={current_user['username']} lang={req.language}")

    if not gemini_service.is_configured():
        return {
            "result": {
                "status": "error",
                "error_detected": "SyntaxError — Mock Response (Add GOOGLE_API_KEY)",
                "error_line": "Line 3",
                "cause": "Assignment operator used inside comparison. Python requires '==' for comparisons.",
                "fix": "Change `n = 1` to `n == 1` on the conditional line.",
                "fixed_code": req.code.replace("= 1", "== 1", 1),
                "example": "Think of '=' as writing in a notebook and '==' as asking a yes/no question.",
                "prevention_tip": "Enable your IDE's linter to catch this automatically.",
                "complexity": {"time": "O(1)", "space": "O(1)", "note": "No complexity concern"},
            }
        }

    try:
        prompt = gemini_service.build_debug_prompt(req.code, req.language, req.error_message)
        result = await gemini_service.generate_json(prompt)

        # Save to coding history
        if req.save_history:
            user_id = str(current_user["_id"])
            await database.coding_history_collection.insert_one({
                "user_id": user_id,
                "type": "debug",
                "language": req.language,
                "code": req.code,
                "error_message": req.error_message,
                "result": result,
                "timestamp": datetime.utcnow(),
            })

        # Award XP
        await analytics_engine.track_event(
            user_id=str(current_user["_id"]),
            action="debug",
            topic=req.language,
            success=result.get("status") != "error",
        )

        return {"result": result}

    except Exception as e:
        logger.error(f"Debug error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/explain")
async def explain_concept(req: ExplainRequest, current_user: dict = Depends(get_current_user)):
    """Multilingual personalized concept explanation."""
    logger.info(f"Explain: topic={req.topic} level={req.user_level}")

    if not gemini_service.is_configured():
        return {
            "concept": req.topic,
            "explanation": f"# {req.topic}\n\n**Mock Mode** — Add GOOGLE_API_KEY for real explanations.\n\nThis is a placeholder.",
        }

    try:
        prompt = gemini_service.build_explain_prompt(req.topic, req.language, req.user_level)
        text = await gemini_service.generate(prompt)

        await analytics_engine.track_event(
            user_id=str(current_user["_id"]),
            action="explain",
            topic=req.topic,
            success=True,
        )

        return {"concept": req.topic, "explanation": text}

    except Exception as e:
        logger.error(f"Explain error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize")
async def optimize_code(req: OptimizeRequest, current_user: dict = Depends(get_current_user)):
    """AI code optimization with multiple optimization strategies."""
    logger.info(f"Optimize: lang={req.language} focus={req.focus}")

    if not gemini_service.is_configured():
        return {
            "original_code": req.code,
            "optimized_code": req.code,
            "improvements": ["Mock mode - Add GOOGLE_API_KEY"],
            "time_complexity_before": "Unknown",
            "time_complexity_after": "Unknown",
            "explanation": "Connect to Gemini for real optimization.",
        }

    focus_map = {
        "time": "Focus heavily on reducing time complexity. Use optimal data structures and algorithms.",
        "space": "Focus on minimizing memory usage. Prefer in-place operations and generators.",
        "readability": "Focus on code clarity: better naming, decomposition, and documentation.",
        "all": "Balance time complexity, space efficiency, and code readability.",
    }

    try:
        prompt = f"""You are a senior software engineer. Optimize this {req.language} code.
{focus_map.get(req.focus, focus_map['all'])}

CRITICAL: Respond ONLY with raw valid JSON (no markdown fences).

Code:
```{req.language}
{req.code}
```

JSON format:
{{
  "optimized_code": "Complete optimized version",
  "improvements": ["improvement 1 with before/after", "improvement 2", "improvement 3"],
  "time_complexity_before": "O(?)",
  "time_complexity_after": "O(?)",
  "space_complexity_before": "O(?)",
  "space_complexity_after": "O(?)",
  "explanation": "Summary of all changes and why they improve the code",
  "key_changes": ["change 1", "change 2"],
  "tradeoffs": "Any tradeoffs made in the optimization"
}}"""

        result = await gemini_service.generate_json(prompt)
        result["original_code"] = req.code

        await analytics_engine.track_event(
            user_id=str(current_user["_id"]),
            action="debug",
            topic=f"optimize_{req.language}",
            success=True,
        )

        return result

    except Exception as e:
        logger.error(f"Optimize error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat")
async def ai_chat(req: ChatRequest, current_user: dict = Depends(get_current_user)):
    """Multi-turn AI tutoring chat with conversation memory."""
    logger.info(f"Chat: user={current_user['username']} context={req.context}")

    if not gemini_service.is_configured():
        return {
            "response": f"Mock response for: '{req.message}'. Add GOOGLE_API_KEY to enable real AI responses.",
            "session_id": req.session_id or "mock-session",
        }

    context_prompts = {
        "general": "You are CodeSage AI, an expert programming mentor. Answer naturally, like a tutor. Be encouraging, concise, and use markdown for code.",
        "dsa": "You are CodeSage AI DSA tutor specializing in Data Structures and Algorithms. Give structured answers with code examples and complexity analysis.",
        "debug": "You are CodeSage AI debugging expert. Help diagnose and fix code issues step-by-step.",
        "interview": "You are CodeSage AI interview coach. Provide structured interview-style guidance and evaluate responses.",
    }

    system_prompt = context_prompts.get(req.context, context_prompts["general"])
    system_prompt += f"\nStudent level: {current_user.get('skill_level', 'Beginner')}. Career goal: {current_user.get('career_goal', 'Not specified')}."

    try:
        messages = [{"role": m.role, "content": m.content} for m in req.history]
        messages.append({"role": "user", "content": req.message})

        response = await gemini_service.chat_with_history(messages, system_prompt)

        # Save to chat history
        user_id = str(current_user["_id"])
        session_id = req.session_id or f"{user_id}_{int(datetime.utcnow().timestamp())}"
        await database.chat_history_collection.update_one(
            {"user_id": user_id, "session_id": session_id},
            {
                "$push": {
                    "messages": {
                        "$each": [
                            {"role": "user", "content": req.message, "timestamp": datetime.utcnow()},
                            {"role": "model", "content": response, "timestamp": datetime.utcnow()},
                        ]
                    }
                },
                "$set": {"updated_at": datetime.utcnow()},
                "$setOnInsert": {"created_at": datetime.utcnow()},
            },
            upsert=True,
        )

        return {"response": response, "session_id": session_id}

    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/voice")
async def voice_assistant(req: VoiceRequest, current_user: dict = Depends(get_current_user)):
    """Process voice transcript and return AI response."""
    if not gemini_service.is_configured():
        return {
            "response": f"Mock voice response for: '{req.transcript}'. Configure GOOGLE_API_KEY.",
            "type": "text",
        }

    try:
        prompt = f"""You are CodeSage AI Voice Assistant — a friendly, concise programming tutor.
The user said: "{req.transcript}"
Context: {req.context}

Respond conversationally (2-4 sentences max for simple questions). Use plain text, no markdown.
If showing code, keep it very brief. Be helpful and encouraging."""

        response = await gemini_service.generate(prompt)
        return {"response": response, "type": "text"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
