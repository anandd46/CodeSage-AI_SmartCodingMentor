"""
CodeSage AI — Interview Routes
Mock interviews, question generation, answer evaluation, session reports
"""

import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime

from app.core.security import get_current_user
from app.services import gemini_service
from app.services.analytics_service import analytics_engine

logger = logging.getLogger("codesage.interview")
router = APIRouter(prefix="/api/interview", tags=["Interview"])


# ── Request Models ─────────────────────────────────────────────────────────────
class InterviewRequest(BaseModel):
    category: str = "DSA"  # DSA | Behavioral | System Design | OOP | DBMS | OS | CN | HR
    difficulty: str = "Medium"  # Easy | Medium | Hard
    topic: Optional[str] = None


class EvaluateAnswerRequest(BaseModel):
    question: str
    answer: str
    category: str = "DSA"
    difficulty: str = "Medium"


class MockInterviewRequest(BaseModel):
    role: str = "Software Engineer"
    difficulty: str = "Medium"
    num_questions: int = 5
    focus_areas: List[str] = []


class InterviewAnswerSession(BaseModel):
    question: str
    answer: str
    time_taken_seconds: int
    category: str


# ── Endpoints ──────────────────────────────────────────────────────────────────
@router.post("/question")
async def get_interview_question(req: InterviewRequest, current_user: dict = Depends(get_current_user)):
    """Generate a single realistic interview question."""
    logger.info(f"Interview Q: cat={req.category} diff={req.difficulty}")

    if not gemini_service.is_configured():
        return {
            "category": req.category,
            "difficulty": req.difficulty,
            "question": f"Explain {req.topic or req.category} and its real-world applications. (Mock Mode)",
            "hints": ["Think about time complexity", "Consider edge cases"],
            "expected_topics": ["Definition", "Examples", "Complexity"],
            "follow_up": "Can you optimize your solution?",
            "ideal_answer_outline": "Strong answer: definition, example, complexity, tradeoffs",
        }

    try:
        topic_ctx = f" specifically about {req.topic}" if req.topic else ""
        prompt = f"""Generate a realistic {req.difficulty} {req.category} interview question{topic_ctx} for a Software Engineering role.
Respond ONLY with raw valid JSON (no markdown fences).

{{
  "question": "The interview question (include code snippet if relevant)",
  "category": "{req.category}",
  "difficulty": "{req.difficulty}",
  "hints": ["subtle hint 1", "subtle hint 2"],
  "expected_topics": ["topic the interviewer wants 1", "topic 2", "topic 3"],
  "follow_up": "Natural follow-up question",
  "ideal_answer_outline": "What a perfect answer covers (bullet points)",
  "time_limit_minutes": 10,
  "difficulty_reason": "Why this is {req.difficulty} difficulty"
}}"""

        data = await gemini_service.generate_json(prompt)
        return data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/evaluate")
async def evaluate_answer(req: EvaluateAnswerRequest, current_user: dict = Depends(get_current_user)):
    """AI evaluates an interview answer with detailed feedback."""
    logger.info(f"Evaluate answer: cat={req.category}")

    if not gemini_service.is_configured():
        return {
            "score": 7,
            "rating": "Good",
            "strengths": ["Clear explanation", "Good examples"],
            "improvements": ["Add complexity analysis", "Mention edge cases"],
            "ideal_answer": "A complete answer: definition, example, complexity, edge cases, tradeoffs.",
            "feedback": "Good start! Focus on time complexity and edge cases in real interviews.",
            "missing_concepts": ["Time complexity", "Edge cases"],
        }

    try:
        prompt = f"""You are a senior software engineer evaluating a {req.difficulty} {req.category} interview answer.

Question: {req.question}
Candidate's Answer: {req.answer}

Evaluate rigorously but fairly. Respond ONLY with raw valid JSON (no markdown fences).

{{
  "score": 1-10,
  "rating": "Poor|Fair|Good|Excellent",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["specific improvement 1", "improvement 2"],
  "missing_concepts": ["missed concept 1", "missed concept 2"],
  "ideal_answer": "What a perfect 10/10 answer would include",
  "feedback": "Personalized encouraging 2-3 sentence overall feedback",
  "would_pass": true/false,
  "interviewer_impression": "What the interviewer would think"
}}"""

        data = await gemini_service.generate_json(prompt)
        return data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mock")
