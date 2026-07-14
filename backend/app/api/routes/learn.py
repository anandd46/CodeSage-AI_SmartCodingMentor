"""
CodeSage AI — Learning Routes
DSA topics, Quiz, Flashcards, Notes, Cheat Sheets, Roadmap, Code Examples
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

logger = logging.getLogger("codesage.learn")
router = APIRouter(prefix="/api/learn", tags=["Learning"])


# ── Request Models ─────────────────────────────────────────────────────────────
class LearnRequest(BaseModel):
    topic: str
    difficulty: str = "Beginner"
    language: str = "python"


class QuizRequest(BaseModel):
    topic: str
    difficulty: str = "Beginner"
    num_questions: int = 5


class FlashcardRequest(BaseModel):
    topic: str
    num_cards: int = 10


class NotesRequest(BaseModel):
    topic: str
    detail_level: str = "Detailed"  # Quick | Detailed | Comprehensive


class CheatSheetRequest(BaseModel):
    subject: str


class RoadmapRequest(BaseModel):
    skill_level: str = "Beginner"
    career_goal: str = "Full Stack Developer"
    weak_topics: List[str] = []
    completed_topics: List[str] = []
    available_hours_per_week: int = 10


class MarkTopicRequest(BaseModel):
    topic: str
    completed: bool = True


# ── DSA Topic Catalog ──────────────────────────────────────────────────────────
DSA_TOPICS = {
    "Arrays": {"icon": "📊", "difficulty": "Beginner", "category": "Data Structures", "description": "Foundation of all data structures"},
    "Strings": {"icon": "🔤", "difficulty": "Beginner", "category": "Data Structures", "description": "Character sequences and manipulation"},
    "Linked Lists": {"icon": "🔗", "difficulty": "Beginner", "category": "Data Structures", "description": "Dynamic linear data structures"},
    "Stacks": {"icon": "📚", "difficulty": "Beginner", "category": "Data Structures", "description": "LIFO principle and applications"},
    "Queues": {"icon": "🚶", "difficulty": "Beginner", "category": "Data Structures", "description": "FIFO principle and variants"},
    "Binary Trees": {"icon": "🌳", "difficulty": "Intermediate", "category": "Trees", "description": "Hierarchical data structures"},
    "BST": {"icon": "🔍", "difficulty": "Intermediate", "category": "Trees", "description": "Binary Search Trees operations"},
    "AVL Trees": {"icon": "⚖️", "difficulty": "Advanced", "category": "Trees", "description": "Self-balancing BSTs"},
    "Heaps": {"icon": "🏔️", "difficulty": "Intermediate", "category": "Trees", "description": "Priority queues and heap sort"},
    "Trie": {"icon": "📝", "difficulty": "Advanced", "category": "Trees", "description": "Prefix trees for string processing"},
    "Hash Tables": {"icon": "#️⃣", "difficulty": "Intermediate", "category": "Data Structures", "description": "O(1) lookup data structures"},
    "Graphs": {"icon": "🕸️", "difficulty": "Advanced", "category": "Graphs", "description": "Networks of nodes and edges"},
    "BFS": {"icon": "🌊", "difficulty": "Intermediate", "category": "Graphs", "description": "Breadth-First Search traversal"},
    "DFS": {"icon": "🔽", "difficulty": "Intermediate", "category": "Graphs", "description": "Depth-First Search traversal"},
    "Dijkstra": {"icon": "🗺️", "difficulty": "Advanced", "category": "Graphs", "description": "Shortest path algorithm"},
    "Recursion": {"icon": "🔄", "difficulty": "Beginner", "category": "Algorithms", "description": "Functions calling themselves"},
    "Backtracking": {"icon": "↩️", "difficulty": "Intermediate", "category": "Algorithms", "description": "Brute force with pruning"},
    "Dynamic Programming": {"icon": "💡", "difficulty": "Advanced", "category": "Algorithms", "description": "Optimal substructure memoization"},
    "Greedy Algorithms": {"icon": "💰", "difficulty": "Intermediate", "category": "Algorithms", "description": "Locally optimal choices"},
    "Binary Search": {"icon": "🎯", "difficulty": "Beginner", "category": "Algorithms", "description": "Divide and conquer search"},
    "Sorting": {"icon": "🔢", "difficulty": "Beginner", "category": "Algorithms", "description": "Ordering algorithms and analysis"},
    "Two Pointers": {"icon": "👈👉", "difficulty": "Intermediate", "category": "Patterns", "description": "Linear time array patterns"},
    "Sliding Window": {"icon": "🪟", "difficulty": "Intermediate", "category": "Patterns", "description": "Subarray/substring problems"},
    "Bit Manipulation": {"icon": "💻", "difficulty": "Advanced", "category": "Algorithms", "description": "Bitwise operations and tricks"},
    "Union Find": {"icon": "🔗", "difficulty": "Advanced", "category": "Algorithms", "description": "Disjoint sets data structure"},
    "Segment Tree": {"icon": "🌲", "difficulty": "Advanced", "category": "Advanced DS", "description": "Range query data structure"},
    "Topological Sort": {"icon": "📋", "difficulty": "Advanced", "category": "Graphs", "description": "Dependency ordering"},
    "Math": {"icon": "➗", "difficulty": "Intermediate", "category": "Mathematics", "description": "Number theory and math tricks"},
    "OOP": {"icon": "🏗️", "difficulty": "Beginner", "category": "Concepts", "description": "Object-oriented design principles"},
    "System Design": {"icon": "🏛️", "difficulty": "Advanced", "category": "Concepts", "description": "Scalable system architecture"},
}


# ── Endpoints ──────────────────────────────────────────────────────────────────
@router.get("/topics")
async def get_topic_catalog(current_user: dict = Depends(get_current_user)):
    """Return all DSA topics with user progress."""
    completed = set(current_user.get("completed_topics", []))
    result = []
    for name, meta in DSA_TOPICS.items():
        result.append({
            "name": name,
            "icon": meta["icon"],
            "difficulty": meta["difficulty"],
            "category": meta["category"],
            "description": meta["description"],
            "completed": name in completed,
        })
    return {"topics": result, "total": len(result), "completed_count": len(completed)}


@router.post("/explain")
async def learn_topic(req: LearnRequest, current_user: dict = Depends(get_current_user)):
    """Full 40-point deep-dive learning experience for any topic."""
    logger.info(f"Learn: topic={req.topic} difficulty={req.difficulty}")

    if not gemini_service.is_configured():
        return {
            "topic": req.topic,
            "difficulty": req.difficulty,
            "content": {
                "simple_definition": f"**{req.topic}** is a fundamental concept. (Mock Mode — add GOOGLE_API_KEY)",
                "analogy": "Think of it like organizing books on a shelf.",
                "visualization": "[ A ] -> [ B ] -> [ C ] -> [ D ]",
                "step_by_step": ["Step 1: Understand", "Step 2: Practice", "Step 3: Apply"],
                "working_code": f"# {req.topic} example\ndef example():\n    pass",
                "time_complexity": "O(n)",
                "space_complexity": "O(1)",
                "edge_cases": ["Empty input", "Single element"],
                "common_mistakes": ["Off-by-one errors"],
                "interview_questions": [f"What is {req.topic}?"],
                "practice_problems": ["LeetCode #1 - Two Sum"],
                "cheat_sheet": f"{req.topic} quick reference",
                "summary": f"{req.topic} is essential for technical interviews.",
            }
        }

    try:
        prompt = gemini_service.build_deep_learn_prompt(req.topic, req.difficulty, req.language)
        content = await gemini_service.generate_json(prompt)

        # Track learning
        await analytics_engine.track_event(
            user_id=str(current_user["_id"]),
            action="learn_topic",
            topic=req.topic,
            success=True,
        )

        return {"topic": req.topic, "difficulty": req.difficulty, "content": content}

    except Exception as e:
        logger.error(f"Learn error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/quiz")
async def generate_quiz(req: QuizRequest, current_user: dict = Depends(get_current_user)):
    """Generate an adaptive MCQ quiz."""
    logger.info(f"Quiz: topic={req.topic}")

    if not gemini_service.is_configured():
        return {
            "topic": req.topic,
            "difficulty": req.difficulty,
            "questions": [{
                "question": f"What is the time complexity of a common {req.topic} operation?",
                "options": ["O(1)", "O(log n)", "O(n)", "O(n²)"],
                "correct": 1,
                "explanation": "Depends on the operation — this is mock data.",
                "topic_tag": req.topic,
                "difficulty": req.difficulty,
            }]
        }

    try:
        prompt = gemini_service.build_quiz_prompt(req.topic, req.difficulty, req.num_questions)
        data = await gemini_service.generate_json(prompt)

        await analytics_engine.track_event(
            user_id=str(current_user["_id"]),
            action="quiz_complete",
            topic=req.topic,
            success=True,
        )

        return {"topic": req.topic, "difficulty": req.difficulty, **data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/flashcards")
async def generate_flashcards(req: FlashcardRequest, current_user: dict = Depends(get_current_user)):
    """Generate spaced-repetition flashcards."""
    logger.info(f"Flashcards: topic={req.topic}")

    if not gemini_service.is_configured():
        return {
            "topic": req.topic,
            "cards": [
                {"front": f"What is {req.topic}?", "back": "A fundamental data structure/algorithm (Mock Mode)."},
                {"front": "What is the time complexity?", "back": "Varies by operation."},
            ]
        }

    try:
        prompt = f"""Generate {req.num_cards} flashcards for studying {req.topic}.
