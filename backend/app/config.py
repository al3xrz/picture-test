"""Конфигурация приложения: значения читаются из переменных окружения и `.env`."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Настройки сервиса с значениями по умолчанию для локального запуска."""

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = f"sqlite:///{BASE_DIR / 'app.db'}"
    admin_user: str = "admin"
    admin_password: str = "admin"
    upload_dir: Path = BASE_DIR / "uploads"
    max_upload_mb: int = 5
    cors_origins: str = "http://localhost:5173"

    @property
    def max_upload_bytes(self) -> int:
        """Лимит размера загружаемого файла в байтах."""
        return self.max_upload_mb * 1024 * 1024

    @property
    def cors_origin_list(self) -> list[str]:
        """Список разрешённых origin, разобранный из строки через запятую."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    """Возвращает кэшированный экземпляр настроек, создавая папку загрузок."""
    settings = Settings()
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    return settings
