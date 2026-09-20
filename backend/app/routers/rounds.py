from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.round import Round
from app.schemas.round import RoundCreate, RoundResponse


router = APIRouter(
    prefix="/rounds",
    tags=["Rounds"],
)


@router.post(
    "",
    response_model=RoundResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_round(
    round_data: RoundCreate,
    db: Session = Depends(get_db),
):
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
        name=round_data.name,
        round_number=round_data.round_number,
        description=round_data.description,
        is_active=round_data.is_active,
    )

    db.add(new_round)
    db.commit()
    db.refresh(new_round)

    return new_round


@router.get(
    "",
    response_model=list[RoundResponse],
)
def get_rounds(
    db: Session = Depends(get_db),
):
    rounds = db.scalars(
        select(Round).order_by(
            Round.round_number
        )
    ).all()

    return rounds


@router.get(
    "/{round_id}",
    response_model=RoundResponse,
)
def get_round(
    round_id: int,
    db: Session = Depends(get_db),
):
    round_data = db.scalar(
        select(Round).where(
            Round.id == round_id
        )
    )

    if round_data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Round not found.",
        )

    return round_data