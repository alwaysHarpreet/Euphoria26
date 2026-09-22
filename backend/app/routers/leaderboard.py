from fastapi import APIRouter, Depends, Query, Request, WebSocket, WebSocketDisconnect
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.evaluation import Evaluation
from app.models.round import Round
from app.models.team import Team
from app.schemas.leaderboard import (
    LeaderboardEntry,
    LeaderboardResponse,
    LeaderboardRound,
)
from app.services.leaderboard import leaderboard_manager


router = APIRouter(tags=["Leaderboard"])


@router.get(
    "/leaderboard",
    response_model=LeaderboardResponse,
)
def get_leaderboard(
    request: Request,
    round_id: int | None = Query(default=None),
    overall: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    # ============================================================
    # OVERALL LEADERBOARD
    # ============================================================
    # Overall means the cumulative score of every submitted
    # evaluation for each team across all rounds held so far.
    #
    # Example:
    # Team A:
    #   Round 1 = 80
    #   Round 2 = 90
    #   Overall = 170
    #
    # Only submitted evaluations with a non-null score are included.
    # Therefore, future/uncompleted rounds automatically contribute
    # nothing until an evaluation is submitted.
    # ============================================================
    if overall:
        statement = (
            select(
                Team.id.label("team_id"),
                Team.team_name,
                Team.college_name,
                Team.group_photo_path,
                func.sum(Evaluation.score).label("total_score"),
            )
            .join(
                Evaluation,
                Evaluation.team_id == Team.id,
            )
            .where(
                Evaluation.status == "submitted",
                Evaluation.score.is_not(None),
            )
            .group_by(
                Team.id,
                Team.team_name,
                Team.college_name,
                Team.group_photo_path,
            )
            .order_by(
                func.sum(Evaluation.score).desc(),
                Team.team_name.asc(),
                Team.id.asc(),
            )
        )

        rows = db.execute(statement).all()

        entries: list[LeaderboardEntry] = []
        previous_score: int | None = None
        current_rank = 0

        for index, (
            team_id,
            team_name,
            college_name,
            group_photo_path,
            total_score,
        ) in enumerate(rows, start=1):
            if total_score != previous_score:
                current_rank = index
                previous_score = total_score

            group_photo_url = None

            if group_photo_path:
                group_photo_url = (
                    str(request.base_url).rstrip("/")
                    + "/uploads/"
                    + group_photo_path
                )

            entries.append(
                LeaderboardEntry(
                    rank=current_rank,
                    team_id=team_id,
                    team_name=team_name,
                    college_name=college_name,
                    group_photo_url=group_photo_url,
                    score=total_score,
                    status="submitted",
                )
            )

        updated_at = db.scalar(
            select(func.max(Evaluation.updated_at)).where(
                Evaluation.status == "submitted",
                Evaluation.score.is_not(None),
            )
        )

        return LeaderboardResponse(
            round=None,
            updated_at=updated_at,
            entries=entries,
        )

    # ============================================================
    # ROUND-SPECIFIC LEADERBOARD
    # ============================================================

    if round_id is None:
        selected_round = db.scalar(
            select(Round)
            .where(Round.is_active.is_(True))
            .order_by(Round.round_number)
        )
    else:
        selected_round = db.scalar(
            select(Round).where(Round.id == round_id)
        )

    if selected_round is None:
        return LeaderboardResponse(
            round=None,
            updated_at=None,
            entries=[],
            message=(
                "No active round is currently available."
                if round_id is None
                else "Round not found."
            ),
        )

    statement = (
        select(
            Evaluation,
            Team.team_name,
            Team.college_name,
            Team.group_photo_path,
        )
        .join(Team, Evaluation.team_id == Team.id)
        .where(
            Evaluation.round_id == selected_round.id,
            Evaluation.status == "submitted",
            Evaluation.score.is_not(None),
        )
        .order_by(
            Evaluation.score.desc(),
            Team.team_name.asc(),
            Team.id.asc(),
        )
    )

    rows = db.execute(statement).all()

    entries: list[LeaderboardEntry] = []
    previous_score: int | None = None
    current_rank = 0

    for index, (
        evaluation,
        team_name,
        college_name,
        group_photo_path,
    ) in enumerate(rows, start=1):
        if evaluation.score != previous_score:
            current_rank = index
            previous_score = evaluation.score

        group_photo_url = None

        if group_photo_path:
            group_photo_url = (
                str(request.base_url).rstrip("/")
                + "/uploads/"
                + group_photo_path
            )

        entries.append(
            LeaderboardEntry(
                rank=current_rank,
                team_id=evaluation.team_id,
                team_name=team_name,
                college_name=college_name,
                group_photo_url=group_photo_url,
                score=evaluation.score,
                status=evaluation.status,
            )
        )

    updated_at = max(
        (evaluation.updated_at for evaluation, *_ in rows),
        default=selected_round.created_at,
    )

    return LeaderboardResponse(
        round=LeaderboardRound(
            id=selected_round.id,
            name=selected_round.name,
            round_number=selected_round.round_number,
        ),
        updated_at=updated_at,
        entries=entries,
    )


@router.websocket("/ws/leaderboard/{round_id}")
async def leaderboard_websocket(
    websocket: WebSocket,
    round_id: int,
):
    await leaderboard_manager.connect(round_id, websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        leaderboard_manager.disconnect(round_id, websocket)