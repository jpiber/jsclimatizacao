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
- `/dashboard` — owner-only: stats (total/pendentes/atendidos/hoje), filter tabs
  (Todos/Instalação/Manutenção/Pendentes/Atendidos), search by nome/cpf/numero/endereco,
  table with status toggle (pendente↔atendido), delete-with-confirm dialog, WhatsApp link
  per appointment. 401 → redirect to /login.

## Data model (Mongo db `app`, collection `appointments`)
`id` (uuid4 str, unique), `nome`, `cpf` (11 digits), `email`, `numero` (10–11 digits,
stored digits-only), `endereco`, `servico` ("Instalação"|"Manutenção"), `data` (YYYY-MM-DD),
`periodo` ("Manhã (08h às 12h)"|"Tarde (13h às 18h)"|"Comercial Flexível"|null),
`observacoes` (str|null), `status` ("pendente"|"atendido"), `created_at` (UTC datetime,
normalized to aware-UTC on read). Indexes: id unique, created_at desc, data asc.

Owner auth: single owner from env (OWNER_EMAIL / OWNER_PASSWORD in backend/.env);
JWT (HS256, SESSION_SECRET) in httpOnly cookie `js_session`, 7-day TTL. No users collection.

## API (all under /api, registered on api_router)
- `GET /meta` → `{today, empresa}` (today anchored to APP_TZ=America/Sao_Paulo)
- `POST /appointments` (public, 201) · `GET /appointments` (owner) ·
  `PATCH /appointments/{id}` `{status}` (owner) · `DELETE /appointments/{id}` (owner, 204)
- `POST /auth/login` → sets cookie · `GET /auth/me` (owner; 401 if not) · `POST /auth/logout` (204)
- Template status routes retained (`GET/POST /status`).

## Seed
`cd /app/backend && python seed.py` — idempotent; inserts 5 sample appointments
(1 hoje pendente, 2 atendidos, 2 futuros). No seed users (owner is env-based).

## Flows
1. Visitor fills form → client validation (masks CPF/phone) → `POST /appointments` →
   success card + toast. Invalid payload → 422 with `{detail:[...]}`.
2. Owner: `/login` → `POST /auth/login` → cookie set → `/dashboard` (session via
   `GET /auth/me`, query key `["session"]`). Toggle/delete invalidate `["appointments"]`.
   Sign-out goes through `endSession()` (clears cookie + react-query cache).

## Known intentional behaviors
- Visiting `/dashboard` logged out fires one 401 on `/api/auth/me` (expected; redirects to /login).
- The 401 is the only "failed" request a logged-out dashboard visit produces.
