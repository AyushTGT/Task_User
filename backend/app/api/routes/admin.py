import math
import uuid
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.user import User
from app.models.task import Task
from app.models.activity import ActivityLog
from app.schemas.user import UserResponse, UserListResponse, UserRoleUpdateRequest
from app.schemas.task import (
    TaskListResponse, TaskSummaryResponse, PaginationMeta, TaskOwnerResponse,
    TaskResponse, ActivityResponse, AttachmentResponse,
)
from app.api.deps import require_admin, require_super_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=UserListResponse)
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = db.query(User)
    total = q.count()
    users = q.offset((page - 1) * page_size).limit(page_size).all()
    return UserListResponse(data=users, total=total)


@router.get("/tasks", response_model=TaskListResponse)
def list_all_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    status: str | None = Query(None),
    priority: str | None = Query(None),
    search: str | None = Query(None),
    user_id: str | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    from sqlalchemy.orm import joinedload
    q = db.query(Task).options(joinedload(Task.owner), joinedload(Task.attachments))

    if status:
        q = q.filter(Task.status == status)
    if priority:
        q = q.filter(Task.priority == priority)
    if search:
        q = q.filter(Task.title.ilike(f"%{search}%"))
    if user_id:
        import uuid
        q = q.filter(Task.owner_id == uuid.UUID(user_id))

    total = q.count()
    tasks = q.order_by(Task.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return TaskListResponse(
        data=[
            TaskSummaryResponse(
                id=t.id, title=t.title, description=t.description, status=t.status,
                priority=t.priority, due_date=t.due_date, position=t.position,
                labels=t.labels or [], owner_id=t.owner_id,
                owner=TaskOwnerResponse(id=t.owner.id, name=t.owner.name, email=t.owner.email, avatar_url=t.owner.avatar_url),
                attachment_count=len(t.attachments), created_at=t.created_at, updated_at=t.updated_at,
            )
            for t in tasks
        ],
        pagination=PaginationMeta(page=page, page_size=page_size, total=total, total_pages=math.ceil(total / page_size) if total else 0),
    )


@router.patch("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: uuid.UUID,
    payload: UserRoleUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    if payload.role not in ("user", "admin"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role must be 'user' or 'admin'")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if target.role == "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot change the super admin's role")
    if target.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot change your own role")

    target.role = payload.role
    db.commit()
    db.refresh(target)
    return target


@router.get("/tasks/{task_id}", response_model=TaskResponse)
def get_task_admin(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    task = (
        db.query(Task)
        .options(joinedload(Task.owner), joinedload(Task.attachments))
        .filter(Task.id == task_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskResponse(
        id=task.id, title=task.title, description=task.description,
        status=task.status, priority=task.priority, due_date=task.due_date,
        position=task.position, labels=task.labels or [],
        owner_id=task.owner_id,
        owner=TaskOwnerResponse(id=task.owner.id, name=task.owner.name, email=task.owner.email, avatar_url=task.owner.avatar_url),
        attachments=task.attachments,
        created_at=task.created_at, updated_at=task.updated_at,
    )


@router.get("/tasks/{task_id}/activities", response_model=list[ActivityResponse])
def get_task_activities_admin(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    logs = (
        db.query(ActivityLog)
        .options(joinedload(ActivityLog.user))
        .filter(ActivityLog.task_id == task_id)
        .order_by(ActivityLog.created_at.desc())
        .all()
    )
    return [
        ActivityResponse(
            id=log.id, action=log.action, field=log.field,
            old_value=log.old_value, new_value=log.new_value,
            created_at=log.created_at,
            user_name=log.user.name if log.user else None,
            user_id=log.user_id,
        )
        for log in logs
    ]


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    from sqlalchemy import func
    total_users = db.query(func.count(User.id)).scalar()
    total_tasks = db.query(func.count(Task.id)).scalar()
    tasks_by_status = db.query(Task.status, func.count(Task.id)).group_by(Task.status).all()
    tasks_by_priority = db.query(Task.priority, func.count(Task.id)).group_by(Task.priority).all()
    return {
        "total_users": total_users,
        "total_tasks": total_tasks,
        "tasks_by_status": dict(tasks_by_status),
        "tasks_by_priority": dict(tasks_by_priority),
    }
