# API

Базовый URL в проде — `http://<host>/` (через nginx), в разработке —
`http://localhost:8000`. Интерактивная документация: `/docs` (Swagger UI).

Админские эндпоинты защищены **HTTP Basic** и требуют заголовок
`Authorization: Basic <base64(user:pass)>`.

## Служебные

### `GET /api/health`

```json
{ "status": "ok", "questions": 3 }
```

## Публичные

### `GET /api/quiz`

Возвращает список вопросов (без флага правильного ответа).

```json
[
  {
    "id": 1,
    "image_url": "https://picsum.photos/seed/mountains/800/500",
    "position": 1,
    "options": [
      { "id": 1, "text": "Горы", "position": 0 },
      { "id": 2, "text": "Море", "position": 1 }
    ]
  }
]
```

### `POST /api/quiz/check`

Проверка одного ответа «на лету» — для мгновенной подсветки правильного/неверного
варианта. Ничего не сохраняет.

Тело:

```json
{ "question_id": 1, "option_id": 2 }
```

Ответ:

```json
{
  "question_id": 1,
  "selected_option_id": 2,
  "correct_option_id": 1,
  "is_correct": false
}
```

**404** — вопрос не найден.

### `POST /api/quiz/submit`

Тело:

```json
{
  "answers": [
    { "question_id": 1, "option_id": 1 },
    { "question_id": 2, "option_id": null }
  ]
}
```

Ответ:

```json
{
  "score": 1,
  "total": 2,
  "details": [
    {
      "question_id": 1,
      "selected_option_id": 1,
      "correct_option_id": 1,
      "is_correct": true
    },
    {
      "question_id": 2,
      "selected_option_id": null,
      "correct_option_id": 6,
      "is_correct": false
    }
  ]
}
```

## Админские (HTTP Basic)

### `GET /api/admin/questions`

Полный список вопросов, включая `is_correct` и `created_at`.

```bash
curl -u admin:secret http://localhost:8000/api/admin/questions
```

### `POST /api/admin/questions`

Создать вопрос. `position=0` → автоматически в конец.

```bash
curl -u admin:secret -X POST http://localhost:8000/api/admin/questions \
  -H 'Content-Type: application/json' \
  -d '{
    "image_url": "/uploads/abc.png",
    "position": 0,
    "options": [
      {"text": "Горы", "is_correct": true},
      {"text": "Море", "is_correct": false}
    ]
  }'
```

**201 Created** → объект `QuestionAdmin`.
**422** — если вариантов < 2 или правильных ≠ 1.

### `PUT /api/admin/questions/{id}`

Полная замена вопроса (поля и список вариантов). См. тело `POST`.
Если `image_url` меняется, старый локальный файл удаляется.

### `DELETE /api/admin/questions/{id}`

**204 No Content**. Удаляет варианты и локальный файл изображения.

### `POST /api/admin/upload`

`multipart/form-data`, поле `file`. Допустимые типы: JPG, PNG, WEBP, GIF, SVG;
размер ≤ `MAX_UPLOAD_MB`.

```bash
curl -u admin:secret -F "file=@photo.png;type=image/png" \
  http://localhost:8000/api/admin/upload
# {"url": "/uploads/9f3c...png"}
```

| Код | Причина                        |
| --- | ------------------------------ |
| 415 | неподдерживаемый тип           |
| 413 | файл больше лимита             |
| 400 | пустой файл                    |
| 401 | неверные Basic-креды           |

## Коды ошибок

- **401** — отсутствует/неверная Basic-авторизация.
- **404** — вопрос не найден.
- **422** — ошибка валидации тела запроса.