Each card: question/term front, brief memorable answer back (1-3 sentences max).
Cover: definition, complexity, use cases, properties, operations, edge cases, interview tips.
Respond ONLY with raw valid JSON (no markdown fences).

{{"cards": [{{"front": "Question", "back": "Answer", "category": "definition|complexity|usage|trick"}}]}}"""

        data = await gemini_service.generate_json(prompt)
        return {"topic": req.topic, **data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notes")
async def generate_notes(req: NotesRequest, current_user: dict = Depends(get_current_user)):
    """Generate structured markdown study notes."""
    logger.info(f"Notes: topic={req.topic} level={req.detail_level}")

    if not gemini_service.is_configured():
        return {
            "topic": req.topic,
            "notes": f"# {req.topic}\n\n**Mock Mode** — Add GOOGLE_API_KEY\n\n## Definition\n...\n\n## Examples\n```python\n# code here\n```",
        }

    try:
        depth_map = {
            "Quick": "Concise 1-page reference notes",
            "Detailed": "Thorough notes with examples and diagrams",
            "Comprehensive": "Exhaustive coverage with all edge cases, variants, and interview tips",
        }
        depth = depth_map.get(req.detail_level, "Thorough notes")

        prompt = f"""Generate {depth} for: {req.topic}
Format as clean, well-structured Markdown for study.

