from sqlalchemy import select

from app.database import SessionLocal
from app.models.team import Team
from app.security import hash_password


EMAIL = "leader@test.com"
NEW_PASSWORD = "Team@12345"


def reset_password():
    db = SessionLocal()

    try:
        team = db.scalar(
            select(Team).where(
                Team.leader_email == EMAIL
            )
        )

        if team is None:
            print(f"Team not found: {EMAIL}")
            return

        team.password_hash = hash_password(NEW_PASSWORD)

        db.commit()

        print(f"Password reset successfully for {EMAIL}")

    finally:
        db.close()


if __name__ == "__main__":
    reset_password()