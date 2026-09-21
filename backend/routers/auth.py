"""Owner auth — single-owner account read from backend/.env, JWT session in an
httpOnly cookie. All routes live under /api/auth/*."""

import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_NAME = "js_session"
TOKEN_TTL_DAYS = 7


def _cookie_secure() -> bool:
    return os.environ.get("APP_URL", "").startswith("https://")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SessionUser(BaseModel):
    email: str
    access_token: str | None = None


def _secret() -> str:
    return os.environ.get("SESSION_SECRET", "js-climatizacao-dev-secret")


def get_current_user(request: Request) -> SessionUser:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        authorization = request.headers.get("authorization", "")
        if authorization.lower().startswith("bearer "):
            token = authorization[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    try:
        payload = jwt.decode(token, _secret(), algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Sessão inválida ou expirada")
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Sessão inválida ou expirada")
    return SessionUser(email=email)


@router.post("/login", response_model=SessionUser)
async def login(input: LoginRequest, response: Response):
    owner_email = os.environ.get("OWNER_EMAIL", "")
    owner_password = os.environ.get("OWNER_PASSWORD", "")
    if not owner_email or input.email.lower() != owner_email.lower() or input.password != owner_password:
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    token = jwt.encode(
        {"sub": owner_email, "exp": datetime.now(timezone.utc) + timedelta(days=TOKEN_TTL_DAYS)},
        _secret(),
        algorithm="HS256",
    )
    response.set_cookie(
        COOKIE_NAME,
        token,
        httponly=True,
        samesite="none" if _cookie_secure() else "lax",
        secure=_cookie_secure(),
        max_age=TOKEN_TTL_DAYS * 24 * 3600,
    )
    return SessionUser(email=owner_email, access_token=token)


@router.post("/logout", status_code=204)
async def logout(response: Response):
    response.delete_cookie(COOKIE_NAME)
    return None


@router.get("/me", response_model=SessionUser)
async def me(user: SessionUser = Depends(get_current_user)):
    return user
