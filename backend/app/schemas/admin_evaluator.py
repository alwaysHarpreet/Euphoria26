from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class AdminEvaluatorCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8)


class AdminEvaluatorStatusUpdate(BaseModel):
    is_active: bool


class AdminEvaluatorResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)