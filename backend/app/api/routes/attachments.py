import uuid
import os
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.task import Task
from app.models.attachment import Attachment
from app.models.user import User
from app.schemas.task import AttachmentResponse
from app.api.deps import get_current_user
from app.config import settings

router = APIRouter(prefix="/tasks", tags=["attachments"])

ALLOWED_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf", "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}


@router.post("/{task_id}/attachments", response_model=AttachmentResponse, status_code=status.HTTP_201_CREATED)
async def upload_attachment(
    task_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="File type not allowed")

    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    ext = os.path.splitext(file.filename or "file")[1]
    safe_name = f"{uuid.uuid4()}{ext}"
    upload_path = os.path.join(settings.UPLOAD_DIR, str(task_id))
    os.makedirs(upload_path, exist_ok=True)
    file_path = os.path.join(upload_path, safe_name)

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    attachment = Attachment(
        task_id=task_id,
        filename=safe_name,
        original_name=file.filename or safe_name,
        file_path=file_path,
        file_size=len(content),
        content_type=file.content_type or "application/octet-stream",
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment


@router.delete("/{task_id}/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(
    task_id: uuid.UUID,
    attachment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    attachment = db.query(Attachment).filter(Attachment.id == attachment_id, Attachment.task_id == task_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    if os.path.exists(attachment.file_path):
        os.remove(attachment.file_path)

    db.delete(attachment)
    db.commit()


@router.get("/{task_id}/attachments/{attachment_id}/download")
def download_attachment(
    task_id: uuid.UUID,
    attachment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id, Task.owner_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    attachment = db.query(Attachment).filter(Attachment.id == attachment_id, Attachment.task_id == task_id).first()
    if not attachment or not os.path.exists(attachment.file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(attachment.file_path, filename=attachment.original_name, media_type=attachment.content_type)
