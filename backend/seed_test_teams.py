from sqlalchemy import select

from app.database import SessionLocal
from app.models.team import Team


TEST_TEAMS = [
    {
        "team_name": "AI Avengers",
        "college_name": "Test Engineering College",
        "leader_name": "Test Leader 2",
        "leader_email": "leader2@test.com",
    },
    {
        "team_name": "Binary Builders",
        "college_name": "Test Engineering College",
        "leader_name": "Test Leader 3",
        "leader_email": "leader3@test.com",
    },
    {
        "team_name": "Fourth Test Team",
        "college_name": "Test Engineering College",
        "leader_name": "Test Leader 4",
        "leader_email": "leader4@test.com",
    },
]


def seed_test_teams() -> None:
    db = SessionLocal()

    try:
        # Get the existing team's password hash.
        # This is only for development/testing.
        existing_team = db.scalar(
            select(Team)
            .where(Team.leader_email == "leader@test.com")
        )

        if existing_team is None:
            print(
                "Existing test team leader@test.com was not found."
            )
            return

        for team_data in TEST_TEAMS:
            existing_test_team = db.scalar(
                select(Team).where(
                    Team.leader_email == team_data["leader_email"]
                )
            )

            if existing_test_team:
                print(
                    f"Already exists: {team_data['leader_email']}"
                )
                continue

            team = Team(
                team_name=team_data["team_name"],
                college_name=team_data["college_name"],
                leader_name=team_data["leader_name"],
                leader_email=team_data["leader_email"],
                password_hash=existing_team.password_hash,
            )

            db.add(team)

        db.commit()

        print("\nTest teams:")
        
        teams = db.scalars(
            select(Team)
            .order_by(Team.id)
        ).all()

        for team in teams:
            print(
                f"{team.id} | "
                f"{team.team_name} | "
                f"{team.leader_email} | "
                f"selected_problem={team.selected_problem_id}"
            )

    finally:
        db.close()


if __name__ == "__main__":
    seed_test_teams()