Include (adjust depth for {req.detail_level} level):
# {req.topic} — Overview & Definition
## Why It Matters
## Key Concepts & Properties
## Syntax / API (if applicable)
## Examples with Code (well-commented)
## Visual Representation (ASCII)
## Time & Space Complexity Table
## Common Patterns
## Tips & Tricks
## Common Mistakes ⚠️
## Interview Talking Points 🎯
## Quick Revision Summary

Use emojis, tables, and code blocks. Make it scannable and memorable."""

        text = await gemini_service.generate(prompt)
        return {"topic": req.topic, "detail_level": req.detail_level, "notes": text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cheatsheet")
async def generate_cheatsheet(req: CheatSheetRequest, current_user: dict = Depends(get_current_user)):
    """Generate a dense, practical cheat sheet."""
    logger.info(f"Cheatsheet: {req.subject}")

    if not gemini_service.is_configured():
        return {
            "subject": req.subject,
            "content": f"# {req.subject} Cheat Sheet\n\n## Basics\n- Key concept 1\n\n## Syntax\n```\ncode\n```",
        }

    try:
        prompt = f"""Generate a comprehensive cheat sheet for {req.subject}.
Format: Clean Markdown. Dense useful info — this is a reference, not a tutorial.

Include:
- Syntax examples in code blocks
- Complexity tables (for DS/Algo)
- Most-used commands/functions with examples
- Common patterns and idioms
- Gotchas and warnings ⚠️
- One-liners

For programming languages: data types, control flow, functions, OOP, error handling, built-ins.
For DSA: all topics with complexity table.
For tools (Git/Linux/Docker): most-used commands.

Make it practical — something a developer pins on their wall."""

        text = await gemini_service.generate(prompt)
        return {"subject": req.subject, "content": text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/roadmap")
async def generate_roadmap(req: RoadmapRequest, current_user: dict = Depends(get_current_user)):
    """Generate a personalized AI learning roadmap."""
    logger.info(f"Roadmap: goal={req.career_goal} level={req.skill_level}")

    if not gemini_service.is_configured():
        return {
            "career_goal": req.career_goal,
            "total_weeks": 16,
            "phases": [{"phase": 1, "title": "Foundations", "weeks": 4, "topics": ["Arrays", "Strings"], "resources": ["LeetCode Easy"], "milestone": "Solve 20 Easy problems", "estimated_hours": 40}],
            "next_topic": "Arrays",
            "daily_schedule": "2 hrs/day: 1hr theory + 1hr practice",
            "estimated_completion": "16 weeks at 10 hrs/week",
        }

    try:
        prompt = gemini_service.build_roadmap_prompt(
            req.skill_level, req.career_goal,
            req.weak_topics, req.completed_topics,
            req.available_hours_per_week
        )
        data = await gemini_service.generate_json(prompt)

        await analytics_engine.track_event(
            user_id=str(current_user["_id"]),
            action="roadmap_generate",
            topic=req.career_goal,
            success=True,
        )

        return data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mark-complete")
async def mark_topic_complete(req: MarkTopicRequest, current_user: dict = Depends(get_current_user)):
    """Mark a topic as completed in the user's profile."""
    from bson import ObjectId
    user_id = current_user["_id"]
    op = "$addToSet" if req.completed else "$pull"

    try:
        await database.users_collection.update_one(
            {"_id": ObjectId(str(user_id))},
            {op: {"completed_topics": req.topic}}
        )
    except Exception:
        await database.users_collection.update_one(
            {"_id": user_id},
            {op: {"completed_topics": req.topic}}
        )

    return {"topic": req.topic, "completed": req.completed, "message": f"Topic '{req.topic}' marked as {'complete' if req.completed else 'incomplete'}"}
