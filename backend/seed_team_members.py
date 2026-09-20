from sqlalchemy import select

from app.database import SessionLocal
from app.models.team import Team
from app.models.team_member import TeamMember

SAMPLE_MEMBERS_TEMPLATES = [
    [
        {
            "name": "Aarav Sharma",
            "college": "Institute of Engineering & Technology",
            "year": "3rd Year",
            "department": "Computer Science & Engineering",
        },
        {
            "name": "Priya Patel",
            "college": "National Institute of Technology",
            "year": "3rd Year",
            "department": "Information Technology",
        },
        {
            "name": "Rohan Gupta",
            "college": "Institute of Engineering & Technology",
            "year": "2nd Year",
            "department": "Data Science",
        },
        {
            "name": "Ananya Singh",
            "college": "Delhi Technological University",
            "year": "4th Year",
            "department": "Electronics & Communication",
        },
    ],
    [
        {
            "name": "Vikram Malhotra",
            "college": "Birla Institute of Technology",
            "year": "4th Year",
            "department": "Computer Science",
        },
        {
            "name": "Sneha Reddy",
            "college": "Vellore Institute of Technology",
            "year": "3rd Year",
            "department": "Software Engineering",
        },
        {
            "name": "Karan Verma",
            "college": "Birla Institute of Technology",
            "year": "3rd Year",
            "department": "Artificial Intelligence",
        },
        {
            "name": "Meera Nair",
            "college": "National Institute of Design",
            "year": "2nd Year",
            "department": "UI/UX Design",
        },
        {
            "name": "Devansh Joshi",
            "college": "Birla Institute of Technology",
            "year": "4th Year",
            "department": "Cybersecurity",
        },
    ],
]


def seed_team_members() -> None:
    db = SessionLocal()

    try:
        teams = db.scalars(select(Team).order_by(Team.id)).all()

        for index, team in enumerate(teams):
            existing_count = db.scalar(
                select(TeamMember).where(TeamMember.team_id == team.id)
            )

            if existing_count:
                print(f"Team {team.id} ({team.team_name}) already has members.")
                continue

            template = SAMPLE_MEMBERS_TEMPLATES[index % len(SAMPLE_MEMBERS_TEMPLATES)]

            for member_data in template:
                member = TeamMember(
                    team_id=team.id,
                    name=member_data["name"],
                    college=member_data["college"],
                    year=member_data["year"],
                    department=member_data["department"],
                )
                db.add(member)

            print(f"Seeded {len(template)} members for Team {team.id} ({team.team_name}).")

        db.commit()
        print("Team members seeded successfully.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_team_members()
