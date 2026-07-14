"""
CodeSage AI — Async MongoDB Database Layer
Motor-based async client with all collections and index setup.
"""

import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger("codesage.db")

# ── Client & DB ─────────────────────────────────────────────────────────────
client: AsyncIOMotorClient = None
db: AsyncIOMotorDatabase = None

# ── Collections (assigned at startup) ───────────────────────────────────────
users_collection = None
activity_collection = None
analytics_collection = None
sessions_collection = None
coding_history_collection = None
achievements_collection = None
chat_history_collection = None
problems_collection = None
leaderboard_collection = None


async def connect_db():
    """Initialize MongoDB connection and all collections."""
    global client, db
    global users_collection, activity_collection, analytics_collection
    global sessions_collection, coding_history_collection, achievements_collection
    global chat_history_collection, problems_collection, leaderboard_collection

    client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
    )
    db = client[settings.MONGODB_DB_NAME]

    users_collection = db["users"]
    activity_collection = db["activity"]
    analytics_collection = db["analytics"]
    sessions_collection = db["sessions"]
    coding_history_collection = db["coding_history"]
    achievements_collection = db["achievements"]
    chat_history_collection = db["chat_history"]
    problems_collection = db["problems"]
    leaderboard_collection = db["leaderboard"]

    await _create_indexes()
    logger.info(f"MongoDB connected: {settings.MONGODB_DB_NAME}")
    try:
        await seed_database_if_empty()
    except Exception as e:
        logger.error(f"Error seeding database: {e}")


async def seed_database_if_empty():
    """Populate default users for the leaderboard if empty."""
    from datetime import datetime
    from app.core.security import get_password_hash

    count = await users_collection.count_documents({})
    if count == 0:
        logger.info("Database is empty, seeding sample users for leaderboard...")
        sample_users = [
            {"username": "alan_turing", "email": "alan@turing.org", "xp": 9900, "streak": 31, "skill_level": "Advanced"},
            {"username": "ada_lovelace", "email": "ada@lovelace.org", "xp": 8500, "streak": 22, "skill_level": "Advanced"},
            {"username": "grace_hopper", "email": "grace@hopper.org", "xp": 7500, "streak": 18, "skill_level": "Intermediate"},
            {"username": "linus_torvalds", "email": "linus@linux.org", "xp": 6200, "streak": 15, "skill_level": "Advanced"},
            {"username": "sarah_connor", "email": "sarah@connor.org", "xp": 4200, "streak": 14, "skill_level": "Intermediate"},
            {"username": "john_doe", "email": "john@doe.org", "xp": 2900, "streak": 8, "skill_level": "Beginner"},
        ]

        for u in sample_users:
            hashed = get_password_hash("password123")
            await users_collection.insert_one({
                "username": u["username"],
                "email": u["email"],
                "hashed_password": hashed,
                "skill_level": u["skill_level"],
                "career_goal": "FAANG Software Engineer",
                "xp": u["xp"],
                "streak": u["streak"],
                "total_sessions": u["xp"] // 150,
                "badges": [
                    {
                        "id": "bug_squasher",
                        "name": "Bug Squasher",
                        "icon": "🐛",
                        "color": "#EF4444",
                        "description": "Debug 10 code snippets with AI",
                        "xp_reward": 100,
                        "earned": True,
                        "earned_at": datetime.utcnow().isoformat()
                    }
                ] if u["xp"] > 3000 else [],
                "completed_topics": ["Arrays", "Strings", "Linked Lists"],
                "weak_topics": [],
                "created_at": datetime.utcnow(),
                "last_login": datetime.utcnow(),
            })
        logger.info("Database seeded successfully with sample leaderboard data")


async def _create_indexes():
    """Create optimized indexes for all collections."""
    await users_collection.create_index("username", unique=True)
    await users_collection.create_index("email", unique=True)
    await activity_collection.create_index("user_id")
    await activity_collection.create_index("timestamp")
    await analytics_collection.create_index("user_id", unique=True)
    await sessions_collection.create_index("user_id")
    await sessions_collection.create_index("session_start")
    await coding_history_collection.create_index("user_id")
    await coding_history_collection.create_index([("user_id", 1), ("timestamp", -1)])
    await achievements_collection.create_index("user_id")
    await chat_history_collection.create_index("user_id")
    await chat_history_collection.create_index([("user_id", 1), ("session_id", 1)])
    logger.info("MongoDB indexes created successfully")


async def close_db():
    """Close the MongoDB connection."""
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed")


def get_db() -> AsyncIOMotorDatabase:
    return db
