from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


EvaluationStatus = Literal["pending", "submitted"]


class AdminEvaluationResponse(BaseModel):
    id: int
    team_id: int
    team_name: str
    college_name: str
    evaluator_id: int
    evaluator_name: str
    round_id: int
    round_name: str
    round_number: int
    score: int | None
    remarks: str | None
    status: EvaluationStatus
    created_at: datetime
    updated_at: datetime


class AdminEvaluationUpdate(BaseModel):
    score: int = Field(..., ge=0, le=100)
    remarks: str | None = None