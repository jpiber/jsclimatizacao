# JS Climatização — app spec

## What it is
PT-BR marketing site + booking flow for "JS Climatização" (air-conditioning services).
Dark-by-default deep-navy (#0B132B) + arctic-cyan (#00B4D8) theme; fonts: Sora (headings),
DM Sans (body), JetBrains Mono (data).

- `/` — public landing: hero, 2 services (Instalação, Manutenção), how-it-works, booking form
  (id="agendar") with the user-required fields **nome, cpf, email, numero, endereco** plus
  servico / data / periodo / observacoes, contact footer. Renders fully with no backend
  (only form submit + /api/meta min-date depend on the API).
- `/login` — owner login (e-mail + senha).
- `/dashboard` — owner-only: stats (total/pendentes/atendidos/hoje), **date day-view filter**
  (Hoje / Amanhã / pick-a-date / limpar — `dataFilter` AND-combined with tabs+search),
  **reminders section** ("Lembretes para amanhã" — tomorrow's pendente visits with a
  permanent one-click pre-filled wa.me send + "Lembrete enviado" badge), filter tabs
  (Todos/Instalação/Manutenção/Pendentes/Atendidos), search by nome/cpf/numero/endereco,
  table with status toggle (pendente↔atendido), delete-with-confirm dialog, WhatsApp link
  per client. 401 → redirect to /login.

## Data model (Mongo db `app`, collection `appointments`)
`id` (uuid4 str, unique), `nome`, `cpf` (11 digits), `email`, `numero` (10–11 digits,
stored digits-only), `endereco`, `servico` ("Instalação"|"Manutenção"), `data` (YYYY-MM-DD),
`periodo` ("Manhã (08h às 12h)"|"Tarde (13h às 18h)"|"Comercial Flexível"|null),
`observacoes` (str|null), `status` ("pendente"|"atendido"), `created_at` (UTC datetime,
normalized to aware-UTC on read). Reminder fields (set by the reminder loop): `reminder_sent`
(bool), `reminder_attempts` (int), `reminder_sent_at` (datetime). Indexes: id unique,
created_at desc, data asc.

## Notifications
- **Owner email alert** — every new booking fires a background email (never blocks/fails the
  booking; capped at 10/h) to OWNER_EMAIL via the Emergent managed Resend proxy
  (`backend/lib/emailer.py`: fixed template, escaped fields, `_assert_safe_email` gate on
  every send, no links). Config: `EMERGENT_EMAIL_KEY`, `EMAIL_FROM_NAME=JS Climatização`.
- **WhatsApp reminders** (`backend/lib/whatsapp.py`) — background loop (15 min) sends a
  fixed PT-BR template to pendente clients whose `data == tomorrow_iso()` via Twilio
  WhatsApp, marking `reminder_sent` (max 3 attempts). INACTIVE until the user pastes
  TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_FROM into backend/.env — the
  user explicitly chose to keep the **manual one-click wa.me send in the dashboard
  permanently** even after Twilio is configured.

## API (all under /api, registered on api_router)
- `GET /meta` → `{today, tomorrow, empresa}` (APP_TZ=America/Sao_Paulo)
- `POST /appointments` (public, 201; triggers owner email) · `GET /appointments` (owner) ·
  `GET /appointments/reminders` (owner; tomorrow's pendente + prefilled whatsapp_url) ·
  `PATCH /appointments/{id}` `{status}` (owner) · `DELETE /appointments/{id}` (owner, 204)
- `POST /auth/login` → sets cookie · `GET /auth/me` (owner; 401 if not) · `POST /auth/logout` (204)
- Template status routes retained (`GET/POST /status`).

## Seed
`cd /app/backend && python seed.py` — idempotent; inserts 5 sample appointments
(1 hoje pendente, 2 atendidos, 2 futuros). No seed users (owner is env-based).

## Flows
1. Visitor fills form → client validation (masks CPF/phone) → `POST /appointments` →
   success card + toast + owner email alert. Invalid payload → 422 `{detail:[...]}`.
2. Owner: `/login` → `POST /auth/login` → cookie → `/dashboard` (session via `GET /auth/me`,
   query key `["session"]`). Toggle/delete invalidate `["appointments"]` + `["reminders"]`.
   Sign-out goes through `endSession()` (clears cookie + react-query cache).
3. Date day-view: Hoje/Amanhã buttons or the date input set `dateFilter`; table shows only
   that day ("Exibindo agendamentos de dd/mm/aaaa (n)").

## Known intentional behaviors
- Visiting `/dashboard` logged out fires one 401 on `/api/auth/me` (expected; redirects to /login).
- WhatsApp auto-send is OFF (no Twilio creds yet) by user choice; manual quick-send is permanent.
- Site contact info (phone/WhatsApp/endereço) is placeholder copy — user hasn't provided real ones.
