"""Точка входа FastAPI: CORS, статика загрузок, роутеры и health-чек."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func, select

from .config import get_settings
from .database import SessionLocal, init_db
from .models import Question
from .routers import admin, quiz
from .schemas import HealthResponse

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Создаёт таблицы БД при старте приложения."""
    init_db()
    yield


app = FastAPI(title="Picture Test API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

app.include_router(quiz.router)
app.include_router(admin.router)


@app.get("/api/health", response_model=HealthResponse, tags=["meta"])
def health() -> HealthResponse:
    """Проверка живости сервиса и количество вопросов в БД."""
    db = SessionLocal()
    try:
        count = db.scalar(select(func.count(Question.id))) or 0
    finally:
        db.close()
    return HealthResponse(status="ok", questions=count)
