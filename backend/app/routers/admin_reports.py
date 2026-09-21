import csv
import io
import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request as UrlRequest
from urllib.request import urlopen

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.evaluation import Evaluation
from app.models.evaluator import Evaluator
from app.models.feedback import TeamFeedback
from app.models.round import Round
from app.models.team import Team
from app.routers.dependencies import get_current_admin


router = APIRouter(
    prefix="/admin/reports",
    tags=["Admin Reports"],
)


def csv_response(
    rows: list[list[str]],
    filename: str,
):
    output = io.StringIO(
        newline="",
    )

    writer = csv.writer(output)
    writer.writerows(rows)

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        },
    )


def get_github_repository(
    repository_url: str | None,
):
    if not repository_url:
        return None

    try:
        parsed = urlparse(
            repository_url.strip()
        )

        if parsed.netloc.lower() not in {
            "github.com",
            "www.github.com",
        }:
            return None

        parts = [
            part
            for part in parsed.path.split("/")
            if part
        ]

        if len(parts) < 2:
            return None

        owner = parts[0]
        repository = parts[1]

        if repository.endswith(".git"):
            repository = repository[:-4]

        if not owner or not repository:
            return None

        return owner, repository

    except Exception:
        return None


def get_github_stars(
    repository_url: str | None,
):
    repository = get_github_repository(
        repository_url
    )

    if repository is None:
        return None

    owner, repo = repository

    api_url = (
        "https://api.github.com/repos/"
        f"{owner}/{repo}"
    )

    request = UrlRequest(
        api_url,
        headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": "HackOddsey-Admin-Reports",
        },
    )

    try:
        with urlopen(
            request,
            timeout=5,
        ) as response:
            data = json.loads(
                response.read().decode(
                    "utf-8"
                )
            )

        stars = data.get("stargazers_count")

        if isinstance(stars, int):
            return stars

    except (
        HTTPError,
        URLError,
        TimeoutError,
        ValueError,
        json.JSONDecodeError,
    ):
        return None

    return None


@router.get("/evaluations.csv")
def export_evaluations_csv(
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    statement = (
        select(
            Evaluation,
            Team,
            Evaluator,
            Round,
        )
        .join(
            Team,
            Team.id == Evaluation.team_id,
        )
        .join(
            Evaluator,
            Evaluator.id == Evaluation.evaluator_id,
        )
        .join(
            Round,
            Round.id == Evaluation.round_id,
        )
        .order_by(
            Team.team_name,
            Round.round_number,
            Evaluation.id,
        )
    )

    rows = [
        [
            "Team Name",
            "College",
            "Evaluator",
            "Round",
            "Score",
            "Status",
            "Remarks",
            "Created At",
            "Updated At",
        ]
    ]

    for (
        evaluation,
        team,
        evaluator,
        round_,
    ) in db.execute(statement).all():
        rows.append(
            [
                team.team_name,
                team.college_name,
                evaluator.name,
                (
                    f"Round {round_.round_number}: "
                    f"{round_.name}"
                ),
                (
                    str(evaluation.score)
                    if evaluation.score is not None
                    else ""
                ),
                evaluation.status,
                evaluation.remarks or "",
                evaluation.created_at.isoformat(),
                evaluation.updated_at.isoformat(),
            ]
        )

    return csv_response(
        rows,
        "hackoddsey_evaluations.csv",
    )


@router.get("/teams.csv")
def export_teams_csv(
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    statement = (
        select(Team)
        .order_by(Team.team_name)
    )

    teams = db.scalars(statement).all()

    rows = [
        [
            "Team Name",
            "College",
            "Team Leader",
            "Leader Email",
            "Team Code",
            "Selected Problem ID",
            "Group Photo",
            "Repository URL",
            "Repository Submitted At",
            "Created At",
        ]
    ]

    for team in teams:
        rows.append(
            [
                team.team_name,
                team.college_name,
                team.leader_name,
                team.leader_email,
                team.team_code or "",
                (
                    str(team.selected_problem_id)
                    if team.selected_problem_id
                    is not None
                    else ""
                ),
                team.group_photo_path or "",
                team.repository_url or "",
                (
                    team.repository_submitted_at.isoformat()
                    if team.repository_submitted_at
                    else ""
                ),
                team.created_at.isoformat(),
            ]
        )

    return csv_response(
        rows,
        "hackoddsey_teams.csv",
    )


@router.get(
    "/repository-feedback.csv"
)
def export_repository_feedback_csv(
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    statement = (
        select(
            Team,
            TeamFeedback,
        )
        .outerjoin(
            TeamFeedback,
            TeamFeedback.team_id == Team.id,
        )
        .order_by(Team.team_name)
    )

    rows = [
        [
            "Team Name",
            "Repository URL",
            "GitHub Status",
            "GitHub Stars",
            "Feedback Rating",
            "Feedback Comments",
        ]
    ]

    for team, feedback in db.execute(
        statement
    ).all():
        repository_url = team.repository_url

        if not repository_url:
            github_status = "Pending"
            github_stars = ""
        else:
            github_repository = (
                get_github_repository(
                    repository_url
                )
            )

            if github_repository is None:
                github_status = (
                    "Submitted - Not GitHub"
                )
                github_stars = ""
            else:
                github_status = "Completed"

                stars = get_github_stars(
                    repository_url
                )

                github_stars = (
                    str(stars)
                    if stars is not None
                    else "Unavailable"
                )

        feedback_rating = (
            str(feedback.rating)
            if feedback is not None
            else ""
        )

        feedback_comments = (
            feedback.comments
            if feedback is not None
            else ""
        )

        rows.append(
            [
                team.team_name,
                repository_url or "",
                github_status,
                github_stars,
                feedback_rating,
                feedback_comments,
            ]
        )

    return csv_response(
        rows,
        "hackoddsey_repository_feedback.csv",
    )