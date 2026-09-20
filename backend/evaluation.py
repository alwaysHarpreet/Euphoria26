from datetime import datetime

from pydantic import BaseModel, ConfigDict


class EvaluationCreate(BaseModel):
    score: int
    remarks: str | None = None


class EvaluationResponse(BaseModel):
    id: int
    team_id: int
    evaluator_id: int
    round_id: int
    score: int | None
    remarks: str | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)