// Hand-written mirrors of the backend Pydantic models — nothing infers across the
// Python boundary, so keep these in sync with backend/models + routers in one edit.

export type AppointmentStatus = "pendente" | "atendido";

export const SERVICOS = ["Instalação", "Manutenção"] as const;
export type Servico = (typeof SERVICOS)[number];

export const PERIODOS = [
  "Manhã (08h às 12h)",
  "Tarde (13h às 18h)",
  "Comercial Flexível",
] as const;
export type Periodo = (typeof PERIODOS)[number];

// Mirror of backend/models/appointment.py::Appointment
export interface Appointment {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  numero: string;
  endereco: string;
  servico: string;
  data: string;
  periodo: string | null;
  observacoes: string | null;
  status: AppointmentStatus;
  created_at: string;
}

// Body of POST /appointments — mirrors AppointmentCreate
export interface AppointmentCreate {
  nome: string;
  cpf: string;
  email: string;
  numero: string;
  endereco: string;
  servico: string;
  data: string;
  periodo: string | null;
  observacoes: string | null;
}

// Mirror of backend/routers/auth.py::SessionUser
export interface SessionUser {
  email: string;
}

// Body of POST /auth/login — mirrors LoginRequest
export interface LoginRequest {
  email: string;
  password: string;
}

// Mirror of GET /api/meta
export interface SiteMeta {
  today: string;
  tomorrow: string;
  empresa: string;
}

// Mirror of backend/models/appointment.py::ReminderItem (GET /appointments/reminders)
export interface ReminderItem {
  id: string;
  nome: string;
  servico: string;
  data: string;
  periodo: string | null;
  numero: string;
  whatsapp_url: string;
  message: string;
  reminder_sent: boolean;
}
