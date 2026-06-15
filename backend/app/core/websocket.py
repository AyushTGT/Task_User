import json
import uuid
from typing import Dict, Set
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_to_user(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            dead = set()
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_text(json.dumps(message, default=str))
                except Exception:
                    dead.add(ws)
            for ws in dead:
                self.active_connections[user_id].discard(ws)

    async def broadcast(self, message: dict, exclude_user: str | None = None):
        for user_id, connections in list(self.active_connections.items()):
            if user_id == exclude_user:
                continue
            await self.send_to_user(user_id, message)


manager = ConnectionManager()
