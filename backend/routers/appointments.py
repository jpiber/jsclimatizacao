"""Appointments — public booking creation + owner-only management."""

from datetime import timezone

from fastapi import APIRouter, Depends, HTTPException
from pymongo import DESCENDING

from lib.db import db
from models.appointment import Appointment, AppointmentCreate, AppointmentStatusUpdate
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
    return appointment


@router.get("/appointments", response_model=list[Appointment])
async def list_appointments(user: SessionUser = Depends(get_current_user)):
    docs = await db.appointments.find().sort("created_at", DESCENDING).to_list(1000)
    return [Appointment(**_normalize(doc)) for doc in docs]


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
