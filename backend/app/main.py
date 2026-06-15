import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.api.routes import auth, tasks, attachments, admin
from app.core.websocket import manager
from app.core.security import decode_token, hash_password
from app.api.deps import get_current_user

SUPER_ADMIN_EMAIL = "superadmin@taskflow.com"
SUPER_ADMIN_PASSWORD = "SuperAdmin123!"

app = FastAPI(
    title="TaskFlow API",
    description="Production-grade task management API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.on_event("startup")
def seed_super_admin():
    from app.database import SessionLocal
    from app.models.user import User
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == SUPER_ADMIN_EMAIL).first()
        if not existing:
            db.add(User(
                email=SUPER_ADMIN_EMAIL,
                name="Super Admin",
                password_hash=hash_password(SUPER_ADMIN_PASSWORD),
                role="super_admin",
            ))
            db.commit()
    finally:
        db.close()

app.include_router(auth.router, prefix="/api/v1")
app.include_router(tasks.router, prefix="/api/v1")
app.include_router(attachments.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001)
        return

    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        await websocket.close(code=4001)
        return

    user_id = payload.get("sub")
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo ping/pong for keep-alive
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
