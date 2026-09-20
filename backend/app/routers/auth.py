from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.team import Team
from app.schemas.auth import LoginRequest, TokenResponse
from app.security import create_access_token, verify_password


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db),
):
    statement = select(Team).where(
        Team.leader_email == login_data.leader_email
    )

    team = db.scalar(statement)

    if team is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(
        login_data.password,
        team.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
    subject=str(team.id),
    role="team",
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
    )