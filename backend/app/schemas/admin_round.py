from pydantic import BaseModel, Field


class AdminRoundCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    round_number: int = Field(ge=1)
    description: str | None = None


class AdminRoundStatusUpdate(BaseModel):
    is_active: bool