"""Appointments — public booking creation + owner-only management."""

import asyncio
from datetime import timezone

from fastapi import APIRouter, Depends, HTTPException
from pymongo import DESCENDING

from lib.db import db
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


def _normalize(doc: dict) -> dict:
    """Motor returns naive datetimes — re-anchor them to UTC so Pydantic serialises
    with the offset and `new Date(...)` parses correctly in the browser."""
    created = doc.get("created_at")
    if created and created.tzinfo is None:
        doc["created_at"] = created.replace(tzinfo=timezone.utc)
    return doc


@router.post("/appointments", response_model=Appointment, status_code=201)
async def create_appointment(input: AppointmentCreate):
    appointment = Appointment(**input.model_dump())
    _ = await db.appointments.insert_one(appointment.model_dump())
    # Owner email alert rides in the background — booking never waits on (or fails
    # with) the email provider.
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
async def list_appointments(user: SessionUser = Depends(get_current_user)):
    docs = await db.appointments.find().sort("created_at", DESCENDING).to_list(1000)
    return [Appointment(**_normalize(doc)) for doc in docs]


@router.get("/appointments/reminders", response_model=list[ReminderItem])
async def list_reminders(user: SessionUser = Depends(get_current_user)):
    """Tomorrow's pendente visits with the reminder message pre-built — the
    dashboard shows them with a one-click wa.me send (and the Twilio loop marks
    reminder_sent when it fires automatically)."""
    docs = (
        await db.appointments.find({"data": tomorrow_iso(), "status": "pendente"})
        .sort("created_at", DESCENDING)
        .to_list(1000)
    )
    items: list[ReminderItem] = []
    for doc in docs:
        message = reminder_message(doc["nome"], doc["servico"], doc["data"], doc.get("periodo"))
        items.append(
            ReminderItem(
                id=doc["id"],
                nome=doc["nome"],
                servico=doc["servico"],
                data=doc["data"],
                periodo=doc.get("periodo"),
                numero=doc["numero"],
                message=message,
                whatsapp_url=wa_me_link(doc["numero"], message),
                reminder_sent=bool(doc.get("reminder_sent")),
            )
        )
    return items


@router.patch("/appointments/{id}", response_model=Appointment)
async def update_appointment_status(
    id: str,
    input: AppointmentStatusUpdate,
    user: SessionUser = Depends(get_current_user),
):
    result = await db.appointments.update_one({"id": id}, {"$set": {"status": input.status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    doc = await db.appointments.find_one({"id": id})
    return Appointment(**_normalize(doc))


@router.delete("/appointments/{id}", status_code=204)
async def delete_appointment(id: str, user: SessionUser = Depends(get_current_user)):
    result = await db.appointments.delete_one({"id": id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    return None
