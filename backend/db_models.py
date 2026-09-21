"""Modelos SQLAlchemy (tabelas do Supabase).

Não confundir com `models/appointment.py`, que guarda os modelos Pydantic da
API. Aqui é o schema do banco; lá é o contrato HTTP.

Toda mudança de schema passa por Alembic — nunca `Base.metadata.create_all()`.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


def _uuid() -> str:
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Appointment(Base):
    """Agendamentos recebidos pelo site.

    `data` é String(10) no formato AAAA-MM-DD de propósito: é o mesmo formato do
    contrato da API e a ordenação lexicográfica coincide com a cronológica, então
    as comparações com `today_iso()`/`tomorrow_iso()` seguem exatas sem conversão.
    """

    __tablename__ = "appointments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    nome: Mapped[str] = mapped_column(String(120), nullable=False)
    cpf: Mapped[str] = mapped_column(String(11), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    numero: Mapped[str] = mapped_column(String(11), nullable=False)
    endereco: Mapped[str] = mapped_column(String(240), nullable=False)
    servico: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    data: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    periodo: Mapped[str | None] = mapped_column(String(40), nullable=True)
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(10), nullable=False, default="pendente", index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_utcnow, index=True
    )
    reminder_sent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    reminder_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reminder_sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
