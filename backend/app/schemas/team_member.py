from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TeamMemberBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    college: str = Field(..., min_length=2, max_length=150)
    year: str = Field(..., min_length=1, max_length=20)
    department: str = Field(..., min_length=2, max_length=100)


class TeamMemberCreate(TeamMemberBase):
    pass


class TeamMemberResponse(TeamMemberBase):
    id: int
    team_id: int
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
