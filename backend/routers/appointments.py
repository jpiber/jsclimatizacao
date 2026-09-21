"""Appointments — criação pública + gestão restrita ao dono (Supabase/PostgreSQL)."""

import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from db_models import Appointment as AppointmentRow
from lib.dates import tomorrow_iso
from lib.emailer import notify_owner_new_appointment
from lib.whatsapp import reminder_message, wa_me_link
from models.appointment import (
    Appointment,
    AppointmentCreate,
    AppointmentStatusUpdate,
    ReminderItem,
)
from routers.auth import SessionUser, get_current_user

router = APIRouter(tags=["appointments"])


def _to_schema(row: AppointmentRow) -> Appointment:
    """Row -> modelo da API. Postgres devolve datetime aware quando a coluna é
    timestamptz, mas normalizamos por garantia (o JS precisa do offset)."""
    created = row.created_at
    if created is not None and created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    return Appointment(
        id=row.id,
        nome=row.nome,
        cpf=row.cpf,
        email=row.email,
        numero=row.numero,
        endereco=row.endereco,
        servico=row.servico,
        data=row.data,
        periodo=row.periodo,
        observacoes=row.observacoes,
        status=row.status,
        created_at=created,
    )


@router.post("/appointments", response_model=Appointment, status_code=201)
async def create_appointment(input: AppointmentCreate, db: AsyncSession = Depends(get_db)):
    row = AppointmentRow(**input.model_dump())
    db.add(row)
    await db.commit()
    appointment = _to_schema(row)
    # Aviso por e-mail em background — o agendamento nunca espera (nem falha com) o provedor.
    asyncio.create_task(
        notify_owner_new_appointment(
            nome=appointment.nome,
            servico=appointment.servico,
            data=appointment.data,
            periodo=appointment.periodo,
            endereco=appointment.endereco,
            numero=appointment.numero,
            email=appointment.email,
            appointment_id=appointment.id,
        )
    )
    return appointment


@router.get("/appointments", response_model=list[Appointment])
async def list_appointments(
    user: SessionUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(AppointmentRow).order_by(AppointmentRow.created_at.desc()).limit(1000)
    )
    return [_to_schema(row) for row in result.scalars().all()]


@router.get("/appointments/reminders", response_model=list[ReminderItem])
async def list_reminders(
    user: SessionUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """Visitas de amanhã ainda pendentes, com a mensagem de lembrete pronta — o
    painel mostra cada uma com envio em 1 clique no WhatsApp."""
    result = await db.execute(
        select(AppointmentRow)
        .where(AppointmentRow.data == tomorrow_iso(), AppointmentRow.status == "pendente")
        .order_by(AppointmentRow.created_at.desc())
    )
    items: list[ReminderItem] = []
    for row in result.scalars().all():
        message = reminder_message(row.nome, row.servico, row.data, row.periodo)
        items.append(
            ReminderItem(
                id=row.id,
                nome=row.nome,
                servico=row.servico,
                data=row.data,
                periodo=row.periodo,
                numero=row.numero,
                message=message,
                whatsapp_url=wa_me_link(row.numero, message),
                reminder_sent=bool(row.reminder_sent),
            )
        )
    return items


@router.patch("/appointments/{id}", response_model=Appointment)
async def update_appointment_status(
    id: str,
    input: AppointmentStatusUpdate,
    user: SessionUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AppointmentRow).where(AppointmentRow.id == id))
    row = result.scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    row.status = input.status
    await db.commit()
    return _to_schema(row)


@router.delete("/appointments/{id}", status_code=204)
async def delete_appointment(
    id: str,
    user: SessionUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(delete(AppointmentRow).where(AppointmentRow.id == id))
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    await db.commit()
    return None
