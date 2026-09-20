from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.schemas.feedback import FeedbackResponse
from app.schemas.problem import ProblemResponse
from app.schemas.team_member import TeamMemberResponse


class TeamResponse(BaseModel):
    id: int
    team_name: str
    college_name: str
    leader_name: str
    leader_email: EmailStr

    selected_problem: ProblemResponse | None = None

    group_photo_path: str | None = None
    group_photo_url: str | None = None

    repository_url: str | None = None
    repository_submitted_at: datetime | None = None

    members: list[TeamMemberResponse] = []
    feedback: FeedbackResponse | None = None

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )