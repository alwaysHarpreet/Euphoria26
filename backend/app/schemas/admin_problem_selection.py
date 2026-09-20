from pydantic import BaseModel, EmailStr


class AdminSelectedTeam(BaseModel):
    id: int
    team_name: str
    college_name: str | None = None
    leader_name: str | None = None
    leader_email: EmailStr | None = None


class AdminProblemMappingResponse(BaseModel):
    problem_id: int
    problem_title: str
    teams_selected: int
    capacity: int
    available_slots: int
    teams: list[AdminSelectedTeam]