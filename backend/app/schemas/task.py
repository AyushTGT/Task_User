import uuid
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, field_validator


TaskStatus = Literal["backlog", "todo", "in_progress", "in_review", "done"]
TaskPriority = Literal["low", "medium", "high", "urgent"]


class AttachmentResponse(BaseModel):
    id: uuid.UUID
    filename: str
    original_name: str
    file_size: int
    content_type: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ActivityResponse(BaseModel):
    id: uuid.UUID
    action: str
    field: str | None
    old_value: dict | None
    new_value: dict | None
    created_at: datetime
    user_name: str | None = None
    user_id: uuid.UUID | None = None

    model_config = {"from_attributes": True}


class TaskOwnerResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    avatar_url: str | None

    model_config = {"from_attributes": True}


class TaskResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    status: str
    priority: str
    due_date: datetime | None
    position: float
    labels: list[str]
    owner_id: uuid.UUID
    owner: TaskOwnerResponse
    attachments: list[AttachmentResponse] = []
    created_at: datetime
    updated_at: datetime | None

    model_config = {"from_attributes": True}


class TaskSummaryResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    status: str
    priority: str
    due_date: datetime | None
    position: float
    labels: list[str]
    owner_id: uuid.UUID
    owner: TaskOwnerResponse
    attachment_count: int = 0
    created_at: datetime
    updated_at: datetime | None

    model_config = {"from_attributes": True}


class TaskCreateRequest(BaseModel):
    title: str
    description: str | None = None
    status: TaskStatus = "todo"
    priority: TaskPriority = "medium"
    due_date: datetime | None = None
    labels: list[str] = []
    position: float | None = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Title cannot be empty")
        if len(v) > 200:
            raise ValueError("Title cannot exceed 200 characters")
        return v


class TaskUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    due_date: datetime | None = None
    labels: list[str] | None = None
    position: float | None = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Title cannot be empty")
            if len(v) > 200:
                raise ValueError("Title cannot exceed 200 characters")
        return v


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int


class TaskListResponse(BaseModel):
    data: list[TaskSummaryResponse]
    pagination: PaginationMeta


class KanbanMoveRequest(BaseModel):
    status: TaskStatus
    position: float
