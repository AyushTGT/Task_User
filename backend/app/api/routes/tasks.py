import uuid
import math
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, func, case
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.task import Task
from app.models.activity import ActivityLog
from app.models.user import User
from app.schemas.task import (
    TaskCreateRequest, TaskUpdateRequest, TaskResponse, TaskListResponse,
    TaskSummaryResponse, PaginationMeta, KanbanMoveRequest, ActivityResponse, TaskOwnerResponse
)
from app.api.deps import get_current_user
from app.core.websocket import manager

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _build_summary(task: Task) -> TaskSummaryResponse:
    return TaskSummaryResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        due_date=task.due_date,
        position=task.position,
        labels=task.labels or [],
        owner_id=task.owner_id,
        owner=TaskOwnerResponse(
            id=task.owner.id,
            name=task.owner.name,
            email=task.owner.email,
            avatar_url=task.owner.avatar_url,
        ),
        attachment_count=len(task.attachments),
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


def _build_response(task: Task) -> TaskResponse:
    return TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        due_date=task.due_date,
        position=task.position,
        labels=task.labels or [],
        owner_id=task.owner_id,
        owner=TaskOwnerResponse(
            id=task.owner.id,
            name=task.owner.name,
            email=task.owner.email,
            avatar_url=task.owner.avatar_url,
        ),
        attachments=task.attachments,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


def _log_activity(db: Session, task_id: uuid.UUID, user_id: uuid.UUID, action: str, field: str | None = None, old_val=None, new_val=None):
    log = ActivityLog(
        task_id=task_id,
        user_id=user_id,
        action=action,
        field=field,
        old_value={"value": str(old_val)} if old_val is not None else None,
        new_value={"value": str(new_val)} if new_val is not None else None,
    )
    db.add(log)


@router.post("", response_model=TaskSummaryResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.position is None:
        max_pos = db.query(func.max(Task.position)).filter(
            Task.owner_id == current_user.id, Task.status == payload.status
        ).scalar() or 0.0
        position = max_pos + 1000.0
    else:
        position = payload.position

    task = Task(
        title=payload.title,
        description=payload.description,
        status=payload.status,
        priority=payload.priority,
        due_date=payload.due_date,
        labels=payload.labels,
        position=position,
        owner_id=current_user.id,
    )
    db.add(task)
    db.flush()
    _log_activity(db, task.id, current_user.id, "created")
    db.commit()
    db.refresh(task)

    summary = _build_summary(task)
    await manager.send_to_user(str(current_user.id), {"type": "task_created", "data": summary.model_dump(mode="json")})
    return summary


@router.get("", response_model=TaskListResponse)
def list_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    status: str | None = Query(None),
    priority: str | None = Query(None),
    search: str | None = Query(None),
    sort_by: str = Query("created_at", pattern="^(created_at|due_date|priority|title|position)$"),
    sort_dir: str = Query("desc", pattern="^(asc|desc)$"),
    label: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = (
        db.query(Task)
        .options(joinedload(Task.owner), joinedload(Task.attachments))
        .filter(Task.owner_id == current_user.id)
    )

    if status:
        q = q.filter(Task.status == status)
    if priority:
        q = q.filter(Task.priority == priority)
    if search:
        q = q.filter(Task.title.ilike(f"%{search}%"))
    if label:
        q = q.filter(Task.labels.any(label))

    total = q.count()

    priority_order = case(
        {"urgent": 0, "high": 1, "medium": 2, "low": 3},
        value=Task.priority,
    )
    sort_col = {
        "created_at": Task.created_at,
        "due_date": Task.due_date,
        "priority": priority_order,
        "title": Task.title,
        "position": Task.position,
    }[sort_by]

    q = q.order_by(sort_col.asc() if sort_dir == "asc" else sort_col.desc())
    tasks = q.offset((page - 1) * page_size).limit(page_size).all()

    return TaskListResponse(
        data=[_build_summary(t) for t in tasks],
        pagination=PaginationMeta(
            page=page,
            page_size=page_size,
            total=total,
            total_pages=math.ceil(total / page_size) if total else 0,
        ),
    )


@router.get("/{id}/activities", response_model=list[ActivityResponse])
def get_task_activities(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == id, Task.owner_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    logs = (
        db.query(ActivityLog)
        .options(joinedload(ActivityLog.user))
        .filter(ActivityLog.task_id == id)
        .order_by(ActivityLog.created_at.desc())
        .all()
    )
    return [
        ActivityResponse(
            id=log.id,
            action=log.action,
            field=log.field,
            old_value=log.old_value,
            new_value=log.new_value,
            created_at=log.created_at,
            user_name=log.user.name if log.user else None,
            user_id=log.user_id,
        )
        for log in logs
    ]


@router.get("/{id}", response_model=TaskResponse)
def get_task(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = (
        db.query(Task)
        .options(joinedload(Task.owner), joinedload(Task.attachments))
        .filter(Task.id == id, Task.owner_id == current_user.id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return _build_response(task)


@router.patch("/{id}", response_model=TaskSummaryResponse)
async def update_task(
    id: uuid.UUID,
    payload: TaskUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = (
        db.query(Task)
        .options(joinedload(Task.owner), joinedload(Task.attachments))
        .filter(Task.id == id, Task.owner_id == current_user.id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    changes = payload.model_dump(exclude_unset=True)
    for field, new_val in changes.items():
        old_val = getattr(task, field)
        if old_val != new_val:
            _log_activity(db, task.id, current_user.id, "updated", field, old_val, new_val)
            setattr(task, field, new_val)

    db.commit()
    db.refresh(task)

    summary = _build_summary(task)
    await manager.send_to_user(str(current_user.id), {"type": "task_updated", "data": summary.model_dump(mode="json")})
    return summary


@router.patch("/{id}/move", response_model=TaskSummaryResponse)
async def move_task(
    id: uuid.UUID,
    payload: KanbanMoveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = (
        db.query(Task)
        .options(joinedload(Task.owner), joinedload(Task.attachments))
        .filter(Task.id == id, Task.owner_id == current_user.id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    old_status = task.status
    task.status = payload.status
    task.position = payload.position

    if old_status != payload.status:
        _log_activity(db, task.id, current_user.id, "status_changed", "status", old_status, payload.status)

    db.commit()
    db.refresh(task)

    summary = _build_summary(task)
    await manager.send_to_user(str(current_user.id), {"type": "task_updated", "data": summary.model_dump(mode="json")})
    return summary


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == id, Task.owner_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    await manager.send_to_user(str(current_user.id), {"type": "task_deleted", "data": {"id": str(id)}})
