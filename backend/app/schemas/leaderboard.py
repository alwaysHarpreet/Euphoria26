from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LeaderboardRound(BaseModel):
    id: int
    name: str
    round_number: int


class LeaderboardEntry(BaseModel):
    rank: int
    team_id: int
    team_name: str
    college_name: str
    group_photo_url: str | None = None
    score: int
    status: str


class LeaderboardResponse(BaseModel):
    round: LeaderboardRound | None
    updated_at: datetime | None
    entries: list[LeaderboardEntry]
    message: str | None = None

    model_config = ConfigDict(from_attributes=True)