async def create_mock_interview(req: MockInterviewRequest, current_user: dict = Depends(get_current_user)):
    """Create a full mock interview session with mixed question types."""
    logger.info(f"Mock interview: role={req.role} diff={req.difficulty}")

    if not gemini_service.is_configured():
        return {
            "role": req.role,
            "difficulty": req.difficulty,
            "estimated_duration_minutes": 45,
            "questions": [
                {"id": 1, "category": "Behavioral", "question": "Tell me about yourself.", "time_limit": 120, "difficulty": "Easy"},
                {"id": 2, "category": "DSA", "question": "Implement a stack using arrays.", "time_limit": 300, "difficulty": "Medium"},
                {"id": 3, "category": "System Design", "question": "Design a URL shortener.", "time_limit": 600, "difficulty": "Medium"},
            ]
        }

    try:
        focus = f"Focus areas: {', '.join(req.focus_areas)}." if req.focus_areas else ""
        prompt = f"""Generate a {req.num_questions}-question mock interview for a {req.role} role at {req.difficulty} difficulty.
{focus}
Include a realistic mix: Behavioral (1-2), Technical/DSA (2-3), and role-specific questions.
Respond ONLY with raw valid JSON (no markdown fences).

{{
  "role": "{req.role}",
  "difficulty": "{req.difficulty}",
  "estimated_duration_minutes": 0,
  "questions": [
    {{
      "id": 1,
      "category": "Behavioral|DSA|System Design|OOP|Technical|DBMS|OS|CN",
      "question": "The question text",
      "time_limit": 180,
      "difficulty": "Easy|Medium|Hard",
      "hints": ["hint 1"],
      "scoring_criteria": "What makes a good answer"
    }}
  ],
  "tips": ["tip for this specific role", "tip 2"],
  "common_mistakes": ["mistake to avoid 1", "mistake 2"]
}}"""

        data = await gemini_service.generate_json(prompt)

        await analytics_engine.track_event(
            user_id=str(current_user["_id"]),
            action="interview_complete",
            topic=req.role,
            success=True,
        )

        return data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/session-report")
async def generate_session_report(
    answers: List[InterviewAnswerSession],
    current_user: dict = Depends(get_current_user)
):
    """Generate a comprehensive post-interview session report."""
    if not gemini_service.is_configured():
        return {
            "overall_score": 7.5,
            "summary": "Good performance overall. Work on system design depth.",
            "strengths": ["Clear communication", "Good DSA knowledge"],
            "areas_to_improve": ["System design", "Behavioral answers need more structure"],
            "next_steps": ["Study distributed systems", "Practice STAR method"],
        }

    try:
        qa_text = "\n\n".join([
            f"Q ({a.category}): {a.question}\nA: {a.answer}\nTime: {a.time_taken_seconds}s"
            for a in answers
        ])

        prompt = f"""Analyze this mock interview session and generate a comprehensive performance report.

Interview Q&A:
{qa_text}

Respond ONLY with raw valid JSON (no markdown fences).

{{
  "overall_score": 0.0-10.0,
  "summary": "2-3 sentence overall assessment",
  "category_scores": {{"DSA": 8, "Behavioral": 7, "System Design": 6}},
  "strengths": ["specific strength 1", "strength 2", "strength 3"],
  "areas_to_improve": ["area 1 with specific advice", "area 2"],
  "next_steps": ["actionable step 1", "actionable step 2", "actionable step 3"],
  "study_resources": ["resource 1", "resource 2"],
  "estimated_ready_for_interview": "X weeks of focused preparation",
  "encouragement": "Motivating closing message"
}}"""

        data = await gemini_service.generate_json(prompt)
        return data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
