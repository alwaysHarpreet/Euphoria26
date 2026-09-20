from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.admin import Admin
from app.models.round import Round
from app.routers.dependencies import get_current_admin
from app.schemas.admin_round import (
    AdminRoundCreate,
    AdminRoundStatusUpdate,
)
from app.schemas.round import RoundResponse


router = APIRouter(
    prefix="/admin/rounds",
    tags=["Admin Rounds"],
)


def _get_round_or_404(
    db: Session,
    round_id: int,
) -> Round:
    round_data = db.scalar(
        select(Round).where(Round.id == round_id)
    )

    if round_data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Round not found.",
        )

    return round_data


def _deactivate_all_rounds(db: Session) -> None:
    db.execute(
        update(Round)
        .where(Round.is_active.is_(True))
        .values(is_active=False)
    )


@router.get(
    "",
    response_model=list[RoundResponse],
)
def get_admin_rounds(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(Round).order_by(Round.round_number)
    ).all()


@router.post(
    "",
    response_model=RoundResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_admin_round(
    round_data: AdminRoundCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    name = round_data.name.strip()

    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Round name cannot be blank.",
        )

    existing_round = db.scalar(
        select(Round).where(
            Round.round_number == round_data.round_number
        )
    )

    if existing_round is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A round with this round number already exists.",
        )

    new_round = Round(
        name=name,
        round_number=round_data.round_number,
        description=(
            round_data.description.strip()
            if round_data.description
            else None
        ),
        is_active=False,
    )

    db.add(new_round)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A round with this round number already exists.",
        )

    db.refresh(new_round)

    return new_round


@router.patch(
    "/{round_id}/status",
    response_model=RoundResponse,
)
def update_admin_round_status(
    round_id: int,
    status_data: AdminRoundStatusUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    round_data = _get_round_or_404(db, round_id)

    if status_data.is_active:
        _deactivate_all_rounds(db)

    round_data.is_active = status_data.is_active
    db.commit()
    db.refresh(round_data)

    return round_data