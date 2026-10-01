# Развёртывание (Docker Compose)

## Требования

- Docker 24+ и Docker Compose v2
- Свободный порт (по умолчанию 8080)

## Первый запуск

```bash
cp .env.example .env      # ОБЯЗАТЕЛЬНО смените ADMIN_PASSWORD
./scripts/deploy.sh       # или: make up
```

Скрипт соберёт образы, поднимет контейнеры и выведет адреса.

### Переменные окружения (`.env`)

| Переменная       | По умолчанию | Назначение                                   |
| ---------------- | ------------ | -------------------------------------------- |
| `ADMIN_USER`     | `admin`      | Логин администратора                         |
| `ADMIN_PASSWORD` | `change-me`  | Пароль администратора (смените!)             |
| `MAX_UPLOAD_MB`  | `5`          | Максимальный размер изображения              |
| `WEB_PORT`       | `8080`       | Порт, публикуемый наружу                     |
| `CORS_ORIGINS`   | —            | Доп. разрешённые origin (обычно не нужно)    |

## Сервисы

- **backend** — uvicorn, порт 8000 внутри сети, наружу не публикуется.
  Тома: `db-data` (`/data`) и `uploads-data` (`/data/uploads`).
  Healthcheck: `/api/health`.
- **frontend** — nginx, раздаёт SPA и проксирует `/api/`, `/uploads/` на
  backend. Наружу — `WEB_PORT`.

## Управление

```bash
make logs                 # логи
make down                 # остановить (данные сохраняются)
make clean                # остановить и удалить тома (ДАННЫЕ ПОТЕРЯЮТСЯ)
make seed ARGS=--force    # демо-данные с перезаписью
docker compose ps         # статус
```

## Данные и бэкапы

Данные живут в named-томах `db-data` и `uploads-data`.

```bash
make backup                          # backups/picture-test-<timestamp>.tar.gz
make restore FILE=backups/....tar.gz # восстановление (с подтверждением)
```

Бэкап содержит `app.db` и все загруженные изображения.

## Обновление

```bash
git pull
./scripts/deploy.sh       # пересоберёт образы и перезапустит
```

Тома при этом сохраняются; схема БД создаётся автоматически при старте.

## TLS / reverse proxy

Контейнер frontend слушает HTTP. Для HTTPS поставьте перед ним внешний
reverse proxy (например, Caddy/Traefik/nginx) или облачный балансировщик,
терминируя TLS и проксируя на `WEB_PORT`.

## Troubleshooting

- **Порт занят** — измените `WEB_PORT` в `.env`.
- **401 в админке** — проверьте `ADMIN_USER`/`ADMIN_PASSWORD`; после правки
  `.env` перезапустите: `docker compose up -d`.
- **Изображения не отображаются** — убедитесь, что том `uploads-data`
  смонтирован; проверьте `docker compose logs backend`.
- **Файл не загружается (413)** — увеличьте `MAX_UPLOAD_MB` и в
  `frontend/nginx.conf` `client_max_body_size`.
