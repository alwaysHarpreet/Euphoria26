from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.evaluation import Evaluation
from app.models.evaluator import Evaluator
from app.models.round import Round
from app.models.team import Team
from app.routers.dependencies import get_current_admin
from app.schemas.admin import (
    ActiveRoundResponse,
    AdminOverviewResponse,
)

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


@router.get(
    "/overview",
    response_model=AdminOverviewResponse,
)
def get_admin_overview(
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    # Total teams
    total_teams = db.scalar(
        select(func.count(Team.id))
    ) or 0

    # Total evaluators
    total_evaluators = db.scalar(
        select(func.count(Evaluator.id))
    ) or 0

    # Total rounds
    total_rounds = db.scalar(
        select(func.count(Round.id))
    ) or 0

    # Active round
    active_round = db.scalar(
        select(Round)
        .where(Round.is_active.is_(True))
        .order_by(Round.round_number)
    )

    # Total submitted evaluations
    evaluations_submitted = db.scalar(
        select(func.count(Evaluation.id))
        .where(Evaluation.status == "submitted")
    ) or 0

    active_round_response = None
    active_round_evaluated_teams = 0
    active_round_pending_teams = total_teams

    if active_round:
        active_round_response = ActiveRoundResponse(
            id=active_round.id,
            name=active_round.name,
            round_number=active_round.round_number,
        )

        # Number of teams evaluated in the active round
        active_round_evaluated_teams = db.scalar(
            select(
                func.count(func.distinct(Evaluation.team_id))
            )
            .where(
                Evaluation.round_id == active_round.id,
                Evaluation.status == "submitted",
            )
        ) or 0

        active_round_pending_teams = max(
            total_teams - active_round_evaluated_teams,
            0,
        )

    return AdminOverviewResponse(
        total_teams=total_teams,
        total_evaluators=total_evaluators,
        total_rounds=total_rounds,
        active_round=active_round_response,
        evaluations_submitted=evaluations_submitted,
        active_round_evaluated_teams=active_round_evaluated_teams,
        active_round_pending_teams=active_round_pending_teams,
    )