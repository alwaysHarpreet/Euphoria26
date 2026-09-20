from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.evaluator import Evaluator
from app.routers.dependencies import get_current_evaluator
from app.schemas.auth import TokenResponse
from app.schemas.evaluator import (
    EvaluatorLoginRequest,
    EvaluatorResponse,
)
from app.security import create_access_token, verify_password


router = APIRouter(
    prefix="/evaluator",
    tags=["Evaluator Authentication"],
)


@router.post(
    "/login",
    response_model=TokenResponse,
)
def evaluator_login(
    login_data: EvaluatorLoginRequest,
    db: Session = Depends(get_db),
):
    statement = select(Evaluator).where(
        Evaluator.email == login_data.email
    )

    evaluator = db.scalar(statement)

    if evaluator is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not evaluator.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Evaluator account is inactive",
        )

    if not verify_password(
        login_data.password,
        evaluator.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        subject=str(evaluator.id),
        role="evaluator",
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
    )


@router.get(
    "/me",
    response_model=EvaluatorResponse,
)
def get_my_evaluator_profile(
    current_evaluator: Evaluator = Depends(
        get_current_evaluator
    ),
):
    return current_evaluator