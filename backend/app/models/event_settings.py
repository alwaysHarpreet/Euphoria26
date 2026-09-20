from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class EventSetting(Base):
    __tablename__ = "event_settings"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        default=1,
    )

    problem_release_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        server_default="not_started",
    )

    problem_release_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    repository_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="false",
    )

    feedback_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="false",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
