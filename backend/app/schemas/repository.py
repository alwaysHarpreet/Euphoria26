from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RepositorySubmitRequest(BaseModel):
    repository_url: str = Field(
        ...,
        min_length=10,
        max_length=500,
        description="Public GitHub/Git repository URL",
    )


class RepositoryResponse(BaseModel):
    repository_url: str | None = None
    repository_submitted_at: datetime | None = None

    model_config = ConfigDict(
        from_attributes=True,
    )
