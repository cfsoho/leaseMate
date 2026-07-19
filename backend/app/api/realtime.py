from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.services.realtime_manager import realtime_manager
from app.services.user_auth_service import (
    get_session_id_from_access_token,
    get_user_from_access_token,
    list_user_login_sessions,
    touch_login_session_activity,
)


router = APIRouter(prefix="/realtime", tags=["Realtime"])


@router.websocket("")
async def realtime_socket(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return

    db: Session = SessionLocal()
    try:
        user = get_user_from_access_token(db, token)
        session_id = get_session_id_from_access_token(token)
    finally:
        db.close()

    if not user or not session_id:
        await websocket.close(code=1008)
        return

    await realtime_manager.connect(session_id, websocket)
    await _record_session_activity(session_id)
    try:
        await websocket.send_json(
            {
                "type": "connected",
                "payload": {"session_id": str(session_id)},
            }
        )
        while True:
            message = await websocket.receive_text()
            if message in {"activity", "ping"}:
                await _record_session_activity(session_id)
            if message == "ping":
                await websocket.send_json({"type": "pong", "payload": {}})
    except WebSocketDisconnect:
        pass
    finally:
        realtime_manager.disconnect(session_id, websocket)


async def _record_session_activity(session_id):
    db: Session = SessionLocal()
    try:
        session, should_notify = touch_login_session_activity(db, session_id)
        if not session or not should_notify:
            return

        for user_session in list_user_login_sessions(db, session.user_id):
            await realtime_manager.send_to_session(
                user_session.id,
                "sessions_changed",
                {
                    "reason": "device_activity",
                    "session_id": str(session_id),
                },
            )
    finally:
        db.close()
