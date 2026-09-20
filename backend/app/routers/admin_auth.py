from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.admin import Admin
from app.routers.dependencies import get_current_admin
from app.schemas.admin import AdminLoginRequest, AdminResponse
from app.schemas.auth import TokenResponse
from app.security import create_access_token, verify_password


router = APIRouter(
    prefix="/admin",
    tags=["Admin Authentication"],
)


@router.post(
    "/login",
    response_model=TokenResponse,
)
def admin_login(
    login_data: AdminLoginRequest,
    db: Session = Depends(get_db),
):
    statement = select(Admin).where(
        Admin.email == login_data.email
    )

    admin = db.scalar(statement)

    if admin is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not admin.is_active:
        raise HTTPException(
            status_code=403,
            detail="Admin account is inactive",
        )

    if not verify_password(
        login_data.password,
        admin.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        subject=str(admin.id),
        role="admin",
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
    )


@router.get(
    "/me",
    response_model=AdminResponse,
)
def get_my_admin_profile(
    current_admin: Admin = Depends(get_current_admin),
):
    return current_admin