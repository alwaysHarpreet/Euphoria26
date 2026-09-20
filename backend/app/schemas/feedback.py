from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    comments: str = Field(..., min_length=3, description="Feedback comments")


class FeedbackResponse(BaseModel):
    id: int
    team_id: int
    rating: int
    comments: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
