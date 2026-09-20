from pydantic import BaseModel, ConfigDict, EmailStr, Field


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class AdminResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class ActiveRoundResponse(BaseModel):
    id: int
    name: str
    round_number: int


class AdminOverviewResponse(BaseModel):
    total_teams: int
    total_evaluators: int
    total_rounds: int

    active_round: ActiveRoundResponse | None

    evaluations_submitted: int
    active_round_evaluated_teams: int
    active_round_pending_teams: int