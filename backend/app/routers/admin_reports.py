import csv
import io

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.evaluation import Evaluation
from app.models.evaluator import Evaluator
from app.models.problem import ProblemStatement
from app.models.round import Round
from app.models.team import Team
from app.routers.dependencies import get_current_admin


router = APIRouter(
    prefix="/admin/reports",
    tags=["Admin Reports"],
)


def _csv_response(
    content: str,
    filename: str,
) -> StreamingResponse:
    return StreamingResponse(
        iter([content]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            ),
        },
    )


@router.get("/evaluations.csv")
def export_evaluations_csv(
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    statement = (
        select(
            Team.team_name,
            Team.college_name,
            Round.name.label("round_name"),
            Round.round_number,
            Evaluator.name.label("evaluator_name"),
            Evaluation.score,
            Evaluation.remarks,
            Evaluation.status,
            Evaluation.created_at,
        )
        .join(Team, Evaluation.team_id == Team.id)
        .join(Evaluator, Evaluation.evaluator_id == Evaluator.id)
        .join(Round, Evaluation.round_id == Round.id)
        .order_by(Evaluation.created_at.desc(), Evaluation.id.desc())
    )

    rows = db.execute(statement).all()
    output = io.StringIO(newline="")
    writer = csv.writer(output)

    writer.writerow([
        "Team Name",
        "College Name",
        "Round",
        "Round Number",
        "Evaluator",
        "Score",
        "Remarks",
        "Status",
        "Submitted At",
    ])

    for row in rows:
        writer.writerow([
            row.team_name,
            row.college_name,
            row.round_name,
            row.round_number,
            row.evaluator_name,
            row.score,
            row.remarks,
            row.status,
            row.created_at,
        ])

    return _csv_response(
        output.getvalue(),
        "hackoddsey_evaluations.csv",
    )


@router.get("/teams.csv")
def export_teams_csv(
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    statement = (
        select(
            Team.team_name,
            Team.college_name,
            Team.leader_name,
            Team.leader_email,
            ProblemStatement.title,
            Team.group_photo_path,
            Team.created_at,
        )
        .outerjoin(
            ProblemStatement,
            Team.selected_problem_id == ProblemStatement.id,
        )
        .order_by(Team.team_name)
    )

    rows = db.execute(statement).all()
    output = io.StringIO(newline="")
    writer = csv.writer(output)

    writer.writerow([
        "Team Name",
        "College Name",
        "Leader Name",
        "Leader Email",
        "Selected Problem",
        "Group Photo",
        "Created At",
    ])

    for row in rows:
        writer.writerow([
            row.team_name,
            row.college_name,
            row.leader_name,
            row.leader_email,
            row.title or "",
            row.group_photo_path or "",
            row.created_at,
        ])

    return _csv_response(
        output.getvalue(),
        "hackoddsey_teams.csv",
    )