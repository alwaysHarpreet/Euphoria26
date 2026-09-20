from datetime import datetime

from pydantic import BaseModel, ConfigDict


class RoundCreate(BaseModel):
    name: str
    round_number: int
    description: str | None = None
    is_active: bool = False


class RoundResponse(BaseModel):
    id: int
    name: str
    round_number: int
    description: str | None = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
