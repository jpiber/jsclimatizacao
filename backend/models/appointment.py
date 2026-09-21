"""Appointment models — the public booking boundary. Every field here has a hand-written
TS mirror in frontend/src/lib/types.ts; keep the two in sync in the same edit."""

import re
import uuid
from datetime import date, datetime, timezone

from pydantic import BaseModel, EmailStr, Field, field_validator

SERVICOS = ("Instalação", "Manutenção")
PERIODOS = ("Manhã (08h às 12h)", "Tarde (13h às 18h)", "Comercial Flexível")
STATUS = ("pendente", "atendido")


def _digits(value: str) -> str:
    return re.sub(r"\D", "", value)


class AppointmentCreate(BaseModel):
    nome: str = Field(min_length=3, max_length=120)
    cpf: str = Field(min_length=11, max_length=14)
    email: EmailStr
    numero: str = Field(min_length=8, max_length=20)
    endereco: str = Field(min_length=5, max_length=240)
    servico: str
    data: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    periodo: str | None = None
    observacoes: str | None = Field(default=None, max_length=500)

    @field_validator("cpf")
    @classmethod
    def validate_cpf(cls, v: str) -> str:
        digits = _digits(v)
        if len(digits) != 11:
            raise ValueError("CPF deve ter 11 dígitos")
        if digits == digits[0] * 11:
            raise ValueError("CPF inválido")
        return digits

    @field_validator("numero")
    @classmethod
    def validate_numero(cls, v: str) -> str:
        digits = _digits(v)
        if not 10 <= len(digits) <= 11:
            raise ValueError("Telefone deve ter DDD + número (10 ou 11 dígitos)")
        return digits

    @field_validator("servico")
    @classmethod
    def validate_servico(cls, v: str) -> str:
        if v not in SERVICOS:
            raise ValueError("Serviço deve ser Instalação ou Manutenção")
        return v

    @field_validator("periodo")
    @classmethod
    def validate_periodo(cls, v: str | None) -> str | None:
        if v is not None and v not in PERIODOS:
            raise ValueError("Período inválido")
        return v

    @field_validator("data")
    @classmethod
    def validate_data(cls, v: str) -> str:
        try:
            date.fromisoformat(v)
        except ValueError:
            raise ValueError("Data inválida (use AAAA-MM-DD)")
        return v


class Appointment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nome: str
    cpf: str
    email: str
    numero: str
    endereco: str
    servico: str
    data: str
    periodo: str | None = None
    observacoes: str | None = None
    status: str = "pendente"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AppointmentStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in STATUS:
            raise ValueError("Status deve ser 'pendente' ou 'atendido'")
        return v
