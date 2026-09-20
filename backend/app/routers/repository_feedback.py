import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.event_settings import EventSetting
from app.models.feedback import TeamFeedback
from app.models.team import Team
from app.routers.dependencies import get_current_admin, get_current_team
from app.schemas.event_settings import (
    FeatureStatusResponse,
    FeatureToggleRequest,
)
from app.schemas.feedback import FeedbackCreate, FeedbackResponse
from app.schemas.repository import RepositoryResponse, RepositorySubmitRequest


router = APIRouter(tags=["Repository & Feedback"])


def _get_or_create_event_settings(db: Session) -> EventSetting:
    event_setting = db.scalar(
        select(EventSetting).where(EventSetting.id == 1)
    )

    if event_setting is None:
        event_setting = EventSetting(
            id=1,
            problem_release_status="not_started",
            repository_active=False,
            feedback_active=False,
        )
        db.add(event_setting)
        db.commit()
        db.refresh(event_setting)

    return event_setting


# ---------------------------------------------------------
# FEATURE STATUS (PUBLIC / TEAM)
# ---------------------------------------------------------

@router.get(
    "/features/status",
    response_model=FeatureStatusResponse,
)
@router.get(
    "/teams/me/features/status",
    response_model=FeatureStatusResponse,
    include_in_schema=False,
)
def get_features_status(
    db: Session = Depends(get_db),
):
    event_setting = _get_or_create_event_settings(db)
    now = datetime.now(timezone.utc)

    return FeatureStatusResponse(
        repository_active=event_setting.repository_active,
        feedback_active=event_setting.feedback_active,
        server_time=now,
    )


# ---------------------------------------------------------
# REPOSITORY ENDPOINTS (TEAM)
# ---------------------------------------------------------

@router.get(
    "/teams/me/repository",
    response_model=RepositoryResponse,
)
def get_team_repository(
    current_team: Team = Depends(get_current_team),
    db: Session = Depends(get_db),
):
    team = db.scalar(select(Team).where(Team.id == current_team.id))

    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    return RepositoryResponse(
        repository_url=team.repository_url,
        repository_submitted_at=team.repository_submitted_at,
    )


@router.post(
    "/teams/me/repository",
    response_model=RepositoryResponse,
)
def submit_team_repository(
    data: RepositorySubmitRequest,
    current_team: Team = Depends(get_current_team),
    db: Session = Depends(get_db),
):
    event_setting = _get_or_create_event_settings(db)

    # Backend enforcement: Cannot submit when deactivated
    if not event_setting.repository_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Repository submission is currently deactivated by organizers.",
        )

    url = data.repository_url.strip()

    # URL validation (ensure valid web git url)
    url_pattern = re.compile(
        r"^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$"
    )

    if not url_pattern.match(url):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please provide a valid repository URL starting with http:// or https://",
        )

    team = db.scalar(
        select(Team).where(Team.id == current_team.id).with_for_update()
    )

    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    now = datetime.now(timezone.utc)
    team.repository_url = url
    team.repository_submitted_at = now

    db.commit()
    db.refresh(team)

    return RepositoryResponse(
        repository_url=team.repository_url,
        repository_submitted_at=team.repository_submitted_at,
    )


# ---------------------------------------------------------
# FEEDBACK ENDPOINTS (TEAM)
# ---------------------------------------------------------

@router.get(
    "/teams/me/feedback",
    response_model=FeedbackResponse | None,
)
def get_team_feedback(
    current_team: Team = Depends(get_current_team),
    db: Session = Depends(get_db),
):
    feedback = db.scalar(
        select(TeamFeedback).where(TeamFeedback.team_id == current_team.id)
    )

    return feedback


@router.post(
    "/teams/me/feedback",
    response_model=FeedbackResponse,
)
def submit_team_feedback(
    data: FeedbackCreate,
    current_team: Team = Depends(get_current_team),
    db: Session = Depends(get_db),
):
    event_setting = _get_or_create_event_settings(db)

    # Backend enforcement: Cannot submit when deactivated
    if not event_setting.feedback_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Feedback submission is currently deactivated by organizers.",
        )

    comments = data.comments.strip()
    if len(comments) < 3:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Feedback comments must be at least 3 characters.",
        )

    feedback = db.scalar(
        select(TeamFeedback)
        .where(TeamFeedback.team_id == current_team.id)
        .with_for_update()
    )

    if feedback is not None:
        feedback.rating = data.rating
        feedback.comments = comments
    else:
        feedback = TeamFeedback(
            team_id=current_team.id,
            rating=data.rating,
            comments=comments,
        )
        db.add(feedback)

    db.commit()
    db.refresh(feedback)

    return feedback


# ---------------------------------------------------------
# ADMIN FEATURE TOGGLES
# ---------------------------------------------------------

@router.post(
    "/admin/repository/toggle",
    response_model=FeatureStatusResponse,
    tags=["Admin"],
)
def toggle_repository_submission(
    data: FeatureToggleRequest,
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    event_setting = _get_or_create_event_settings(db)
    event_setting.repository_active = data.is_active

    db.commit()
    db.refresh(event_setting)

    now = datetime.now(timezone.utc)

    return FeatureStatusResponse(
        repository_active=event_setting.repository_active,
        feedback_active=event_setting.feedback_active,
        server_time=now,
    )


@router.post(
    "/admin/feedback/toggle",
    response_model=FeatureStatusResponse,
    tags=["Admin"],
)
def toggle_feedback_submission(
    data: FeatureToggleRequest,
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    event_setting = _get_or_create_event_settings(db)
    event_setting.feedback_active = data.is_active

    db.commit()
    db.refresh(event_setting)

    now = datetime.now(timezone.utc)

    return FeatureStatusResponse(
        repository_active=event_setting.repository_active,
        feedback_active=event_setting.feedback_active,
        server_time=now,
    )
