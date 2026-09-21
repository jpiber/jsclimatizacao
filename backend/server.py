import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from datetime import date, timedelta
from pathlib import Path


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Banco de dados: Supabase (PostgreSQL) via SQLAlchemy async — ver database.py
from database import engine
from lib.dates import today_iso
from lib.whatsapp import reminder_loop
from routers.auth import router as auth_router
from routers.appointments import router as appointments_router


# Startup runs before the yield, shutdown after it.
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.reminder_task = asyncio.create_task(reminder_loop())  # lembretes de WhatsApp na véspera
    yield
    app.state.reminder_task.cancel()
    await engine.dispose()


# Create the main app without a prefix
app = FastAPI(lifespan=lifespan)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "JS Climatização API"}


# Server-anchored "today"/"tomorrow" (APP_TZ from backend/.env) — the browser never does its own date math.
@api_router.get("/meta")
async def get_meta():
    today = today_iso()
    tomorrow = (date.fromisoformat(today) + timedelta(days=1)).isoformat()
    return {"today": today, "tomorrow": tomorrow, "empresa": "JS Climatização"}


# Feature routers — one module per resource, mounted on the /api router above the final include.
api_router.include_router(auth_router)
api_router.include_router(appointments_router)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
