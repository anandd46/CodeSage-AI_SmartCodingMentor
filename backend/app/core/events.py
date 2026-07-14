"""
CodeSage AI — WebSocket Connection Manager
Manages real-time dashboard updates per user session.
"""

import logging
from typing import Dict
from fastapi import WebSocket

logger = logging.getLogger("codesage.events")


class ConnectionManager:
    """Manages active WebSocket connections, keyed by user_id."""

    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"WebSocket connected: user={user_id} | total={len(self.active_connections)}")

    def disconnect(self, user_id: str):
        self.active_connections.pop(user_id, None)
        logger.info(f"WebSocket disconnected: user={user_id}")

    async def send_to_user(self, payload: dict, user_id: str):
        ws = self.active_connections.get(user_id)
        if ws:
            try:
                await ws.send_json(payload)
            except Exception as e:
                logger.warning(f"WebSocket send failed for {user_id}: {e}")
                self.disconnect(user_id)

    async def broadcast(self, payload: dict):
        for user_id, ws in list(self.active_connections.items()):
            try:
                await ws.send_json(payload)
            except Exception:
                self.disconnect(user_id)

    @property
    def connection_count(self) -> int:
        return len(self.active_connections)


# Global singleton
ws_manager = ConnectionManager()
