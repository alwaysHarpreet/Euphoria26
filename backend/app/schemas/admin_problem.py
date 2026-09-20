from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AdminProblemCreate(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=200
    )

    description: str = Field(
        min_length=1
    )

    requirements: str = ""

    expectations: str = ""

    is_active: bool = True


class AdminProblemUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=200
    )

    description: str | None = Field(
        default=None,
        min_length=1
    )

    requirements: str | None = None

    expectations: str | None = None

    is_active: bool | None = None


class AdminProblemResponse(BaseModel):
    id: int
    title: str
    description: str
    requirements: str
    expectations: str
    is_active: bool
    created_at: datetime
    teams_selected: int
    capacity: int
    available_slots: int

    model_config = ConfigDict(
        from_attributes=True
    )