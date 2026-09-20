from sqlalchemy import select

from app.database import SessionLocal
from app.models.evaluator import Evaluator
from app.security import hash_password


def create_evaluator():
    db = SessionLocal()

    try:
        email = "evaluator@hackoddsey.com"
        password = "Evaluator@123"

        existing_evaluator = db.scalar(
            select(Evaluator).where(
                Evaluator.email == email
            )
        )

        if existing_evaluator is not None:
            print("Evaluator already exists.")
            return

        evaluator = Evaluator(
            name="HackOddsey Evaluator",
            email=email,
            password_hash=hash_password(password),
            is_active=True,
        )

        db.add(evaluator)
        db.commit()
        db.refresh(evaluator)

        print("Evaluator created successfully.")
        print(f"ID: {evaluator.id}")
        print(f"Email: {email}")
        print(f"Password: {password}")

    finally:
        db.close()


if __name__ == "__main__":
    create_evaluator()