from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.feedback import TeamFeedback
    from app.models.team_member import TeamMember


class Team(Base):
    __tablename__ = "teams"

    id: Mapped[int] = mapped_column(primary_key=True)

    team_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    college_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    leader_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    leader_email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    selected_problem_id: Mapped[int | None] = mapped_column(
        ForeignKey("problem_statements.id"),
        nullable=True,
    )

    group_photo_path: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    repository_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    repository_submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    members: Mapped[list["TeamMember"]] = relationship(
        "TeamMember",
        cascade="all, delete-orphan",
        order_by="TeamMember.id",
    )

    feedback: Mapped["TeamFeedback | None"] = relationship(
        "TeamFeedback",
        uselist=False,
        cascade="all, delete-orphan",
    )