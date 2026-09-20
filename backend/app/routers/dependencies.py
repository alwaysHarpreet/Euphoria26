from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.admin import Admin
from app.models.evaluator import Evaluator
from app.models.team import Team
from app.security import decode_access_token


security = HTTPBearer()


def get_current_team(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> Team:
    token = credentials.credentials

    try:
        payload = decode_access_token(token)

        subject = payload.get("sub")
        role = payload.get("role")

        if subject is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            )

        if role is not None and role != "team":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid team authentication token",
            )

        team_id = int(subject)

    except (
        jwt.InvalidTokenError,
        ValueError,
        TypeError,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
        )

    statement = select(Team).where(
        Team.id == team_id
    )

    team = db.scalar(statement)

    if team is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Team not found",
        )

    return team


def get_current_evaluator(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> Evaluator:
    token = credentials.credentials

    try:
        payload = decode_access_token(token)

        subject = payload.get("sub")
        role = payload.get("role")

        if subject is None or role != "evaluator":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid evaluator authentication token",
            )

        evaluator_id = int(subject)

    except (
        jwt.InvalidTokenError,
        ValueError,
        TypeError,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
        )

    statement = select(Evaluator).where(
        Evaluator.id == evaluator_id
    )

    evaluator = db.scalar(statement)

    if evaluator is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Evaluator not found",
        )

    if not evaluator.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Evaluator account is inactive",
        )

    return evaluator


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> Admin:
    token = credentials.credentials

    try:
        payload = decode_access_token(token)

        subject = payload.get("sub")
        role = payload.get("role")

        if subject is None or role != "admin":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid admin authentication token",
            )

        admin_id = int(subject)

    except (
        jwt.InvalidTokenError,
        ValueError,
        TypeError,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
        )

    statement = select(Admin).where(
        Admin.id == admin_id
    )

    admin = db.scalar(statement)

    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin not found",
        )

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is inactive",
        )

    return admin