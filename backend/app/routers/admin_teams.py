import csv
import io

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    Request,
    UploadFile,
    status,
)
from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.team import Team
from app.models.team_member import TeamMember
from app.routers.dependencies import get_current_admin
from app.schemas.admin_import import TeamImportResult
from app.schemas.admin_team import AdminTeamResponse
from app.security import hash_password


router = APIRouter(
    prefix="/admin",
    tags=["Admin Teams"],
)


CSV_HEADERS = [
    "teamId",
    "password",
    "teamName",
    "memberName",
    "registrationNumber",
    "collegeName",
    "email",
    "academicYear",
    "role",
]

EMAIL_ADAPTER = TypeAdapter(EmailStr)


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
            (Team.team_code.ilike(search_pattern))
            | (Team.team_name.ilike(search_pattern))
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


@router.post(
    "/teams/import",
    response_model=TeamImportResult,
    status_code=status.HTTP_201_CREATED,
)
def import_teams_csv(
    file: UploadFile = File(...),
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please select a CSV file.",
        )

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are allowed.",
        )

    try:
        content = file.file.read().decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file must use UTF-8 encoding.",
        )

    if not content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file is empty.",
        )

    reader = csv.DictReader(
        io.StringIO(content)
    )

    if reader.fieldnames is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV header is missing.",
        )

    actual_headers = [
        header.strip()
        if header is not None
        else ""
        for header in reader.fieldnames
    ]

    if actual_headers != CSV_HEADERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Invalid CSV header.",
                "expected": CSV_HEADERS,
                "received": actual_headers,
            },
        )

    rows = []

    for row_number, raw_row in enumerate(reader, start=2):
        if None in raw_row:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Row {row_number} contains extra columns.",
            )

        row = {
            key: (value or "").strip()
            for key, value in raw_row.items()
        }

        if not any(row.values()):
            continue

        missing_fields = [
            field
            for field in CSV_HEADERS
            if not row.get(field)
        ]

        if missing_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Row {row_number} is missing: "
                    + ", ".join(missing_fields)
                ),
            )

        try:
            EMAIL_ADAPTER.validate_python(row["email"])
        except ValidationError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Row {row_number} has an invalid email: "
                    f"{row['email']}"
                ),
            )

        if row["role"] not in {"Leader", "Member"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Row {row_number} has invalid role "
                    f"'{row['role']}'. "
                    "Allowed values are Leader or Member."
                ),
            )

        rows.append(row)

    if not rows:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV contains no participant records.",
        )

    grouped: dict[str, list[dict[str, str]]] = {}

    for row in rows:
        grouped.setdefault(
            row["teamId"],
            [],
        ).append(row)

    errors: list[str] = []

    team_codes = set()
    registration_numbers = set()
    emails = set()

    for team_code, team_rows in grouped.items():
        if team_code in team_codes:
            errors.append(
                f"Duplicate team ID: {team_code}"
            )

        team_codes.add(team_code)

        if len(team_rows) not in {4, 5}:
            errors.append(
                f"Team {team_code} must have 4 or 5 members; "
                f"found {len(team_rows)}."
            )

        leaders = [
            row
            for row in team_rows
            if row["role"] == "Leader"
        ]

        if len(leaders) != 1:
            errors.append(
                f"Team {team_code} must have exactly one Leader; "
                f"found {len(leaders)}."
            )

        team_names = {
            row["teamName"]
            for row in team_rows
        }

        if len(team_names) != 1:
            errors.append(
                f"Team {team_code} has inconsistent teamName values."
            )

        colleges = {
            row["collegeName"]
            for row in team_rows
        }

        if len(colleges) != 1:
            errors.append(
                f"Team {team_code} has inconsistent collegeName values."
            )

        passwords = {
            row["password"]
            for row in team_rows
        }

        if len(passwords) != 1:
            errors.append(
                f"Team {team_code} has inconsistent passwords."
            )

        for row in team_rows:
            registration_number = row["registrationNumber"].lower()

            if registration_number in registration_numbers:
                errors.append(
                    "Duplicate registration number in CSV: "
                    f"{row['registrationNumber']}"
                )

            registration_numbers.add(
                registration_number
            )

            email = row["email"].lower()

            if email in emails:
                errors.append(
                    f"Duplicate email in CSV: {row['email']}"
                )

            emails.add(email)

    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "CSV validation failed.",
                "errors": errors,
            },
        )

    existing_team_codes = set(
        db.scalars(
            select(Team.team_code).where(
                Team.team_code.in_(team_codes)
            )
        ).all()
    )

    duplicate_team_codes = sorted(
        code
        for code in existing_team_codes
        if code is not None
    )

    if duplicate_team_codes:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "The following team IDs already exist: "
                + ", ".join(duplicate_team_codes)
            ),
        )

    existing_emails = {
        email.lower()
        for email in db.scalars(
            select(Team.leader_email).where(
                Team.leader_email.in_(emails)
            )
        ).all()
    }

    if existing_emails:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "The following emails already exist: "
                + ", ".join(sorted(existing_emails))
            ),
        )

    teams_to_create = []
    members_to_create = []

    for team_code, team_rows in grouped.items():
        leader = next(
            row
            for row in team_rows
            if row["role"] == "Leader"
        )

        team = Team(
            team_code=team_code,
            team_name=leader["teamName"],
            college_name=leader["collegeName"],
            leader_name=leader["memberName"],
            leader_email=leader["email"],
            password_hash=hash_password(
                leader["password"]
            ),
        )

        teams_to_create.append(team)

        for row in team_rows:
            members_to_create.append(
                (
                    team,
                    TeamMember(
                        name=row["memberName"],
                        college=row["collegeName"],
                        year=row["academicYear"],
                        registration_number=row[
                            "registrationNumber"
                        ],
                        email=row["email"],
                        role=row["role"],
                        department=None,
                    ),
                )
            )

    try:
        for team in teams_to_create:
            db.add(team)

        db.flush()

        for team, member in members_to_create:
            member.team_id = team.id
            db.add(member)

        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "CSV import could not be completed because "
                "one or more team or member records already exist."
            ),
        )

    return TeamImportResult(
        teams_imported=len(teams_to_create),
        members_imported=len(members_to_create),
    )