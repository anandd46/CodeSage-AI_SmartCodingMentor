"""
CodeSage AI — Gemini AI Service
Multi-turn conversation, structured JSON generation, streaming support.
"""

import json
import logging
from typing import Optional, List, Dict

from app.core.config import settings

logger = logging.getLogger("codesage.gemini")

# ── SDK Initialization ────────────────────────────────────────────────────────
gemini_client = None
_sdk_type = None  # "new" | "legacy" | None


def _init_gemini():
    global gemini_client, _sdk_type
    if not settings.GOOGLE_API_KEY:
        logger.warning("GOOGLE_API_KEY not set — AI features unavailable")
        return

    try:
        from google import genai as google_genai
        gemini_client = google_genai.Client(api_key=settings.GOOGLE_API_KEY)
        _sdk_type = "new"
        logger.info(f"Gemini SDK (new): google-genai | model={settings.GEMINI_MODEL}")
        return
    except (ImportError, Exception):
        pass

    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        gemini_client = genai.GenerativeModel(settings.GEMINI_MODEL)
        _sdk_type = "legacy"
        logger.info("Gemini SDK (legacy): google-generativeai")
    except (ImportError, Exception) as e:
        logger.error(f"Gemini init failed: {e}")


_init_gemini()


def is_configured() -> bool:
    return gemini_client is not None


# ── Core Generation ───────────────────────────────────────────────────────────
async def generate(prompt: str) -> str:
    """Generate text using whichever Gemini SDK is available."""
    if gemini_client is None:
        raise RuntimeError("Gemini client not configured. Set GOOGLE_API_KEY in .env")

    if _sdk_type == "new":
        from google import genai as google_genai
        response = gemini_client.models.generate_content(
            model=settings.GEMINI_MODEL, contents=prompt
        )
        return response.text

    # Legacy SDK
    response = await gemini_client.generate_content_async(prompt)
    return response.text


async def generate_json(prompt: str, fallback: dict = None) -> dict:
    """Generate and parse JSON from Gemini, with fallback on parse failure."""
    try:
        text = await generate(prompt)
        return _parse_json_safe(text)
    except json.JSONDecodeError as e:
        logger.warning(f"JSON parse error: {e}")
        if fallback is not None:
            return fallback
        raise
    except Exception as e:
        logger.error(f"Gemini generation error: {e}")
        raise


def _parse_json_safe(text: str) -> dict:
    """Strip markdown fences and parse JSON."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        # Skip first line (```json or ```) and last line (```)
        start = 1
        end = len(lines) - 1 if lines[-1].strip().startswith("```") else len(lines)
        text = "\n".join(lines[start:end])
    text = text.rstrip("`").strip()
    return json.loads(text)


# ── Multi-turn Chat ───────────────────────────────────────────────────────────
async def chat_with_history(
    messages: List[Dict[str, str]],
    system_prompt: str = "",
) -> str:
    """
    Multi-turn conversation. messages = [{"role": "user"|"model", "content": str}]
    """
    if gemini_client is None:
        raise RuntimeError("Gemini client not configured")

    # Build full prompt with history
    conversation = ""
    if system_prompt:
        conversation += f"[SYSTEM]\n{system_prompt}\n\n"

    for msg in messages:
        role = "User" if msg["role"] == "user" else "Assistant"
        conversation += f"[{role}]\n{msg['content']}\n\n"

    conversation += "[Assistant]\n"
    return await generate(conversation)


# ── Specialized Prompt Builders ───────────────────────────────────────────────
def build_debug_prompt(code: str, language: str, error_message: Optional[str]) -> str:
    error_ctx = f"\nUser-reported error: {error_message}" if error_message else ""
    return f"""You are CodeSage AI, an expert programming mentor specializing in Explainable AI debugging.
Analyze the following {language} code for ALL bugs, logic errors, and performance issues.{error_ctx}

CRITICAL: Respond ONLY with raw valid JSON. No markdown fences.

JSON format:
{{
  "status": "error" | "warning" | "success",
  "error_detected": "Brief error name or 'No Error Found'",
  "error_line": "Line number or range if identifiable",
  "cause": "Step-by-step explanation of WHY the error occurs",
  "fix": "The exact corrected code or precise fix instructions",
  "fixed_code": "Complete corrected version of the code",
  "example": "Real-world analogy to help remember this concept",
  "prevention_tip": "How to avoid this class of error in future",
  "complexity": {{"time": "O(?)", "space": "O(?)", "note": "If relevant"}}
}}

Code:
```{language}
{code}
```"""


def build_explain_prompt(topic: str, language: str, user_level: str) -> str:
    return f"""You are CodeSage AI, an encouraging expert programming mentor.
Explain '{topic}' to a {user_level.lower()}-level programmer.
ENTIRE response MUST be in {language}.

Use markdown. Be engaging, clear, and structured:
1. **Real-World Analogy** — vivid and memorable
2. **Simple Definition** — jargon-free
3. **Why It Matters** — practical use cases
4. **Code Example** — short, working, well-commented
5. **Time & Space Complexity**
6. **Common Mistakes** — 3 pitfalls with fixes
7. **Interview Quick Tips** — 3 bullet points
8. **Related Concepts** — 3 topics to explore next"""


def build_deep_learn_prompt(topic: str, difficulty: str, lang: str) -> str:
    guidance = {
        "Beginner": "Simple language, heavy analogies, minimal jargon, short code.",
        "Intermediate": "Assume basic programming knowledge. Include tradeoffs and complexity.",
        "Advanced": "Edge cases, optimizations, proofs, advanced variants, competitive programming angles.",
    }.get(difficulty, "")

    return f"""You are CodeSage AI, a world-class programming tutor teaching {topic} at {difficulty} level.
{guidance}

