import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    name: str
    role: str
    avatar_url: str | None
    created_at: datetime

    @property
    def is_super_admin(self) -> bool:
        return self.role == "super_admin"

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    name: str | None = None
    avatar_url: str | None = None


class UserRoleUpdateRequest(BaseModel):
    role: str


class UserListResponse(BaseModel):
    data: list[UserResponse]
    total: int
