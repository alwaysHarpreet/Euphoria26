"""add requirements and expectations to problem statements

Revision ID: 7f4c8b2d91a6
Revises: 5a08a9a35460
Create Date: 2026-09-20 19:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7f4c8b2d91a6"
down_revision: Union[str, Sequence[str], None] = "5a08a9a35460"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "problem_statements",
        sa.Column(
            "requirements",
            sa.Text(),
            nullable=True,
        ),
    )

    op.add_column(
        "problem_statements",
        sa.Column(
            "expectations",
            sa.Text(),
            nullable=True,
        ),
    )

    op.execute(
        """
        UPDATE problem_statements
        SET requirements = '',
            expectations = ''
        WHERE requirements IS NULL
           OR expectations IS NULL
        """
    )

    op.alter_column(
        "problem_statements",
        "requirements",
        nullable=False,
    )

    op.alter_column(
        "problem_statements",
        "expectations",
        nullable=False,
    )


def downgrade() -> None:
    op.drop_column(
        "problem_statements",
        "expectations",
    )

    op.drop_column(
        "problem_statements",
        "requirements",
    )