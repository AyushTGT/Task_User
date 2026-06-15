import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, Enum, Float, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY

from app.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        Enum("backlog", "todo", "in_progress", "in_review", "done", name="task_status"),
        default="todo", nullable=False, index=True
    )
    priority: Mapped[str] = mapped_column(
        Enum("low", "medium", "high", "urgent", name="task_priority"),
        default="medium", nullable=False, index=True
    )
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    position: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    labels: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())

    owner: Mapped["User"] = relationship("User", back_populates="tasks")
    attachments: Mapped[list["Attachment"]] = relationship("Attachment", back_populates="task", cascade="all, delete-orphan")
    activity_logs: Mapped[list["ActivityLog"]] = relationship("ActivityLog", back_populates="task", cascade="all, delete-orphan")
