"""
CodeSage AI — History Routes
Coding history, chat history, session logs with filtering
"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query
from datetime import datetime

from app.core.security import get_current_user
from app.core import database

logger = logging.getLogger("codesage.history")
router = APIRouter(prefix="/api/history", tags=["History"])


@router.get("/coding")
async def get_coding_history(
    limit: int = Query(default=20, le=100),
    language: Optional[str] = None,
    type: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Get coding history with optional filters."""
    user_id = str(current_user["_id"])
    query = {"user_id": user_id}

    if language:
        query["language"] = language
    if type:
        query["type"] = type

    items = await database.coding_history_collection.find(
        query, {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)

    # Serialize timestamps
    for item in items:
        if "timestamp" in item and isinstance(item["timestamp"], datetime):
            item["timestamp"] = item["timestamp"].isoformat()

    return {"items": items, "count": len(items)}


@router.get("/activity")
async def get_activity_log(
    limit: int = Query(default=30, le=100),
    current_user: dict = Depends(get_current_user),
):
    """Get detailed activity log."""
    user_id = str(current_user["_id"])

    activities = await database.activity_collection.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)

    for act in activities:
        if "timestamp" in act and isinstance(act["timestamp"], datetime):
            act["timestamp"] = act["timestamp"].isoformat()

    return {"activities": activities, "count": len(activities)}


@router.get("/chat")
async def get_chat_history(
    limit: int = Query(default=10, le=50),
    current_user: dict = Depends(get_current_user),
):
    """Get recent chat sessions."""
    user_id = str(current_user["_id"])

    sessions = await database.chat_history_collection.find(
        {"user_id": user_id}, {"_id": 0, "messages": {"$slice": -5}}
    ).sort("updated_at", -1).limit(limit).to_list(limit)

    for session in sessions:
        for field in ["created_at", "updated_at"]:
            if field in session and isinstance(session[field], datetime):
                session[field] = session[field].isoformat()

    return {"sessions": sessions, "count": len(sessions)}


@router.delete("/coding")
async def clear_coding_history(current_user: dict = Depends(get_current_user)):
    """Clear all coding history for the current user."""
    user_id = str(current_user["_id"])
    result = await database.coding_history_collection.delete_many({"user_id": user_id})
    return {"deleted_count": result.deleted_count, "message": "Coding history cleared"}
