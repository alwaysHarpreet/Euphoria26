"""add problem statements and team selection

Revision ID: 0fae9f53f0a3
Revises: a805762cabd8
Create Date: 2026-09-17 15:41:37.395035

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0fae9f53f0a3"
down_revision: Union[str, Sequence[str], None] = "a805762cabd8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.create_table(
        "problem_statements",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column(
            "title",
            sa.String(length=200),
            nullable=False,
        ),
        sa.Column(
            "description",
            sa.Text(),
            nullable=False,
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            server_default="true",
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.add_column(
        "teams",
        sa.Column(
            "selected_problem_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.create_foreign_key(
        "fk_teams_selected_problem_id",
        "teams",
        "problem_statements",
        ["selected_problem_id"],
        ["id"],
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_constraint(
        "fk_teams_selected_problem_id",
        "teams",
        type_="foreignkey",
    )

    op.drop_column(
        "teams",
        "selected_problem_id",
    )

    op.drop_table("problem_statements")