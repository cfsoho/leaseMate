from collections import defaultdict
from typing import Any
from uuid import UUID

from fastapi import WebSocket


class RealtimeConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[UUID, set[WebSocket]] = defaultdict(set)

    async def connect(self, session_id: UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[session_id].add(websocket)

    def disconnect(self, session_id: UUID, websocket: WebSocket) -> None:
        connections = self._connections.get(session_id)
        if not connections:
            return

        connections.discard(websocket)
        if not connections:
            self._connections.pop(session_id, None)

    def is_session_connected(self, session_id: UUID) -> bool:
        return bool(self._connections.get(session_id))

    async def send_to_session(
        self,
        session_id: UUID,
        event_type: str,
        payload: dict[str, Any] | None = None,
    ) -> None:
        connections = list(self._connections.get(session_id, set()))
        stale_connections: list[WebSocket] = []

        for websocket in connections:
            try:
                await websocket.send_json(
                    {
                        "type": event_type,
                        "payload": payload or {},
                    }
                )
            except RuntimeError:
                stale_connections.append(websocket)

        for websocket in stale_connections:
            self.disconnect(session_id, websocket)


realtime_manager = RealtimeConnectionManager()
