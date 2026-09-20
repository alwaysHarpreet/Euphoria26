from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.feedback import TeamFeedback
from app.models.problem import ProblemStatement
from app.models.team import Team
from app.models.team_member import TeamMember
from app.routers.dependencies import get_current_team
from app.schemas.team import TeamResponse
from app.schemas.team_member import TeamMemberCreate, TeamMemberResponse


router = APIRouter(
    prefix="/teams",
    tags=["Teams"],
)


# ---------------------------------------------------------
# GET CURRENT TEAM
# ---------------------------------------------------------

@router.get(
    "/me",
    response_model=TeamResponse,
)
def get_my_team(
    request: Request,
    current_team: Team = Depends(get_current_team),
    db: Session = Depends(get_db),
):
    team = db.scalar(
        select(Team)
        .options(
            selectinload(Team.members),
            selectinload(Team.feedback),
        )
        .where(Team.id == current_team.id)
    )

    if team is None:
        return current_team

    selected_problem = None

    if team.selected_problem_id is not None:
        selected_problem = db.scalar(
            select(ProblemStatement).where(
                ProblemStatement.id == team.selected_problem_id
            )
        )

    group_photo_url = None

    if team.group_photo_path:
        group_photo_url = (
            str(request.base_url).rstrip("/")
            + "/uploads/"
            + team.group_photo_path
        )

    return {
        "id": team.id,
        "team_name": team.team_name,
        "college_name": team.college_name,
        "leader_name": team.leader_name,
        "leader_email": team.leader_email,
        "selected_problem": selected_problem,
        "group_photo_path": team.group_photo_path,
        "group_photo_url": group_photo_url,
        "repository_url": team.repository_url,
        "repository_submitted_at": team.repository_submitted_at,
        "members": team.members,
        "feedback": team.feedback,
        "created_at": team.created_at,
    }


# ---------------------------------------------------------
# TEAM MEMBERS MANAGEMENT
# ---------------------------------------------------------

@router.get(
    "/me/members",
    response_model=list[TeamMemberResponse],
)
def get_my_team_members(
    current_team: Team = Depends(get_current_team),
    db: Session = Depends(get_db),
):
    members = db.scalars(
        select(TeamMember)
        .where(TeamMember.team_id == current_team.id)
        .order_by(TeamMember.id)
    ).all()

    return members


@router.post(
    "/me/members",
    response_model=TeamMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_team_member(
    member_data: TeamMemberCreate,
    current_team: Team = Depends(get_current_team),
    db: Session = Depends(get_db),
):
    current_count = db.scalar(
        select(func.count(TeamMember.id)).where(
            TeamMember.team_id == current_team.id
        )
    ) or 0

    if current_count >= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A team cannot have more than 5 members.",
        )

    member = TeamMember(
        team_id=current_team.id,
        name=member_data.name.strip(),
        college=member_data.college.strip(),
        year=member_data.year.strip(),
        department=member_data.department.strip(),
    )

    db.add(member)
    db.commit()
    db.refresh(member)

    return member


@router.delete(
    "/me/members/{member_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_team_member(
    member_id: int,
    current_team: Team = Depends(get_current_team),
    db: Session = Depends(get_db),
):
    member = db.scalar(
        select(TeamMember).where(
            TeamMember.id == member_id,
            TeamMember.team_id == current_team.id,
        )
    )

    if member is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found.",
        )

    db.delete(member)
    db.commit()

    return None


@router.put(
    "/me/members",
    response_model=list[TeamMemberResponse],
)
def set_team_members(
    members_data: list[TeamMemberCreate],
    current_team: Team = Depends(get_current_team),
    db: Session = Depends(get_db),
):
    if len(members_data) < 4 or len(members_data) > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A team must have either 4 or 5 members.",
        )

    # Remove existing members
    existing_members = db.scalars(
        select(TeamMember).where(TeamMember.team_id == current_team.id)
    ).all()
    for existing in existing_members:
        db.delete(existing)

    db.flush()

    new_members = []
    for item in members_data:
        member = TeamMember(
            team_id=current_team.id,
            name=item.name.strip(),
            college=item.college.strip(),
            year=item.year.strip(),
            department=item.department.strip(),
        )
        db.add(member)
        new_members.append(member)

    db.commit()

    return db.scalars(
        select(TeamMember)
        .where(TeamMember.team_id == current_team.id)
        .order_by(TeamMember.id)
    ).all()


# ---------------------------------------------------------
# UPLOAD / REPLACE GROUP PHOTO
# ---------------------------------------------------------

@router.post(
    "/me/group-photo",
)
def upload_group_photo(
    photo: UploadFile = File(...),
    current_team: Team = Depends(get_current_team),
    db: Session = Depends(get_db),
):
    # Validate that a file was actually provided
    if not photo.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please select a group photo.",
        )

    # Validate image type
    if not photo.content_type or not photo.content_type.startswith(
        "image/"
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are allowed.",
        )

    # Maximum file size: 5 MB
    max_file_size = 5 * 1024 * 1024

    file_content = photo.file.read()

    if len(file_content) > max_file_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image size must be 5 MB or less.",
        )

    # Create uploads/group_photos directory
    upload_directory = (
        Path(__file__).resolve().parents[2]
        / "uploads"
        / "group_photos"
    )

    upload_directory.mkdir(
        parents=True,
        exist_ok=True,
    )

    # Get original extension
    original_extension = Path(
        photo.filename
    ).suffix.lower()

    # Fallback extension
    if not original_extension:
        original_extension = ".jpg"

    # Generate unique filename
    filename = (
        f"team_{current_team.id}_"
        f"{uuid4().hex}"
        f"{original_extension}"
    )

    file_path = upload_directory / filename

    # Save new photo
    with open(file_path, "wb") as file:
        file.write(file_content)

    # Remove old photo if one exists
    if current_team.group_photo_path:
        old_file_path = (
            Path(__file__).resolve().parents[2]
            / "uploads"
            / current_team.group_photo_path
        )

        if old_file_path.exists():
            try:
                old_file_path.unlink()
            except OSError:
                pass

    # Store relative path in database
    relative_path = (
        f"group_photos/{filename}"
    )

    current_team.group_photo_path = relative_path

    db.commit()
    db.refresh(current_team)

    return {
        "message": "Group photo uploaded successfully",
        "team_id": current_team.id,
        "group_photo_path": relative_path,
        "filename": filename,
    }