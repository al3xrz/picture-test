"""Подключение к БД: engine, фабрика сессий и базовый класс моделей."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import get_settings

settings = get_settings()

# SQLite требует отключить проверку потока при работе из пула FastAPI.
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """Базовый класс для всех ORM-моделей."""


def get_db() -> Generator[Session, None, None]:
    """FastAPI-зависимость: открывает сессию на время запроса и закрывает её."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Создаёт таблицы по метаданным моделей (вызывается при старте приложения)."""
    from . import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
