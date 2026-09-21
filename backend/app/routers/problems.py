import io
import re
from datetime import datetime, timezone
from xml.sax.saxutils import escape

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from fastapi.responses import StreamingResponse
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
)
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.event_settings import EventSetting
from app.models.problem import ProblemStatement
from app.models.team import Team
from app.routers.dependencies import get_current_team
from app.schemas.event_settings import ProblemReleaseStatusResponse
from app.schemas.problem import (
    ProblemResponse,
    ProblemSelectionResponse,
)
from app.services.problem_release import problem_release_manager


router = APIRouter(
    prefix="/problems",
    tags=["Problems"],
)


def _get_or_create_event_settings(db: Session) -> EventSetting:
    event_setting = db.scalar(
        select(EventSetting).where(EventSetting.id == 1)
    )

    if event_setting is None:
        event_setting = EventSetting(
            id=1,
            problem_release_status="not_started",
            repository_active=False,
            feedback_active=False,
        )
        db.add(event_setting)
        db.commit()
        db.refresh(event_setting)

    # Automatically transition countdown -> released
    # when the server-side release time has been reached.
    if event_setting.problem_release_status == "countdown":
        if event_setting.problem_release_at:
            release_at = event_setting.problem_release_at

            if release_at.tzinfo is None:
                release_at = release_at.replace(
                    tzinfo=timezone.utc
                )

            now = datetime.now(timezone.utc)

            if now >= release_at:
                event_setting.problem_release_status = "released"
                db.commit()
                db.refresh(event_setting)

    return event_setting


@router.get(
    "/status",
    response_model=ProblemReleaseStatusResponse,
)
@router.get(
    "/release-status",
    response_model=ProblemReleaseStatusResponse,
    include_in_schema=False,
)
def get_problem_release_status(
    db: Session = Depends(get_db),
):
    event_setting = _get_or_create_event_settings(db)
    now = datetime.now(timezone.utc)

    return ProblemReleaseStatusResponse(
        status=event_setting.problem_release_status,
        release_at=event_setting.problem_release_at,
        server_time=now,
    )


@router.get(
    "",
    response_model=list[ProblemResponse],
)
def get_problems(
    db: Session = Depends(get_db),
):
    event_setting = _get_or_create_event_settings(db)

    if event_setting.problem_release_status != "released":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Problem statements have not been released yet.",
        )

    selected_counts = (
        select(
            Team.selected_problem_id.label("problem_id"),
            func.count(Team.id).label("teams_selected"),
        )
        .where(
            Team.selected_problem_id.is_not(None)
        )
        .group_by(
            Team.selected_problem_id
        )
        .subquery()
    )

    statement = (
        select(
            ProblemStatement,
            func.coalesce(
                selected_counts.c.teams_selected,
                0,
            ).label("teams_selected"),
        )
        .outerjoin(
            selected_counts,
            selected_counts.c.problem_id
            == ProblemStatement.id,
        )
        .where(
            ProblemStatement.is_active.is_(True)
        )
        .order_by(
            ProblemStatement.id
        )
    )

    rows = db.execute(statement).all()

    return [
        ProblemResponse(
            id=problem.id,
            title=problem.title,
            description=problem.description,
            requirements=problem.requirements,
            expectations=problem.expectations,
            is_active=problem.is_active,
            created_at=problem.created_at,
            teams_selected=int(
                teams_selected or 0
            ),
            capacity=settings.MAX_TEAMS_PER_PROBLEM,
        )
        for problem, teams_selected in rows
    ]


