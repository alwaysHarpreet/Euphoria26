from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProblemReleaseStatusResponse(BaseModel):
    status: str
    release_at: datetime | None = None
    server_time: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class CountdownStartRequest(BaseModel):
    duration_seconds: int = Field(
        ...,
        gt=0,
        description="Countdown duration in seconds",
    )


class FeatureToggleRequest(BaseModel):
    is_active: bool


class FeatureStatusResponse(BaseModel):
    repository_active: bool
    feedback_active: bool
    server_time: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class AdminEventSettingsResponse(BaseModel):
    problem_release_status: str
    problem_release_at: datetime | None = None
    repository_active: bool = False
    feedback_active: bool = False
    server_time: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
