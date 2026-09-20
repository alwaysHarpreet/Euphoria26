"""add team codes and roster details
Revision ID: 247635722133
Revises: 7f4c8b2d91a6
Create Date: 2026-09-20
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "247635722133"
down_revision: Union[str, Sequence[str], None] = "7f4c8b2d91a6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # ---------------------------------------------------------
    # Teams: add public/team-provided identifier
    # ---------------------------------------------------------

    op.add_column(
        "teams",
        sa.Column(
            "team_code",
            sa.String(length=100),
            nullable=True,
        ),
    )

    op.execute(
        "UPDATE teams SET team_code = 'TEAM-' || id::text "
        "WHERE team_code IS NULL"
    )

    op.alter_column(
        "teams",
        "team_code",
        existing_type=sa.String(length=100),
        nullable=False,
    )

    op.create_index(
        op.f("ix_teams_team_code"),
        "teams",
        ["team_code"],
        unique=True,
    )

    # ---------------------------------------------------------
    # Team members: add CSV roster fields
    # ---------------------------------------------------------

    op.add_column(
        "team_members",
        sa.Column(
            "registration_number",
            sa.String(length=100),
            nullable=True,
        ),
    )

    op.add_column(
        "team_members",
        sa.Column(
            "email",
            sa.String(length=255),
            nullable=True,
        ),
    )

    op.add_column(
        "team_members",
        sa.Column(
            "role",
            sa.String(length=50),
            nullable=True,
        ),
    )

    # Department is not part of the CSV schema.
    op.alter_column(
        "team_members",
        "department",
        existing_type=sa.String(length=100),
        nullable=True,
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.alter_column(
        "team_members",
        "department",
        existing_type=sa.String(length=100),
        nullable=False,
    )

    op.drop_column(
        "team_members",
        "role",
    )

    op.drop_column(
        "team_members",
        "email",
    )

    op.drop_column(
        "team_members",
        "registration_number",
    )

    op.drop_index(
        op.f("ix_teams_team_code"),
        table_name="teams",
    )

    op.drop_column(
        "teams",
        "team_code",
    )