@router.post(
    "/{problem_id}/select",
    response_model=ProblemSelectionResponse,
)
def select_problem(
    problem_id: int,
    current_team: Team = Depends(get_current_team),
    db: Session = Depends(get_db),
):
    event_setting = _get_or_create_event_settings(db)

    if event_setting.problem_release_status != "released":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Problem statements have not been released yet.",
        )

    team = db.scalar(
        select(Team)
        .where(
            Team.id == current_team.id
        )
        .with_for_update()
    )

    if team is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Team not found",
        )

    if team.selected_problem_id is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Your team has already selected "
                "a problem statement"
            ),
        )

    problem = db.scalar(
        select(ProblemStatement)
        .where(
            ProblemStatement.id == problem_id,
            ProblemStatement.is_active.is_(True),
        )
        .with_for_update()
    )

    if problem is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Problem statement not found "
                "or inactive"
            ),
        )

    selected_count = db.scalar(
        select(func.count(Team.id)).where(
            Team.selected_problem_id == problem.id
        )
    )

    selected_count = int(
        selected_count or 0
    )

    if selected_count >= settings.MAX_TEAMS_PER_PROBLEM:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Problem statement is full. "
                "Maximum allowed teams: "
                f"{settings.MAX_TEAMS_PER_PROBLEM}"
            ),
        )

    team.selected_problem_id = problem.id

    db.commit()
    db.refresh(team)

    new_count = selected_count + 1

    return ProblemSelectionResponse(
        message=(
            "Problem statement selected "
            "successfully"
        ),
        problem=ProblemResponse(
            id=problem.id,
            title=problem.title,
            description=problem.description,
            requirements=problem.requirements,
            expectations=problem.expectations,
            is_active=problem.is_active,
            created_at=problem.created_at,
            teams_selected=new_count,
            capacity=settings.MAX_TEAMS_PER_PROBLEM,
        ),
        teams_selected=new_count,
        capacity=settings.MAX_TEAMS_PER_PROBLEM,
    )


@router.get(
    "/{problem_id}/pdf",
)
def download_problem_pdf(
    problem_id: int,
    current_team: Team = Depends(get_current_team),
    db: Session = Depends(get_db),
):
    event_setting = _get_or_create_event_settings(db)

    if event_setting.problem_release_status != "released":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Problem statements have not been released yet.",
        )

    problem = db.scalar(
        select(ProblemStatement).where(
            ProblemStatement.id == problem_id,
            ProblemStatement.is_active.is_(True),
        )
    )

    if problem is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem statement not found or inactive.",
        )

    buffer = io.BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title=problem.title,
        author="HackOddsey",
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "ProblemTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=26,
        alignment=TA_LEFT,
        spaceAfter=14,
    )

    section_style = ParagraphStyle(
        "ProblemSection",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor="#4B5563",
        spaceBefore=12,
        spaceAfter=7,
    )

    body_style = ParagraphStyle(
        "ProblemBody",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10,
        leading=16,
        textColor="#374151",
        spaceAfter=8,
    )

    meta_style = ParagraphStyle(
        "ProblemMeta",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor="#6B7280",
        spaceAfter=4,
    )

    def pdf_text(value: str) -> str:
        return escape(value).replace(
            "\n",
            "<br/>",
        )

    story = []

    story.append(
        Paragraph(
            pdf_text(problem.title),
            title_style,
        )
    )

    story.append(
        Paragraph(
            "HackOddsey Problem Statement",
            meta_style,
        )
    )

    story.append(Spacer(1, 8))

    story.append(
        Paragraph(
            "Description",
            section_style,
        )
    )

    story.append(
        Paragraph(
            pdf_text(problem.description),
            body_style,
        )
    )

    story.append(
        Paragraph(
            "Requirements",
            section_style,
        )
    )

    story.append(
        Paragraph(
            pdf_text(problem.requirements),
            body_style,
        )
    )

    story.append(
        Paragraph(
            "Expectations",
            section_style,
        )
    )

    story.append(
        Paragraph(
            pdf_text(problem.expectations),
            body_style,
        )
    )

    story.append(Spacer(1, 12))

    story.append(
        Paragraph(
            f"Team selection capacity: "
            f"{settings.MAX_TEAMS_PER_PROBLEM} teams",
            meta_style,
        )
    )

    document.build(story)

    buffer.seek(0)

    safe_title = re.sub(
        r"[^a-zA-Z0-9]+",
        "_",
        problem.title,
    ).strip("_")

    filename = (
        f"{safe_title[:80] or 'problem_statement'}.pdf"
    )

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        },
    )


@router.websocket("/ws/release")
async def problem_release_websocket(
    websocket: WebSocket,
    db: Session = Depends(get_db),
):
    await problem_release_manager.connect(websocket)

    try:
        event_setting = _get_or_create_event_settings(db)
        now = datetime.now(timezone.utc)

        await websocket.send_json(
            {
                "type": "release_update",
                "status": event_setting.problem_release_status,
                "release_at": (
                    event_setting.problem_release_at.isoformat()
                    if event_setting.problem_release_at
                    else None
                ),
                "server_time": now.isoformat(),
            }
        )

        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        problem_release_manager.disconnect(websocket)