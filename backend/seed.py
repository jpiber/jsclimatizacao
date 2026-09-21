"""Dados de exemplo — agora no Supabase (PostgreSQL). Idempotente.

Uso: cd /app/backend && python seed.py
"""

import asyncio
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select

from database import AsyncSessionLocal, engine
from db_models import Appointment as AppointmentRow
from lib.dates import today_iso

TODAY = today_iso()


def _iso_in(days: int) -> str:
    return (date.fromisoformat(TODAY) + timedelta(days=days)).isoformat()


SAMPLES = [
    {
        "id": "b3f2c9a4-1d5e-4c8a-9f6b-2e7d4a1c3b90",
        "nome": "Mariana Oliveira Souza",
        "cpf": "52998224725",
        "email": "mariana.souza@email.com",
        "numero": "11997654321",
        "endereco": "Rua das Acácias, 245, Jardim Paulista, São Paulo - SP",
        "servico": "Instalação",
        "data": TODAY,
        "periodo": "Manhã (08h às 12h)",
        "observacoes": "Split Hi-Wall 9.000 BTUs na sala, apartamento no 2º andar.",
        "status": "pendente",
    },
    {
        "id": "8a6d1f3e-2b7c-4e5a-b9d8-1c4f6a2e3d71",
        "nome": "Carlos Eduardo Pereira",
        "cpf": "16899535009",
        "email": "carlos.pereira@email.com",
        "numero": "11987651234",
        "endereco": "Av. Brasil, 1180, apto 73, Santana, São Paulo - SP",
        "servico": "Manutenção",
        "data": _iso_in(2),
        "periodo": "Tarde (13h às 18h)",
        "observacoes": "Ar 12.000 BTUs gelando pouco, suspeita de falta de gás.",
        "status": "pendente",
    },
    {
        "id": "5c9b2e7a-3f1d-4b6c-a8e5-9d2c1f4b7a32",
        "nome": "Fernanda Ribeiro Lima",
        "cpf": "39053344705",
        "email": "fernanda.lima@email.com",
        "numero": "11996547890",
        "endereco": "Rua Domingos de Morais, 92, Vila Mariana, São Paulo - SP",
        "servico": "Manutenção",
        "data": _iso_in(-1),
        "periodo": "Manhã (08h às 12h)",
        "observacoes": "Higienização completa de 2 aparelhos (sala e quarto).",
        "status": "atendido",
    },
    {
        "id": "7e4a8c1b-6d3f-4a9e-b2c7-4f8d3a5e6c13",
        "nome": "Rodrigo Mendes Alves",
        "cpf": "12345678909",
        "email": "rodrigo.alves@email.com",
        "numero": "11988776655",
        "endereco": "Alameda dos Ipês, 540, casa 2, Alphaville, Barueri - SP",
        "servico": "Instalação",
        "data": _iso_in(5),
        "periodo": "Comercial Flexível",
        "observacoes": "Cassete 18.000 BTUs para sala comercial, teto rebaixado.",
        "status": "pendente",
    },
    {
        "id": "2d7f3a9c-4b8e-4c1d-a5f6-8e1b9c2d4f74",
        "nome": "Juliana Castro Martins",
        "cpf": "11144477735",
        "email": "juliana.martins@email.com",
        "numero": "11997332211",
        "endereco": "Rua Cardeal Arcoverde, 1610, Pinheiros, São Paulo - SP",
        "servico": "Instalação",
        "data": _iso_in(-3),
        "periodo": "Tarde (13h às 18h)",
        "observacoes": "Instalação padrão com tubulação exposta, 2º andar.",
        "status": "atendido",
    },
]


async def main() -> None:
    async with AsyncSessionLocal() as session:
        existing = (await session.execute(select(func.count(AppointmentRow.id)))).scalar() or 0
        if existing > 0:
            print(f"seed: {existing} agendamentos já existem — nada a fazer")
            await engine.dispose()
            return

        now = datetime.now(timezone.utc)
        for i, sample in enumerate(SAMPLES):
            session.add(AppointmentRow(**sample, created_at=now - timedelta(hours=6 * i)))
        await session.commit()

    print(f"seed: {len(SAMPLES)} agendamentos de exemplo inseridos")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