Generate a COMPLETE structured learning experience in {lang}.
Respond ONLY with raw valid JSON (no markdown fences).

{{
  "simple_definition": "1-2 sentence clear definition",
  "beginner_explanation": "Plain English for absolute beginners",
  "intermediate_explanation": "For programmers with basics",
  "advanced_explanation": "For experienced developers",
  "analogy": "Vivid real-world analogy",
  "visualization": "ASCII art diagram/tree/graph showing the concept",
  "step_by_step": ["step 1", "step 2", "..."],
  "dry_run": "Trace through a small example with exact variable values",
  "working_code": "Complete working {lang} code with inline comments",
  "brute_force_code": "Naive/brute force solution",
  "optimized_code": "Most optimized version with optimization notes",
  "python_code": "Python implementation",
  "java_code": "Java implementation",
  "cpp_code": "C++ implementation",
  "javascript_code": "JavaScript implementation",
  "time_complexity": "Big-O with best/average/worst breakdown",
  "space_complexity": "Space analysis with explanation",
  "edge_cases": ["edge case 1", "edge case 2", "edge case 3", "edge case 4"],
  "common_mistakes": ["mistake with fix 1", "mistake with fix 2", "mistake with fix 3"],
  "when_to_use": "Specific scenarios where this is optimal",
  "when_not_to_use": "When this approach is suboptimal",
  "advantages": ["advantage 1", "advantage 2", "advantage 3"],
  "disadvantages": ["disadvantage 1", "disadvantage 2"],
  "interview_questions": ["q1", "q2", "q3", "q4", "q5"],
  "interview_variations": ["common variation 1", "common variation 2"],
  "practice_problems": ["Problem - difficulty - brief description", "..."],
  "related_concepts": ["concept 1", "concept 2", "concept 3"],
  "coding_patterns": ["pattern 1", "pattern 2"],
  "difficulty_level": "Easy | Medium | Hard",
  "estimated_learning_time": "e.g. 2 hours",
  "cheat_sheet": "One-paragraph quick reference with key facts",
  "summary": "2-3 sentence memorable takeaway"
}}"""


def build_quiz_prompt(topic: str, difficulty: str, num_questions: int) -> str:
    return f"""Generate {num_questions} multiple-choice quiz questions about {topic} for {difficulty} level.
Respond ONLY with raw valid JSON (no markdown fences).

{{
  "questions": [
    {{
      "question": "Question text",
      "options": ["option A", "option B", "option C", "option D"],
      "correct": 0,
      "explanation": "Why correct and why others are wrong",
      "topic_tag": "sub-topic this tests",
      "difficulty": "Easy|Medium|Hard"
    }}
  ]
}}

Make questions progressively harder. Test understanding, not memorization."""


def build_practice_problem_prompt(topic: str, difficulty: str, language: str) -> str:
    return f"""Generate an original {difficulty} coding problem about {topic} solvable in {language}.
Style: LeetCode/HackerRank quality. Respond ONLY with raw valid JSON (no markdown fences).

{{
  "title": "Problem Title",
  "difficulty": "{difficulty}",
  "topic": "{topic}",
  "description": "Complete problem statement with clear I/O spec",
  "examples": [
    {{"input": "example", "output": "expected", "explanation": "why"}}
  ],
  "constraints": ["constraint 1", "constraint 2"],
  "hints": ["vague hint", "moderate hint", "direct hint"],
  "starter_code": "starter function/class in {language}",
  "test_cases": [
    {{"input": "test input", "expected": "expected output"}}
  ],
  "solution_approach": "Approach without full code",
  "brute_force_approach": "Simple O(n^2) or naive approach",
  "optimal_approach": "Optimal approach with complexity",
  "time_complexity": "O(?)",
  "space_complexity": "O(?)"
}}"""


def build_roadmap_prompt(
    skill_level: str, career_goal: str,
    weak_topics: list, completed_topics: list,
    hours_per_week: int
) -> str:
    return f"""Create a personalized learning roadmap for: {career_goal}
Skill level: {skill_level}
Available: {hours_per_week} hrs/week
Completed: {', '.join(completed_topics) or 'Nothing yet'}
Weak areas: {', '.join(weak_topics) or 'Not assessed'}

Respond ONLY with raw valid JSON (no markdown fences).

{{
  "career_goal": "{career_goal}",
  "total_weeks": 0,
  "phases": [
    {{
      "phase": 1,
      "title": "Phase title",
      "weeks": 0,
      "topics": ["topic 1", "topic 2"],
      "resources": ["resource 1", "resource 2"],
      "milestone": "Achievement by end of phase",
      "estimated_hours": 0,
      "priority_topics": ["highest priority topics"]
    }}
  ],
  "weak_topic_plan": [
    {{"topic": "weak", "plan": "specific plan", "priority": "High|Medium|Low", "estimated_hours": 0}}
  ],
  "daily_schedule": "Recommended daily routine breakdown",
  "next_topic": "Very first topic to start RIGHT NOW",
  "quick_wins": ["easy win 1 to build momentum", "easy win 2"],
  "estimated_completion": "Human-readable estimate"
}}"""
