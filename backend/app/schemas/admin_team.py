from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AdminTeamResponse(BaseModel):
    id: int
    team_code: str
    team_name: str
    college_name: str
    leader_name: str
    leader_email: str
    selected_problem_id: int | None
    selected_problem_title: str | None = None
    group_photo_path: str | None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )