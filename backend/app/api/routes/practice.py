"""
CodeSage AI — Practice Routes
Problem generation, hints, solution evaluation, code execution
"""

import logging
import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.core.security import get_current_user
from app.services import gemini_service, code_execution_service
from app.services.analytics_service import analytics_engine

logger = logging.getLogger("codesage.practice")
router = APIRouter(prefix="/api/practice", tags=["Practice"])


# ── Request Models ─────────────────────────────────────────────────────────────
class PracticeRequest(BaseModel):
    topic: str = "Arrays"
    difficulty: str = "Easy"  # Easy | Medium | Hard
    language: str = "python"


class HintRequest(BaseModel):
    problem: str
    partial_solution: Optional[str] = None
    hint_level: int = 1  # 1=gentle, 2=moderate, 3=direct


class EvaluateRequest(BaseModel):
    problem: str
    solution: str
    language: str = "python"
    expected_output: Optional[str] = None


class ExecuteRequest(BaseModel):
    code: str
    language: str = "python"
    stdin: str = ""


# ── Endpoints ──────────────────────────────────────────────────────────────────
@router.post("/generate")
async def generate_problem(req: PracticeRequest, current_user: dict = Depends(get_current_user)):
    """Generate a LeetCode-style coding problem."""
    logger.info(f"Practice generate: topic={req.topic} difficulty={req.difficulty}")

    if not gemini_service.is_configured():
        return {
            "id": "mock-001",
            "title": f"Mock {req.topic} Problem",
            "difficulty": req.difficulty,
            "topic": req.topic,
            "description": f"Given an array of integers, solve a classic {req.topic} problem.",
            "examples": [{"input": "[1, 2, 3]", "output": "6", "explanation": "Sum of all elements"}],
            "constraints": ["1 ≤ n ≤ 10⁵", "0 ≤ arr[i] ≤ 10⁹"],
            "hints": ["Think brute force first", "Can you use a hash map?", "O(n) is achievable"],
            "starter_code": "def solve(arr):\n    # Write your solution here\n    pass",
            "test_cases": [{"input": "[1, 2, 3]", "expected": "6"}],
            "time_complexity": "O(n)",
            "space_complexity": "O(1)",
        }

    try:
        prompt = gemini_service.build_practice_problem_prompt(req.topic, req.difficulty, req.language)
        data = await gemini_service.generate_json(prompt)
        data["id"] = str(uuid.uuid4())[:8]

        return data

    except Exception as e:
        logger.error(f"Practice generate error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/hint")
async def get_hint(req: HintRequest, current_user: dict = Depends(get_current_user)):
    """Get a progressive hint (gentle → moderate → direct)."""
    if not gemini_service.is_configured():
        hints = [
            "Think about what data structure would help you look up values in O(1) time.",
            "A hash map can store values as keys so you can check for complements instantly.",
            "Iterate once: for each element, check if (target - element) exists in your hash map.",
        ]
        return {"hint": hints[min(req.hint_level - 1, 2)], "hint_level": req.hint_level}

    level_desc = {
        1: "very subtle — just nudge them in the right direction, do NOT reveal the approach",
        2: "moderate — suggest the general approach/data structure, no code",
        3: "direct — nearly give the answer, include a code snippet showing the key idea",
    }

    try:
        partial_ctx = f"\nPartial solution so far:\n```\n{req.partial_solution}\n```" if req.partial_solution else ""
        prompt = f"""A student is stuck on this problem:
{req.problem}{partial_ctx}

Give a level {req.hint_level} hint ({level_desc[req.hint_level]}).
Be encouraging. Do NOT give the complete solution.
Respond ONLY with raw valid JSON (no markdown fences).

{{"hint": "your hint", "next_step": "what to think about next", "encourage": "brief encouraging message"}}"""

        data = await gemini_service.generate_json(prompt)
        return {"hint_level": req.hint_level, **data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/evaluate")
async def evaluate_solution(req: EvaluateRequest, current_user: dict = Depends(get_current_user)):
    """AI evaluates submitted solution for correctness and quality."""
    if not gemini_service.is_configured():
        return {
            "correct": True,
            "score": 85,
            "verdict": "Accepted",
            "feedback": "Good solution! Consider edge cases for empty input.",
            "time_complexity": "O(n)",
            "space_complexity": "O(1)",
            "improvements": ["Handle empty array", "Add input validation"],
            "optimized_solution": "def solve(arr):\n    return sum(arr)",
        }

    try:
        prompt = f"""You are a senior engineer evaluating a {req.language} solution.

Problem: {req.problem}

Student's solution:
```{req.language}
{req.solution}
```

Evaluate rigorously but fairly. Respond ONLY with raw valid JSON (no markdown fences).

{{
  "correct": true/false,
  "score": 0-100,
  "verdict": "Accepted|Wrong Answer|Time Limit Exceeded|Runtime Error|Partially Correct",
  "feedback": "Detailed personalized feedback",
  "time_complexity": "Student's solution complexity",
  "space_complexity": "Student's space usage",
  "improvements": ["specific improvement 1", "improvement 2"],
  "optimized_solution": "Better version if applicable (complete code)",
  "test_results": [
    {{"test": "basic case", "passed": true, "notes": "why"}},
    {{"test": "edge case", "passed": false, "notes": "what fails"}}
  ],
  "bugs_found": ["specific bug if any"],
  "best_approach": "What the optimal approach would be"
}}"""

        data = await gemini_service.generate_json(prompt)

        await analytics_engine.track_event(
            user_id=str(current_user["_id"]),
            action="practice_solve" if data.get("correct") else "practice_attempt",
            topic="practice",
            success=data.get("correct", False),
        )

        return data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute")
async def execute_code(req: ExecuteRequest, current_user: dict = Depends(get_current_user)):
    """Execute code via Judge0 API."""
    logger.info(f"Execute: lang={req.language} user={current_user['username']}")

    result = await code_execution_service.execute_code(
        code=req.code,
        language=req.language,
        stdin=req.stdin,
    )

    await analytics_engine.track_event(
        user_id=str(current_user["_id"]),
        action="run_code",
        topic=req.language,
        success=result.get("status") == "success",
    )

    return result
