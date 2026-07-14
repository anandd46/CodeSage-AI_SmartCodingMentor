"""
CodeSage AI — Gamification Service
XP, levels, badges, streaks, leaderboard — all backed by real MongoDB data.
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict
from bson import ObjectId

logger = logging.getLogger("codesage.gamification")

# ── XP Configuration ──────────────────────────────────────────────────────────
XP_TABLE = {
    "debug": 15,
    "explain": 10,
    "learn_topic": 25,
    "quiz_correct": 20,
    "quiz_complete": 50,
    "practice_solve": 40,
    "practice_attempt": 10,
    "interview_complete": 60,
    "run_code": 5,
    "flashcard_review": 8,
    "roadmap_generate": 20,
    "session_complete": 30,
    "daily_login": 15,
}

# ── Level System ──────────────────────────────────────────────────────────────
LEVELS = [
    {"name": "Novice",       "min_xp": 0,     "icon": "🌱", "color": "#6B7280"},
    {"name": "Beginner",     "min_xp": 500,   "icon": "📚", "color": "#3B82F6"},
    {"name": "Apprentice",   "min_xp": 1500,  "icon": "⚡", "color": "#8B5CF6"},
    {"name": "Intermediate", "min_xp": 3500,  "icon": "🔥", "color": "#F59E0B"},
    {"name": "Advanced",     "min_xp": 7000,  "icon": "🚀", "color": "#EF4444"},
    {"name": "Expert",       "min_xp": 12000, "icon": "💎", "color": "#06B6D4"},
    {"name": "Master",       "min_xp": 20000, "icon": "👑", "color": "#F97316"},
    {"name": "Grandmaster",  "min_xp": 35000, "icon": "🌟", "color": "#EC4899"},
]

# ── Achievement Definitions ────────────────────────────────────────────────────
ACHIEVEMENTS = [
    {
        "id": "bug_squasher",
        "name": "Bug Squasher",
        "icon": "🐛",
        "color": "#EF4444",
        "description": "Debug 10 code snippets with AI",
        "requirement": {"action": "debug", "count": 10},
        "xp_reward": 100,
    },
    {
        "id": "algo_master",
        "name": "Algo Master",
        "icon": "🔗",
        "color": "#3B82F6",
        "description": "Earn 500 XP",
        "requirement": {"xp": 500},
        "xp_reward": 50,
    },
    {
        "id": "streak_hero",
        "name": "Streak Hero",
        "icon": "🔥",
        "color": "#F59E0B",
        "description": "Maintain a 7-day learning streak",
        "requirement": {"streak": 7},
        "xp_reward": 150,
    },
    {
        "id": "ai_whisperer",
        "name": "AI Whisperer",
        "icon": "🧠",
        "color": "#8B5CF6",
        "description": "Use AI features 25 times",
        "requirement": {"multi_action": ["debug", "explain", "learn_topic"], "count": 25},
        "xp_reward": 75,
    },
    {
        "id": "quiz_champion",
        "name": "Quiz Champion",
        "icon": "🏆",
        "color": "#F59E0B",
        "description": "Complete 20 quizzes",
        "requirement": {"action": "quiz_complete", "count": 20},
        "xp_reward": 200,
    },
    {
        "id": "code_runner",
        "name": "Code Runner",
        "icon": "⚡",
        "color": "#06B6D4",
        "description": "Execute 50 code snippets",
        "requirement": {"action": "run_code", "count": 50},
        "xp_reward": 100,
    },
    {
        "id": "problem_solver",
        "name": "Problem Solver",
        "icon": "💡",
        "color": "#10B981",
        "description": "Solve 15 practice problems",
        "requirement": {"action": "practice_solve", "count": 15},
        "xp_reward": 300,
    },
    {
        "id": "interview_ready",
        "name": "Interview Ready",
        "icon": "💼",
        "color": "#F97316",
        "description": "Complete 5 mock interviews",
        "requirement": {"action": "interview_complete", "count": 5},
        "xp_reward": 250,
    },
    {
        "id": "knowledge_seeker",
        "name": "Knowledge Seeker",
        "icon": "📖",
        "color": "#EC4899",
        "description": "Learn 10 DSA topics in depth",
        "requirement": {"action": "learn_topic", "count": 10},
        "xp_reward": 200,
    },
    {
        "id": "xp_legend",
        "name": "XP Legend",
        "icon": "👑",
        "color": "#EF4444",
        "description": "Reach 10,000 XP",
        "requirement": {"xp": 10000},
        "xp_reward": 500,
    },
]


def get_level(xp: int) -> dict:
    level = LEVELS[0]
    for lvl in LEVELS:
        if xp >= lvl["min_xp"]:
            level = lvl
    return level


def get_xp_to_next_level(xp: int) -> int:
    for i, lvl in enumerate(LEVELS):
        if xp < lvl["min_xp"]:
            return lvl["min_xp"] - xp
    return 0  # Already at max level


def award_xp(action: str, success: bool = True) -> int:
    base = XP_TABLE.get(action, 5)
    if not success:
        base = max(base // 3, 5)
    return base


async def check_and_award_achievements(user_id: str, xp: int, streak: int, action_counts: dict) -> List[dict]:
    """Check all achievements and return newly unlocked ones."""
    from app.core.database import users_collection

    try:
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
    except Exception:
        user = await users_collection.find_one({"_id": user_id})

    if not user:
        return []

    earned_ids = {b["id"] for b in user.get("badges", [])}
    newly_earned = []

    for ach in ACHIEVEMENTS:
        if ach["id"] in earned_ids:
            continue

        req = ach["requirement"]
        earned = False

        if "xp" in req and xp >= req["xp"]:
            earned = True
        elif "streak" in req and streak >= req["streak"]:
            earned = True
        elif "action" in req:
            if action_counts.get(req["action"], 0) >= req["count"]:
                earned = True
        elif "multi_action" in req:
            total = sum(action_counts.get(a, 0) for a in req["multi_action"])
            if total >= req["count"]:
                earned = True

        if earned:
            badge = {
                "id": ach["id"],
                "name": ach["name"],
                "icon": ach["icon"],
                "color": ach["color"],
                "description": ach["description"],
                "xp_reward": ach["xp_reward"],
                "earned": True,
                "earned_at": datetime.utcnow().isoformat(),
            }
            newly_earned.append(badge)

    if newly_earned:
        bonus_xp = sum(b["xp_reward"] for b in newly_earned)
        try:
            await users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$push": {"badges": {"$each": newly_earned}},
                    "$inc": {"xp": bonus_xp},
                },
            )
        except Exception:
            await users_collection.update_one(
                {"_id": user_id},
                {
                    "$push": {"badges": {"$each": newly_earned}},
                    "$inc": {"xp": bonus_xp},
                },
            )

    return newly_earned


async def get_full_achievements_list(user_id: str) -> List[dict]:
    """Return all achievements with earned status for a user."""
    from app.core.database import users_collection

    try:
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
    except Exception:
        user = await users_collection.find_one({"_id": user_id})

    earned_map = {b["id"]: b for b in (user.get("badges", []) if user else [])}
    result = []

    for ach in ACHIEVEMENTS:
        if ach["id"] in earned_map:
            result.append(earned_map[ach["id"]])
        else:
            result.append({
                "id": ach["id"],
                "name": ach["name"],
                "icon": ach["icon"],
                "color": ach["color"],
                "description": ach["description"],
                "xp_reward": ach["xp_reward"],
                "earned": False,
                "earned_at": None,
            })

    return result
