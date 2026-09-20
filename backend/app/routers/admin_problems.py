import csv
import io
from datetime import datetime, timedelta, timezone

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.event_settings import EventSetting
from app.models.problem import ProblemStatement
from app.models.team import Team
from app.routers.dependencies import get_current_admin
from app.schemas.admin_problem import (
    AdminProblemCreate,
    AdminProblemResponse,
    AdminProblemUpdate,
)
from app.schemas.event_settings import (
    AdminEventSettingsResponse,
    CountdownStartRequest,
)
from app.services.problem_release import problem_release_manager


router = APIRouter(
    prefix="/admin",
    tags=["Admin Problems"],
)


def _get_capacity() -> int:
    capacity = settings.MAX_TEAMS_PER_PROBLEM

    if capacity < 1:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="MAX_TEAMS_PER_PROBLEM must be greater than zero.",
        )

    return capacity


def _problem_response(
    problem: ProblemStatement,
    teams_selected: int,
) -> AdminProblemResponse:
    capacity = _get_capacity()

    return AdminProblemResponse(
        id=problem.id,
        title=problem.title,
        description=problem.description,
        requirements=problem.requirements,
        expectations=problem.expectations,
        is_active=problem.is_active,
        created_at=problem.created_at,
        teams_selected=teams_selected,
        capacity=capacity,
        available_slots=max(capacity - teams_selected, 0),
    )


def _selected_count(
    db: Session,
    problem_id: int,
) -> int:
    count = db.scalar(
        select(func.count(Team.id)).where(
            Team.selected_problem_id == problem_id
        )
    )

    return int(count or 0)


def _get_problem_or_404(
    db: Session,
    problem_id: int,
) -> ProblemStatement:
    problem = db.scalar(
        select(ProblemStatement).where(
            ProblemStatement.id == problem_id
        )
    )

    if problem is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem statement not found.",
        )

    return problem


