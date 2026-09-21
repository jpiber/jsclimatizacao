"""Copia os agendamentos do MongoDB local para o Supabase (PostgreSQL).

Idempotente: registros cujo `id` já exista no Supabase são ignorados, então pode
rodar de novo sem duplicar.

Uso: cd /app/backend && python scripts/migrate_mongo_to_supabase.py
"""

import asyncio
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select  # noqa: E402

from database import AsyncSessionLocal, engine  # noqa: E402
from db_models import Appointment as AppointmentRow  # noqa: E402
from lib.db import db as mongo_db  # noqa: E402

FIELDS = (
    "nome", "cpf", "email", "numero", "endereco",
    "servico", "data", "periodo", "observacoes", "status",
)


def _aware(value) -> datetime:
    if not isinstance(value, datetime):
        return datetime.now(timezone.utc)
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


async def main() -> None:
    docs = await mongo_db.appointments.find().to_list(5000)
    print(f"MongoDB: {len(docs)} agendamento(s) encontrado(s)")
    if not docs:
        print("nada a migrar")
        await engine.dispose()
        return

    inserted = skipped = 0
    async with AsyncSessionLocal() as session:
        existing = set(
            (await session.execute(select(AppointmentRow.id))).scalars().all()
        )
        for doc in docs:
            doc_id = doc.get("id")
            if not doc_id or doc_id in existing:
                skipped += 1
                continue
            session.add(
                AppointmentRow(
                    id=doc_id,
                    **{f: doc.get(f) for f in FIELDS},
                    created_at=_aware(doc.get("created_at")),
                    reminder_sent=bool(doc.get("reminder_sent", False)),
                    reminder_attempts=int(doc.get("reminder_attempts", 0) or 0),
                    reminder_sent_at=(
                        _aware(doc["reminder_sent_at"]) if doc.get("reminder_sent_at") else None
                    ),
                )
            )
            inserted += 1
        await session.commit()

        total = len((await session.execute(select(AppointmentRow.id))).scalars().all())

    print(f"Supabase: {inserted} inserido(s), {skipped} já existia(m) — total agora: {total}")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
