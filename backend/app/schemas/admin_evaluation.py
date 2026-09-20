from datetime import datetime
from typing import Literal

from pydantic import BaseModel


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