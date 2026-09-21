"""Supabase (PostgreSQL) — engine e sessão assíncrona compartilhados.

Importe `AsyncSessionLocal` (loops de background/scripts) ou a dependência
`get_db` (rotas FastAPI) daqui. Nunca crie outro engine.

A conexão usa o Transaction Pooler do Supabase (porta 6543), que NÃO suporta
prepared statements — daí `statement_cache_size=0`.
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

load_dotenv(Path(__file__).parent / ".env")

DATABASE_URL = os.environ["DATABASE_URL"]
ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(
    ASYNC_DATABASE_URL,
    pool_size=10,
    max_overflow=5,
    pool_timeout=30,
    pool_recycle=1800,
    pool_pre_ping=False,
    echo=False,
    connect_args={
        "statement_cache_size": 0,  # obrigatório com o transaction pooler
        "command_timeout": 30,
    },
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db():
    """Dependência FastAPI: uma sessão por requisição."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
