from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class AdminTeamResponse(BaseModel):
    id: int
    team_code: str | None

    team_name: str
    college_name: str
    leader_name: str
    leader_email: EmailStr

    selected_problem_id: int | None = None

    group_photo_path: str | None = None

    repository_url: str | None = None
    repository_submitted_at: datetime | None = None

    feedback_rating: int | None = None

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )