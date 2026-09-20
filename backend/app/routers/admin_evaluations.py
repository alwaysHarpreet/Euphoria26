from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.evaluation import Evaluation
from app.models.evaluator import Evaluator
from app.models.round import Round
from app.models.team import Team
from app.routers.dependencies import get_current_admin
from app.schemas.admin_evaluation import (
    AdminEvaluationResponse,
    AdminEvaluationUpdate,
)


router = APIRouter(
    prefix="/admin",
    tags=["Admin Evaluations"],
)


def build_evaluation_response(
    evaluation: Evaluation,
    team_name: str,
    college_name: str,
    evaluator_name: str,
    round_name: str,
    round_number: int,
) -> AdminEvaluationResponse:
    return AdminEvaluationResponse(
        id=evaluation.id,
        team_id=evaluation.team_id,
        team_name=team_name,
        college_name=college_name,
        evaluator_id=evaluation.evaluator_id,
        evaluator_name=evaluator_name,
        round_id=evaluation.round_id,
        round_name=round_name,
        round_number=round_number,
        score=evaluation.score,
        remarks=evaluation.remarks,
        status=evaluation.status,
        created_at=evaluation.created_at,
        updated_at=evaluation.updated_at,
    )


@router.get(
    "/evaluations",
    response_model=list[AdminEvaluationResponse],
)
def get_admin_evaluations(
    round_id: int | None = Query(default=None),
    status: Literal["pending", "submitted"] | None = Query(
        default=None
    ),
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    statement = (
        select(
            Evaluation,
            Team.team_name,
            Team.college_name,
            Evaluator.name,
            Round.name,
            Round.round_number,
        )
        .join(
            Team,
            Evaluation.team_id == Team.id,
        )
        .join(
            Evaluator,
            Evaluation.evaluator_id == Evaluator.id,
        )
        .join(
            Round,
            Evaluation.round_id == Round.id,
        )
        .order_by(
            Evaluation.created_at.desc(),
            Evaluation.id.desc(),
        )
    )

    if round_id is not None:
        statement = statement.where(
            Evaluation.round_id == round_id
        )

    if status is not None:
        statement = statement.where(
            Evaluation.status == status
        )

    rows = db.execute(statement).all()

    return [
        build_evaluation_response(
            evaluation=evaluation,
            team_name=team_name,
            college_name=college_name,
            evaluator_name=evaluator_name,
            round_name=round_name,
            round_number=round_number,
        )
        for (
            evaluation,
            team_name,
            college_name,
            evaluator_name,
            round_name,
            round_number,
        ) in rows
    ]


@router.put(
    "/evaluations/{evaluation_id}",
    response_model=AdminEvaluationResponse,
)
def update_admin_evaluation(
    evaluation_id: int,
    evaluation_data: AdminEvaluationUpdate,
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    evaluation = db.scalar(
        select(Evaluation).where(
            Evaluation.id == evaluation_id
        )
    )

    if evaluation is None:
        raise HTTPException(
            status_code=404,
            detail="Evaluation not found.",
        )

    evaluation.score = evaluation_data.score
    evaluation.remarks = evaluation_data.remarks
    evaluation.status = "submitted"
    evaluation.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(evaluation)

    # Explicitly start the query from Team.
    # This avoids SQLAlchemy's ambiguous FROM/JOIN resolution.
    statement = (
        select(
            Team.team_name,
            Team.college_name,
            Evaluator.name,
            Round.name,
            Round.round_number,
        )
        .select_from(Team)
        .join(
            Evaluator,
            Evaluator.id == evaluation.evaluator_id,
        )
        .join(
            Round,
            Round.id == evaluation.round_id,
        )
        .where(
            Team.id == evaluation.team_id,
        )
    )

    row = db.execute(statement).first()

    if row is None:
        raise HTTPException(
            status_code=500,
            detail="Unable to load updated evaluation details.",
        )

    (
        team_name,
        college_name,
        evaluator_name,
        round_name,
        round_number,
    ) = row

    return build_evaluation_response(
        evaluation=evaluation,
        team_name=team_name,
        college_name=college_name,
        evaluator_name=evaluator_name,
        round_name=round_name,
        round_number=round_number,
    )