"""add suggestions table

Revision ID: 003
Revises: 002
Create Date: 2026-04-26

"""
from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "suggestions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("meal_name", sa.String(), nullable=False),
        sa.Column("ingredients", sa.JSON(), nullable=False),
        sa.Column("prep_time", sa.Integer(), nullable=False),
        sa.Column("servings", sa.Integer(), nullable=False),
        sa.Column("macros", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ),
        sa.PrimaryKeyConstraint("id"),
        sa.Index("ix_suggestions_id", "id"),
        sa.Index("ix_suggestions_user_id", "user_id"),
    )


def downgrade() -> None:
    op.drop_table("suggestions")
