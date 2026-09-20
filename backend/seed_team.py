from sqlalchemy import select

from app.database import SessionLocal
from app.models.team import Team
from app.security import hash_password


TEST_PASSWORD = "Team@12345"


def seed_team() -> None:
    db = SessionLocal()

    try:
        existing_team = db.scalar(
            select(Team).where(
                Team.leader_email == "leader@test.com"
            )
        )

        if existing_team:
            print("Test team already exists.")
            return

        team = Team(
            team_name="Code Warriors",
            college_name="Test Engineering College",
            leader_name="Test Leader",
            leader_email="leader@test.com",
            password_hash=hash_password(TEST_PASSWORD),
        )

        db.add(team)
        db.commit()
        db.refresh(team)

        print("Test team created successfully.")
        print(f"Team ID: {team.id}")
        print(f"Leader Email: {team.leader_email}")
        print(f"Test Password: {TEST_PASSWORD}")

    finally:
        db.close()


if __name__ == "__main__":
    seed_team()