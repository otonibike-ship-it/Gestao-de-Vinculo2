"""add observacoes_financeiro to vinculos

Revision ID: 0007
Revises: 0006
Create Date: 2026-07-30
"""
from alembic import op
import sqlalchemy as sa

revision = '0007'
down_revision = '0006'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('vinculos', sa.Column('observacoes_financeiro', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('vinculos', 'observacoes_financeiro')
