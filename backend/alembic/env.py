"""Alembic environment — JS Climatização (Supabase/PostgreSQL).

A URL vem de backend/.env (DATABASE_URL). O Alembic roda de forma síncrona, por
isso usamos a URL SEM `+asyncpg` (o driver async é só do runtime, em database.py).
"""

import os
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import create_engine, pool

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(BACKEND_DIR / ".env")

from db_models import Base  # noqa: E402

config = context.config

# URL síncrona (psycopg2). Não passa pelo alembic.ini de propósito: o
# configparser trata "%" como interpolação e a senha vem percent-encoded (%40).
sync_url = os.environ["DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://")

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=sync_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(sync_url, poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
