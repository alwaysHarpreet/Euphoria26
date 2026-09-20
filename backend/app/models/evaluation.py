from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Evaluation(Base):
    __tablename__ = "evaluations"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'submitted')",
            name="check_evaluation_status",
        ),
        CheckConstraint(
            "score >= 0 AND score <= 100",
            name="check_evaluation_score",
        ),
        UniqueConstraint(
            "team_id",
            "round_id",
            name="uq_team_round_evaluation",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    team_id: Mapped[int] = mapped_column(
        ForeignKey("teams.id"),
        nullable=False,
    )

    evaluator_id: Mapped[int] = mapped_column(
        ForeignKey("evaluators.id"),
        nullable=False,
    )

    round_id: Mapped[int] = mapped_column(
        ForeignKey("rounds.id"),
        nullable=False,
    )

    score: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    remarks: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default="pending",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )