# JS Climatização

Site institucional com **agendamento online** de instalação e manutenção de
ar-condicionado, mais uma **área privada do dono** para acompanhar e gerenciar os
agendamentos recebidos.

- **Stack**: FastAPI + MongoDB (backend) · Vite + React 19 + TypeScript + Tailwind v4 (frontend)
- **Idioma**: interface e conteúdo em PT-BR

## Funcionalidades

**Site público (`/`)**
- Apresentação da empresa, serviços (Instalação e Manutenção & Higienização) e como funciona
- Formulário de agendamento com os campos **nome, CPF, e-mail, número, endereço**,
  além de serviço, data preferencial, período e observações
- Máscaras de CPF e telefone, validação no cliente e no servidor, confirmação por toast
- Telefone/e-mail clicáveis, atalho de WhatsApp, menu mobile e página 404 própria

**Área do dono**
- `/login` — acesso por e-mail e senha (sessão em cookie httpOnly)
- `/dashboard` — indicadores (total, pendentes, atendidos, hoje), filtro por dia
  (Hoje / Amanhã / data escolhida), filtros por serviço e status, busca por nome,
  CPF, telefone ou endereço, marcar como atendido, excluir com confirmação e
  atalho de WhatsApp por cliente
- Seção "Lembretes para amanhã": visitas do dia seguinte com mensagem pronta para
  envio em 1 clique no WhatsApp

**Notificações**
- E-mail de aviso ao dono a cada novo agendamento (envio em background, nunca
  bloqueia o formulário)
- Lembrete automático de WhatsApp na véspera da visita — fica inativo até que as
  credenciais do Twilio sejam preenchidas; o envio manual do painel continua
  disponível de qualquer forma

## Rodando localmente

Pré-requisitos: Python 3.11+, Node 20+, MongoDB em execução.

```bash
# 1. Configuração
cp backend/.env.example backend/.env    # preencha os valores

# 2. Backend (http://localhost:8001)
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# 3. Frontend (http://localhost:3000)
cd frontend
yarn install
yarn dev
```

O frontend chama sempre caminhos relativos `/api/...`, que o Vite encaminha para
o backend na porta 8001 — não há URL de backend fixa no código.

### Dados de exemplo

```bash
cd backend && python seed.py   # insere 5 agendamentos de exemplo (idempotente)
```

## Variáveis de ambiente

Todas ficam em `backend/.env` (veja `backend/.env.example`). O arquivo `.env`
está no `.gitignore` e **nunca** deve ser enviado ao repositório.

| Variável | Descrição |
|---|---|
| `MONGO_URL`, `DB_NAME` | conexão com o MongoDB |
| `CORS_ORIGINS`, `APP_URL`, `APP_TZ` | origens permitidas, URL pública e fuso (datas do servidor) |
| `OWNER_EMAIL`, `OWNER_PASSWORD` | login do painel do dono |
| `SESSION_SECRET` | assinatura do cookie de sessão (use um valor aleatório e único) |
| `EMERGENT_EMAIL_KEY`, `EMAIL_FROM_NAME` | envio do e-mail de aviso de novo agendamento |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` | opcional: liga o lembrete automático de WhatsApp |

## API

Todas as rotas ficam sob o prefixo `/api`.

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/api/meta` | público | data de hoje/amanhã no fuso do servidor |
| `POST` | `/api/appointments` | público | cria um agendamento (dispara o e-mail ao dono) |
| `GET` | `/api/appointments` | dono | lista todos os agendamentos |
| `GET` | `/api/appointments/reminders` | dono | visitas de amanhã com a mensagem de lembrete pronta |
| `PATCH` | `/api/appointments/{id}` | dono | altera o status (`pendente` / `atendido`) |
| `DELETE` | `/api/appointments/{id}` | dono | exclui o agendamento |
| `POST` | `/api/auth/login` | público | autentica e define o cookie de sessão |
| `GET` | `/api/auth/me` | dono | identifica a sessão atual |
| `POST` | `/api/auth/logout` | dono | encerra a sessão |

## Estrutura

```
backend/
  server.py              app FastAPI, monta os routers sob /api
  routers/               appointments.py, auth.py
  models/appointment.py  modelos Pydantic (validação de CPF, telefone, serviço)
  lib/                   db.py, dates.py, emailer.py, whatsapp.py
  seed.py                dados de exemplo
frontend/src/
  pages/                 Home, Login, Dashboard, NotFound
  components/            SiteHeader, BookingForm, ui/ (shadcn)
  lib/                   api.ts (fetch tipado), types.ts, format.ts, session.ts
```

## Segurança

- Sessão em cookie **httpOnly** assinado com JWT; nenhum token é guardado no navegador
- Senhas e chaves apenas em `backend/.env`, lidas via `os.environ`
- Antes de publicar, gere uma `SESSION_SECRET` nova e troque a `OWNER_PASSWORD`
