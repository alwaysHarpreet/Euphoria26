from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.problem import ProblemStatement
from app.models.team import Team
from app.routers.dependencies import get_current_admin
from app.schemas.admin_problem_selection import (
    AdminProblemMappingResponse,
    AdminSelectedTeam,
)


router = APIRouter(
    prefix="/admin",
    tags=["Admin Problem Selection"],
)


@router.get(
    "/problem-selection",
    response_model=list[AdminProblemMappingResponse],
)
def get_problem_selection_mapping(
    search: str | None = Query(default=None),
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    statement = select(ProblemStatement)

    if search and search.strip():
        search_pattern = f"%{search.strip()}%"

        statement = statement.where(
            or_(
                ProblemStatement.title.ilike(search_pattern),
                ProblemStatement.description.ilike(search_pattern),
                ProblemStatement.requirements.ilike(search_pattern),
                ProblemStatement.expectations.ilike(search_pattern),
            )
        )

    problems = db.scalars(
        statement.order_by(ProblemStatement.id)
    ).all()

    teams = db.scalars(
        select(Team)
        .where(Team.selected_problem_id.is_not(None))
        .order_by(Team.team_name)
    ).all()

    teams_by_problem: dict[int, list[Team]] = {}

    for team in teams:
        if team.selected_problem_id is None:
            continue

        teams_by_problem.setdefault(
            team.selected_problem_id,
            [],
        ).append(team)

    response = []

    for problem in problems:
        selected_teams = teams_by_problem.get(
            problem.id,
            [],
        )

        team_response = [
            AdminSelectedTeam(
                id=team.id,
                team_name=team.team_name,
                college_name=team.college_name,
                leader_name=team.leader_name,
                leader_email=team.leader_email,
            )
            for team in selected_teams
        ]

        teams_selected = len(team_response)

        response.append(
            AdminProblemMappingResponse(
                problem_id=problem.id,
                problem_title=problem.title,
                teams_selected=teams_selected,
                capacity=settings.MAX_TEAMS_PER_PROBLEM,
                available_slots=max(
                    settings.MAX_TEAMS_PER_PROBLEM
                    - teams_selected,
                    0,
                ),
                teams=team_response,
            )
        )

    return response