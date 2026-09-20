from sqlalchemy import select

from app.database import SessionLocal
from app.models.admin import Admin
from app.security import hash_password


ADMIN_NAME = "HackOddsey Admin"
ADMIN_EMAIL = "admin@hackoddsey.com"
ADMIN_PASSWORD = "Admin@123"


def seed_admin():
    db = SessionLocal()

    try:
        existing_admin = db.scalar(
            select(Admin).where(
                Admin.email == ADMIN_EMAIL
            )
        )

        if existing_admin:
            print("Admin already exists.")
            return

        admin = Admin(
            name=ADMIN_NAME,
            email=ADMIN_EMAIL,
            password_hash=hash_password(ADMIN_PASSWORD),
            is_active=True,
        )

        db.add(admin)
        db.commit()

        print("Admin created successfully.")
        print(f"Email: {ADMIN_EMAIL}")
        print(f"Password: {ADMIN_PASSWORD}")

    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()