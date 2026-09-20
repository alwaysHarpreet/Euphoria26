from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import exists, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.evaluation import Evaluation
from app.models.round import Round
from app.models.team import Team
from app.routers.dependencies import get_current_evaluator
from app.schemas.evaluator import EvaluatorTeamResponse
from app.schemas.evaluation import EvaluationCreate, EvaluationResponse
from app.services.leaderboard import leaderboard_manager


router = APIRouter(
    prefix="/evaluator",
    tags=["Evaluator"],
)


@router.get(
    "/rounds/{round_id}/teams",
    response_model=list[EvaluatorTeamResponse],
)
def get_available_teams(
    round_id: int,
    request: Request,
    current_evaluator=Depends(get_current_evaluator),
    db: Session = Depends(get_db),
):
    round_data = db.scalar(
        select(Round).where(Round.id == round_id)
    )

    if round_data is None:
        raise HTTPException(
            status_code=404,
            detail="Round not found.",
        )

    submitted_evaluation_exists = exists(
        select(Evaluation.id).where(
            Evaluation.team_id == Team.id,
            Evaluation.round_id == round_id,
            Evaluation.status == "submitted",
        )
    )

    teams = db.scalars(
        select(Team)
        .where(~submitted_evaluation_exists)
        .order_by(Team.team_name)
    ).all()

    response = []

    for team in teams:
        group_photo_url = None

        if team.group_photo_path:
            group_photo_url = (
                str(request.base_url).rstrip("/")
                + "/uploads/"
                + team.group_photo_path
            )

        response.append(
            EvaluatorTeamResponse(
                id=team.id,
                team_name=team.team_name,
                college_name=team.college_name,
                leader_name=team.leader_name,
                group_photo_url=group_photo_url,
            )
        )

    return response


@router.post(
    "/rounds/{round_id}/teams/{team_id}/evaluation",
    response_model=EvaluationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def submit_evaluation(
    round_id: int,
    team_id: int,
    evaluation_data: EvaluationCreate,
    current_evaluator=Depends(get_current_evaluator),
    db: Session = Depends(get_db),
):
    round_data = db.scalar(
        select(Round).where(Round.id == round_id)
    )

    if round_data is None:
        raise HTTPException(
            status_code=404,
            detail="Round not found.",
        )

    team = db.scalar(
        select(Team).where(Team.id == team_id)
    )

    if team is None:
        raise HTTPException(
            status_code=404,
            detail="Team not found.",
        )

    evaluation = Evaluation(
        team_id=team_id,
        evaluator_id=current_evaluator.id,
        round_id=round_id,
        score=evaluation_data.score,
        remarks=evaluation_data.remarks,
        status="submitted",
    )

    db.add(evaluation)

    try:
        db.commit()
        db.refresh(evaluation)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="This team has already been evaluated for this round.",
        )

    await leaderboard_manager.broadcast(
        round_id=round_id,
        team_id=team_id,
    )

    return evaluation