# AGENTS.md

Команды для автоматизированных ассистентов и разработчиков.

## Backend (`backend/`)

```bash
uv sync                                    # установить зависимости
uv run uvicorn app.main:app --reload       # запуск (http://localhost:8000)
uv run python seed.py [--force]            # демо-данные
uv run ruff check .                        # линтер (обязательно перед коммитом)
uv run ruff format .                       # форматирование
```

- Стек: FastAPI, SQLAlchemy 2.0, SQLite, pydantic-settings.
- Тесты пока отсутствуют; проверка — `ruff check` + smoke-запросы к API
  (`/api/health`, `/api/quiz`, Basic-защита `/api/admin/*`).

## Frontend (`frontend/`)

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production-сборка (обязательно проверять после правок)
npm run lint      # ESLint
```

- Стек: React 18, Vite, MUI v6, React Router, axios.

## Docker

```bash
make up           # сборка и запуск
make down         # остановка
make logs         # логи
make seed ARGS=--force
make backup / make restore FILE=...
make clean        # удалить тома (data loss)
```

## Правила

- Не коммить `.env`, `*.db`, `backend/uploads/*` и `node_modules`.
- После изменений API обновляйте `docs/API.md`.
- После изменений конфигурации/деплоя — `docs/DEPLOYMENT.md` и `README.md`.
- Перед завершением задачи: `uv run ruff check .` и `npm run build`.
