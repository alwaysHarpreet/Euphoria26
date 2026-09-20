from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.team import Team
from app.routers.dependencies import get_current_team


router = APIRouter(
    prefix="/teams/me",
    tags=["Team Group Photo"],
)


BASE_DIR = Path(__file__).resolve().parents[2]
UPLOAD_DIR = BASE_DIR / "uploads" / "group_photos"

ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def is_valid_image_header(content: bytes, content_type: str) -> bool:
    if content_type == "image/jpeg":
        return content.startswith(b"\xff\xd8\xff")

    if content_type == "image/png":
        return content.startswith(b"\x89PNG\r\n\x1a\n")

    if content_type == "image/webp":
        return (
            content.startswith(b"RIFF")
            and content[8:12] == b"WEBP"
        )

    return False


@router.post("/group-photo")
async def upload_group_photo(
    photo: UploadFile = File(...),
    current_team: Team = Depends(get_current_team),
    db: Session = Depends(get_db),
):
    # ---------------------------------------------------------
    # 1. Make sure the team has selected a problem
    # ---------------------------------------------------------

    if current_team.selected_problem_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Select a problem statement before uploading the group photo",
        )

    # ---------------------------------------------------------
    # 2. Validate file type
    # ---------------------------------------------------------

    if photo.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, PNG, and WEBP images are allowed",
        )

    # ---------------------------------------------------------
    # 3. Read file
    # ---------------------------------------------------------

    file_data = await photo.read()

    if not file_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty",
        )

    # ---------------------------------------------------------
    # 4. Validate file size
    # ---------------------------------------------------------

    if len(file_data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Group photo must be 5 MB or smaller",
        )

    # ---------------------------------------------------------
    # 5. Validate actual image signature
    # ---------------------------------------------------------

    if not is_valid_image_header(
        file_data,
        photo.content_type,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image file",
        )

    # ---------------------------------------------------------
    # 6. Reload team from database
    # ---------------------------------------------------------

    team = db.scalar(
        select(Team)
        .where(Team.id == current_team.id)
    )

    if team is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Team not found",
        )

    # ---------------------------------------------------------
    # 7. Create upload directory if necessary
    # ---------------------------------------------------------

    UPLOAD_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    # ---------------------------------------------------------
    # 8. Generate unique filename
    # ---------------------------------------------------------

    extension = ALLOWED_CONTENT_TYPES[photo.content_type]

    filename = f"team_{team.id}_{uuid4().hex}{extension}"

    file_path = UPLOAD_DIR / filename

    # ---------------------------------------------------------
    # 9. Save new photo
    # ---------------------------------------------------------

    try:
        file_path.write_bytes(file_data)
    except OSError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save group photo",
        )

    # ---------------------------------------------------------
    # 10. Remember previous photo
    # ---------------------------------------------------------

    old_photo_path = team.group_photo_path

    # ---------------------------------------------------------
    # 11. Update database
    # ---------------------------------------------------------

    relative_path = f"group_photos/{filename}"

    team.group_photo_path = relative_path

    try:
        db.commit()
        db.refresh(team)
    except Exception:
        db.rollback()

        # Remove newly uploaded file if database update fails
        try:
            file_path.unlink(missing_ok=True)
        except OSError:
            pass

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update team photo",
        )

    # ---------------------------------------------------------
    # 12. Delete previous photo after successful DB update
    # ---------------------------------------------------------

    if old_photo_path:
        old_file_path = UPLOAD_DIR.parent / old_photo_path

        try:
            old_file_path.unlink(missing_ok=True)
        except OSError:
            pass

    # ---------------------------------------------------------
    # 13. Return current photo
    # ---------------------------------------------------------

    return {
        "message": "Group photo uploaded successfully",
        "team_id": team.id,
        "group_photo_path": team.group_photo_path,
        "filename": filename,
    }