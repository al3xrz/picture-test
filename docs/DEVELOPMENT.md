# Разработка

## Требования

- [uv](https://docs.astral.sh/uv/) (Python 3.12)
- Node.js 18+ и npm

## Один скрипт для всего

```bash
./scripts/dev.sh
```

Поднимает backend (`:8000`) и frontend (`:5173`) с hot-reload. Vite
проксирует `/api` и `/uploads` на backend.

## Backend отдельно

```bash
cd backend
uv sync                                   # установка зависимостей
cp .env.example .env                      # при необходимости
uv run uvicorn app.main:app --reload      # http://localhost:8000/docs
uv run python seed.py                     # демо-данные
uv run python seed.py --force             # перезаписать демо-данные
uv run ruff check .                       # линтер
uv run ruff format .                      # форматирование
```

Переменные окружения читаются из `backend/.env` или из окружения процесса.

## Frontend отдельно

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
npm run build     # production-сборка в dist/
npm run preview   # предпросмотр сборки
npm run lint      # ESLint
```

Прокси на backend настраивается через `VITE_BACKEND_URL`
(по умолчанию `http://localhost:8000`).

## Структура

```
backend/
  app/
    main.py         точка входа FastAPI
    config.py       настройки (pydantic-settings)
    database.py     engine / сессия / init_db
    models.py       Question, Option
    schemas.py      Pydantic-схемы и валидация
    deps.py         HTTP Basic
    routers/
      quiz.py       публичные эндпоинты
      admin.py      CRUD + upload
  seed.py
frontend/
  src/
    main.jsx, App.jsx, theme.js, api.js
    pages/          QuizPage, AdminPage
    components/      Layout, OptionCard, ResultScreen
    components/admin/ LoginCard, AdminTable, QuestionFormDialog, ImagePicker, OptionsEditor
```

## Соглашения

- Backend: типизация, `ruff` (line-length 100), никаких комментариев без
  необходимости.
- Frontend: функциональные компоненты, хуки, MUI-компоненты вместо «сырого»
  HTML, стили через `sx`.
- Новые эндпоинты сопровождайте правкой `docs/API.md`.

## Документация

При изменении API, конфигурации или деплоя обновляйте соответствующий файл в
`docs/` и `README.md`.
