from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.team import Team
from app.routers.dependencies import get_current_admin
from app.schemas.admin_team import AdminTeamResponse

router = APIRouter(
    prefix="/admin",
    tags=["Admin Teams"],
)


@router.get(
    "/teams",
    response_model=list[AdminTeamResponse],
)
def get_admin_teams(
    request: Request,
    search: str | None = Query(default=None),
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    statement = select(Team)

    if search:
        search_pattern = f"%{search.strip()}%"

        statement = statement.where(
            (Team.team_name.ilike(search_pattern))
            | (Team.college_name.ilike(search_pattern))
            | (Team.leader_name.ilike(search_pattern))
            | (Team.leader_email.ilike(search_pattern))
        )

    statement = statement.order_by(Team.team_name)

    teams = db.scalars(statement).all()

    response = []

    for team in teams:
        team_data = AdminTeamResponse.model_validate(team)

        if team.group_photo_path:
            team_data.group_photo_path = (
                str(request.base_url).rstrip("/")
                + "/uploads/"
                + team.group_photo_path
            )

        response.append(team_data)

    return response