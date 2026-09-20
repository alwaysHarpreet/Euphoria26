from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class EvaluatorLoginRequest(BaseModel):
    email: EmailStr
    password: str


class EvaluatorResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class EvaluatorTeamResponse(BaseModel):
    id: int
    team_name: str
    college_name: str
    leader_name: str
    group_photo_url: str | None = None