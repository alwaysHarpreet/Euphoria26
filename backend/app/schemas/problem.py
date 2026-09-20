from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ProblemResponse(BaseModel):
    id: int
    title: str
    description: str
    requirements: str
    expectations: str
    is_active: bool
    created_at: datetime
    teams_selected: int = 0
    capacity: int = 0

    model_config = ConfigDict(
        from_attributes=True
    )


class ProblemSelectionResponse(BaseModel):
    message: str
    problem: ProblemResponse
    teams_selected: int
    capacity: int