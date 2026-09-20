from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.admin import Admin
from app.models.evaluator import Evaluator
from app.routers.dependencies import get_current_admin
from app.schemas.admin_evaluator import (
    AdminEvaluatorCreate,
    AdminEvaluatorResponse,
    AdminEvaluatorStatusUpdate,
)
from app.security import hash_password


router = APIRouter(
    prefix="/admin",
    tags=["Admin Evaluators"],
)


def _get_evaluator_or_404(
    db: Session,
    evaluator_id: int,
) -> Evaluator:
    evaluator = db.scalar(
        select(Evaluator).where(
            Evaluator.id == evaluator_id
        )
    )

    if evaluator is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluator not found.",
        )

    return evaluator


@router.get(
    "/evaluators",
    response_model=list[AdminEvaluatorResponse],
)
def get_admin_evaluators(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(Evaluator).order_by(Evaluator.name, Evaluator.id)
    ).all()


@router.post(
    "/evaluators",
    response_model=AdminEvaluatorResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_admin_evaluator(
    evaluator_data: AdminEvaluatorCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    name = evaluator_data.name.strip()

    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Name cannot be blank.",
        )

    evaluator = Evaluator(
        name=name,
        email=str(evaluator_data.email).lower(),
        password_hash=hash_password(evaluator_data.password),
        is_active=True,
    )

    db.add(evaluator)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An evaluator with this email already exists.",
        )

    db.refresh(evaluator)

    return evaluator


@router.patch(
    "/evaluators/{evaluator_id}/status",
    response_model=AdminEvaluatorResponse,
)
def update_evaluator_status(
    evaluator_id: int,
    status_data: AdminEvaluatorStatusUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    evaluator = _get_evaluator_or_404(db, evaluator_id)
    evaluator.is_active = status_data.is_active

    db.commit()
    db.refresh(evaluator)

    return evaluator