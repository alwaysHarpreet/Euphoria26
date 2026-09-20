from sqlalchemy import select

from app.database import SessionLocal
from app.models.problem import ProblemStatement


PROBLEMS = [
    {
        "title": "Smart Campus Management",
        "description": (
            "Build a technology-driven solution to improve campus "
            "management, student services, and operational efficiency."
        ),
    },
    {
        "title": "AI-Powered Healthcare",
        "description": (
            "Develop an AI-based solution that can improve healthcare "
            "access, diagnosis, monitoring, or patient support."
        ),
    },
    {
        "title": "Road Safety Intelligence",
        "description": (
            "Create a solution that uses technology and data to improve "
            "road safety and reduce accidents."
        ),
    },
    {
        "title": "Sustainable Cities",
        "description": (
            "Develop a solution addressing urban sustainability, "
            "resource management, pollution, or smart-city challenges."
        ),
    },
    {
        "title": "Financial Inclusion",
        "description": (
            "Build an accessible technology solution that improves "
            "financial awareness, access, or inclusion."
        ),
    },
]


def seed_problems() -> None:
    db = SessionLocal()

    try:
        for problem_data in PROBLEMS:
            existing_problem = db.scalar(
                select(ProblemStatement).where(
                    ProblemStatement.title == problem_data["title"]
                )
            )

            if existing_problem:
                continue

            problem = ProblemStatement(
                title=problem_data["title"],
                description=problem_data["description"],
                is_active=True,
            )

            db.add(problem)

        db.commit()

        print("Problem statements seeded successfully.")

        problems = db.scalars(
            select(ProblemStatement).order_by(
                ProblemStatement.id
            )
        ).all()

        for problem in problems:
            print(
                f"{problem.id}. {problem.title}"
            )

    finally:
        db.close()


if __name__ == "__main__":
    seed_problems()