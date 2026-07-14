"""
CodeSage AI — Analytics Routes
Track events, gamification state, leaderboard, activity heatmap
"""

import logging
from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from app.core.security import get_current_user
from app.core.events import ws_manager
from app.services.analytics_service import analytics_engine

logger = logging.getLogger("codesage.analytics")
router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


class TrackRequest(BaseModel):
    action: str
    topic: str
    success: bool = True


@router.post("/track")
async def track_event(req: TrackRequest, current_user: dict = Depends(get_current_user)):
    """Track a learning event, award XP, and broadcast update via WebSocket."""
    user_id = str(current_user["_id"])

    result = await analytics_engine.track_event(
        user_id=user_id,
        action=req.action,
        topic=req.topic,
        success=req.success,
    )

    # Broadcast new state via WebSocket if connected
    try:
        new_state = await analytics_engine.get_full_dashboard(user_id)
        await ws_manager.send_to_user({"type": "dashboard_update", "data": new_state}, user_id)
    except Exception:
        pass

    return {
        "user_id": user_id,
        "xp_earned": result["xp_earned"],
        "new_badges": result["new_badges"],
        "message": f"Progress tracked! +{result['xp_earned']} XP awarded.",
    }


@router.get("/dashboard")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    """Get full gamification dashboard with real MongoDB data."""
    user_id = str(current_user["_id"])
    data = await analytics_engine.get_full_dashboard(user_id)
    if not data:
        raise HTTPException(status_code=404, detail="User data not found")
    return data


@router.get("/leaderboard")
async def get_leaderboard(limit: int = 10, current_user: dict = Depends(get_current_user)):
    """Get global leaderboard sorted by XP."""
    from app.core.database import users_collection
    from app.services.gamification_service import get_level

    top_users = await users_collection.find(
        {}, {"username": 1, "xp": 1, "badges": 1, "streak": 1}
    ).sort("xp", -1).limit(min(limit, 50)).to_list(50)

    leaderboard = []
    for i, u in enumerate(top_users):
        level = get_level(u.get("xp", 0))
        leaderboard.append({
            "rank": i + 1,
            "username": u.get("username", "Unknown"),
            "xp": u.get("xp", 0),
            "level": level["name"],
            "level_icon": level["icon"],
            "level_color": level["color"],
            "badges_count": len(u.get("badges", [])),
            "streak": u.get("streak", 0),
            "is_current_user": u.get("username") == current_user.get("username"),
        })

    return {"leaderboard": leaderboard, "total_users": len(leaderboard)}


@router.get("/heatmap")
async def get_activity_heatmap(current_user: dict = Depends(get_current_user)):
    """Get activity heatmap data (last 12 months)."""
    from app.core.database import activity_collection
    from datetime import datetime, timedelta

    user_id = str(current_user["_id"])
    since = datetime.utcnow() - timedelta(days=365)

    activities = await activity_collection.find(
        {"user_id": user_id, "timestamp": {"$gte": since}}
    ).to_list(2000)

    heatmap = {}
    for act in activities:
        ts = act.get("timestamp")
        if ts:
            day = ts.strftime("%Y-%m-%d") if isinstance(ts, type(ts)) else str(ts)[:10]
            heatmap[day] = heatmap.get(day, 0) + 1

    return {"heatmap": heatmap, "total_active_days": len(heatmap)}


# ── WebSocket Endpoint ────────────────────────────────────────────────────────
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """Real-time dashboard updates via WebSocket."""
    await ws_manager.connect(websocket, user_id)
    try:
        # Send initial state on connect
        initial_state = await analytics_engine.get_full_dashboard(user_id)
        await ws_manager.send_to_user({"type": "initial_state", "data": initial_state}, user_id)

        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(user_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(user_id)