def _get_or_create_event_settings(
    db: Session,
) -> EventSetting:
    event_setting = db.scalar(
        select(EventSetting).where(
            EventSetting.id == 1
        )
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


# ---------------------------------------------------------
# PROBLEM RELEASE & COUNTDOWN ADMIN CONTROL
# ---------------------------------------------------------


@router.get(
    "/problems/release-status",
    response_model=AdminEventSettingsResponse,
)
def get_admin_release_status(
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    event_setting = _get_or_create_event_settings(db)

    now = datetime.now(timezone.utc)

    return AdminEventSettingsResponse(
        problem_release_status=event_setting.problem_release_status,
        problem_release_at=event_setting.problem_release_at,
        repository_active=event_setting.repository_active,
        feedback_active=event_setting.feedback_active,
        server_time=now,
    )


@router.post(
    "/problems/release-countdown",
    response_model=AdminEventSettingsResponse,
)
async def start_problem_release_countdown(
    request_data: CountdownStartRequest,
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    event_setting = _get_or_create_event_settings(db)

    now = datetime.now(timezone.utc)

    release_at = now + timedelta(
        seconds=request_data.duration_seconds
    )

    event_setting.problem_release_status = "countdown"
    event_setting.problem_release_at = release_at

    db.commit()
    db.refresh(event_setting)

    await problem_release_manager.broadcast({
        "type": "release_update",
        "status": "countdown",
        "release_at": release_at.isoformat(),
        "server_time": now.isoformat(),
    })

    return AdminEventSettingsResponse(
        problem_release_status=event_setting.problem_release_status,
        problem_release_at=event_setting.problem_release_at,
        repository_active=event_setting.repository_active,
        feedback_active=event_setting.feedback_active,
        server_time=now,
    )


@router.post(
    "/problems/release-now",
    response_model=AdminEventSettingsResponse,
)
async def force_release_problems(
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    event_setting = _get_or_create_event_settings(db)

    now = datetime.now(timezone.utc)

    event_setting.problem_release_status = "released"
    event_setting.problem_release_at = now

    db.commit()
    db.refresh(event_setting)

    await problem_release_manager.broadcast({
        "type": "release_update",
        "status": "released",
        "release_at": now.isoformat(),
        "server_time": now.isoformat(),
    })

    return AdminEventSettingsResponse(
        problem_release_status=event_setting.problem_release_status,
        problem_release_at=event_setting.problem_release_at,
        repository_active=event_setting.repository_active,
        feedback_active=event_setting.feedback_active,
        server_time=now,
    )


@router.post(
    "/problems/reset-release",
    response_model=AdminEventSettingsResponse,
)
async def reset_problem_release(
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    event_setting = _get_or_create_event_settings(db)

    now = datetime.now(timezone.utc)

    event_setting.problem_release_status = "not_started"
    event_setting.problem_release_at = None

    db.commit()
    db.refresh(event_setting)

    await problem_release_manager.broadcast({
        "type": "release_update",
        "status": "not_started",
        "release_at": None,
        "server_time": now.isoformat(),
    })

    return AdminEventSettingsResponse(
        problem_release_status=event_setting.problem_release_status,
        problem_release_at=event_setting.problem_release_at,
        repository_active=event_setting.repository_active,
        feedback_active=event_setting.feedback_active,
        server_time=now,
    )


# ---------------------------------------------------------
# RESET ALL PROBLEM STATEMENTS
# ---------------------------------------------------------


@router.post(
    "/problems/reset",
)
async def reset_all_problem_statements(
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Permanently removes all problem statements,
    clears all team-to-problem selections, and
    resets problem release state.

    Repository and feedback settings are preserved.
    """

    # Clear all team problem selections first.
    db.query(Team).update(
        {
            Team.selected_problem_id: None,
        },
        synchronize_session=False,
    )

    # Delete all problem statements.
    deleted_count = db.query(
        ProblemStatement
    ).delete(
        synchronize_session=False,
    )

    # Reset problem release state.
    event_setting = _get_or_create_event_settings(db)

    event_setting.problem_release_status = "not_started"
    event_setting.problem_release_at = None

    db.commit()
    db.refresh(event_setting)

    now = datetime.now(timezone.utc)

    # Notify connected clients that the release state
    # has been reset.
    await problem_release_manager.broadcast({
        "type": "release_update",
        "status": "not_started",
        "release_at": None,
        "server_time": now.isoformat(),
    })

    return {
        "message": "All problem statements have been reset.",
        "deleted_count": deleted_count,
        "problem_release_status": "not_started",
        "repository_active": event_setting.repository_active,
        "feedback_active": event_setting.feedback_active,
    }


# ---------------------------------------------------------
# PROBLEM MANAGEMENT
# ---------------------------------------------------------


@router.get(
    "/problems",
    response_model=list[AdminProblemResponse],
)
def get_admin_problems(
    search: str | None = Query(default=None),
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    _get_capacity()

    statement = select(ProblemStatement)

    if search and search.strip():
        search_pattern = f"%{search.strip()}%"

        statement = statement.where(
            (ProblemStatement.title.ilike(search_pattern))
            | (
                ProblemStatement.description.ilike(
                    search_pattern
                )
            )
            | (
                ProblemStatement.requirements.ilike(
                    search_pattern
                )
            )
            | (
                ProblemStatement.expectations.ilike(
                    search_pattern
                )
            )
        )

    problems = db.scalars(
        statement.order_by(ProblemStatement.id)
    ).all()

    return [
        _problem_response(
            problem,
            _selected_count(
                db,
                problem.id,
            ),
        )
        for problem in problems
    ]


@router.get(
    "/problems/{problem_id}",
    response_model=AdminProblemResponse,
)
def get_admin_problem(
    problem_id: int,
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    problem = _get_problem_or_404(
        db,
        problem_id,
    )

    return _problem_response(
        problem,
        _selected_count(
            db,
            problem.id,
        ),
    )


@router.post(
    "/problems",
    response_model=AdminProblemResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_admin_problem(
    problem_data: AdminProblemCreate,
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    _get_capacity()

    title = problem_data.title.strip()
    description = problem_data.description.strip()
    requirements = problem_data.requirements.strip()
    expectations = problem_data.expectations.strip()

    if not title:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Title cannot be blank.",
        )

    if not description:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Description cannot be blank.",
        )

    problem = ProblemStatement(
        title=title,
        description=description,
        requirements=requirements,
        expectations=expectations,
        is_active=problem_data.is_active,
    )

    db.add(problem)
    db.commit()
    db.refresh(problem)

    return _problem_response(
        problem,
        0,
    )


@router.put(
    "/problems/{problem_id}",
    response_model=AdminProblemResponse,
)
def update_admin_problem(
    problem_id: int,
    problem_data: AdminProblemUpdate,
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    problem = _get_problem_or_404(
        db,
        problem_id,
    )

    if problem_data.title is not None:
        title = problem_data.title.strip()

        if not title:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Title cannot be blank.",
            )

        problem.title = title

    if problem_data.description is not None:
        description = problem_data.description.strip()

        if not description:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Description cannot be blank.",
            )

        problem.description = description

    if problem_data.requirements is not None:
        problem.requirements = (
            problem_data.requirements.strip()
        )

    if problem_data.expectations is not None:
        problem.expectations = (
            problem_data.expectations.strip()
        )

    if problem_data.is_active is not None:
        problem.is_active = problem_data.is_active

    db.commit()
    db.refresh(problem)

    return _problem_response(
        problem,
        _selected_count(
            db,
            problem.id,
        ),
    )


# ---------------------------------------------------------
# CSV BULK UPLOAD
# ---------------------------------------------------------


@router.post(
    "/problems/upload-csv",
    status_code=status.HTTP_201_CREATED,
)
async def upload_problems_csv(
    file: UploadFile = File(...),
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file is required.",
        )

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are allowed.",
        )

    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded CSV file is empty.",
        )

    try:
        decoded = contents.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file must use UTF-8 encoding.",
        )

    reader = csv.DictReader(
        io.StringIO(decoded)
    )

    required_headers = [
        "title",
        "description",
        "requirements",
        "expectations",
        "is_active",
    ]

    headers = [
        header.strip()
        if header
        else header
        for header in (
            reader.fieldnames or []
        )
    ]

    if headers != required_headers:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": (
                    "CSV headers must exactly match the "
                    "required schema."
                ),
                "expected_headers": required_headers,
                "received_headers": headers,
            },
        )

    rows = list(reader)

    if not rows:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="CSV file contains no problem statements.",
        )

    errors: list[dict] = []
    validated_rows: list[dict] = []
    csv_titles: set[str] = set()

    for row_number, row in enumerate(
        rows,
        start=2,
    ):
        title = (row.get("title") or "").strip()
        description = (
            row.get("description") or ""
        ).strip()
        requirements = (
            row.get("requirements") or ""
        ).strip()
        expectations = (
            row.get("expectations") or ""
        ).strip()
        is_active_raw = (
            row.get("is_active") or ""
        ).strip().lower()

        row_errors: list[str] = []

        if not title:
            row_errors.append(
                "title cannot be blank"
            )
        elif len(title) > 200:
            row_errors.append(
                "title cannot exceed 200 characters"
            )

        if not description:
            row_errors.append(
                "description cannot be blank"
            )

        if not requirements:
            row_errors.append(
                "requirements cannot be blank"
            )

        if not expectations:
            row_errors.append(
                "expectations cannot be blank"
            )

        if is_active_raw not in {
            "true",
            "false",
        }:
            row_errors.append(
                "is_active must be true or false"
            )

        normalized_title = title.casefold()

        if (
            title
            and normalized_title in csv_titles
        ):
            row_errors.append(
                "duplicate title in CSV"
            )

        if title:
            csv_titles.add(
                normalized_title
            )

        if row_errors:
            errors.append({
                "row": row_number,
                "errors": row_errors,
            })
            continue

        validated_rows.append({
            "title": title,
            "description": description,
            "requirements": requirements,
            "expectations": expectations,
            "is_active": (
                is_active_raw == "true"
            ),
        })

    if errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": (
                    "CSV validation failed. "
                    "No problems were inserted."
                ),
                "errors": errors,
            },
        )

    normalized_titles = [
        row["title"].casefold()
        for row in validated_rows
    ]

    existing_problems = db.scalars(
        select(ProblemStatement).where(
            func.lower(
                ProblemStatement.title
            ).in_(normalized_titles)
        )
    ).all()

    if existing_problems:
        duplicate_titles = [
            problem.title
            for problem in existing_problems
        ]

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": (
                    "Some problem titles already "
                    "exist in the database. "
                    "No problems were inserted."
                ),
                "duplicate_titles": duplicate_titles,
            },
        )

    problems = [
        ProblemStatement(
            title=row["title"],
            description=row["description"],
            requirements=row["requirements"],
            expectations=row["expectations"],
            is_active=row["is_active"],
        )
        for row in validated_rows
    ]

    try:
        db.add_all(problems)
        db.commit()

        for problem in problems:
            db.refresh(problem)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Failed to import problem statements. "
                "No problems were inserted."
            ),
        )

    return {
        "message": (
            "Problem statements imported successfully."
        ),
        "created_count": len(problems),
        "problems": [
            _problem_response(
                problem,
                0,
            )
            for problem in problems
        ],
    }