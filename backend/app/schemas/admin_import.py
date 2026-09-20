from pydantic import BaseModel


class ImportResult(BaseModel):
    created: int
    updated: int
    skipped: int
    errors: list[str]


class TeamImportResult(BaseModel):
    teams_imported: int
    members_imported: int


class ResetPasswordResponse(BaseModel):
    team_id: int
    team_name: str
    leader_email: str
    temporary_password: str


class ResetProblemResponse(BaseModel):
    team_id: int
    team_name: str
    previous_problem_id: int | None
    message: str