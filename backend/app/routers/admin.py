"""Админские эндпоинты: CRUD вопросов и загрузка изображений (HTTP Basic)."""

import io
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import Settings, get_settings
from ..database import get_db
from ..deps import require_admin
from ..models import Option, Question
from ..schemas import QuestionAdmin, QuestionInput, UploadResponse

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin)],
)

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
}
NORMALIZED_TYPES = {"image/jpeg", "image/png", "image/webp"}
NORMALIZED_SIZE = (1600, 1000)
WEBP_QUALITY = 85


def _next_position(db: Session) -> int:
    """Возвращает следующую позицию вопроса (максимальная + 1)."""
    current = db.scalar(select(func.max(Question.position)))
    return (current or 0) + 1


def _remove_local_image(image_url: str, settings: Settings) -> None:
    """Удаляет локальный файл изображения, если он лежит в папке загрузок.

    Внешние URL (http/https) игнорируются. Путь проверяется на выход за пределы
    upload_dir, чтобы исключить удаление произвольных файлов.
    """
    if not image_url.startswith("/uploads/"):
        return
    filename = Path(image_url).name
    candidate = (settings.upload_dir / filename).resolve()
    try:
        candidate.relative_to(settings.upload_dir.resolve())
    except ValueError:
        return
    candidate.unlink(missing_ok=True)


def _apply_options(question: Question, payload: QuestionInput) -> None:
    """Пересоздаёт список вариантов вопроса из тела запроса с новыми позициями."""
    question.options = [
        Option(text=o.text, is_correct=o.is_correct, position=i)
        for i, o in enumerate(payload.options)
    ]


def _normalize_raster(data: bytes, content_type: str) -> tuple[bytes, str]:
    """Центрально кадрирует растровое изображение и сохраняет его как WebP."""
    if content_type not in NORMALIZED_TYPES:
        return data, ALLOWED_IMAGE_TYPES[content_type]

    try:
        with Image.open(io.BytesIO(data)) as source:
            source.load()
            has_alpha = "A" in source.getbands() or (
                source.mode == "P" and "transparency" in source.info
            )
            image = source.convert("RGBA" if has_alpha else "RGB")
            normalized = ImageOps.fit(
                image,
                NORMALIZED_SIZE,
                method=Image.Resampling.LANCZOS,
                centering=(0.5, 0.5),
            )
            output = io.BytesIO()
            normalized.save(output, format="WEBP", quality=WEBP_QUALITY, method=6)
            return output.getvalue(), ".webp"
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image file",
        ) from exc


@router.get("/questions", response_model=list[QuestionAdmin])
def list_questions(db: Session = Depends(get_db)) -> list[Question]:
    """Возвращает все вопросы с вариантами и правильными ответами."""
    stmt = select(Question).order_by(Question.position, Question.id)
    return list(db.scalars(stmt).all())


@router.post("/questions", response_model=QuestionAdmin, status_code=status.HTTP_201_CREATED)
def create_question(payload: QuestionInput, db: Session = Depends(get_db)) -> Question:
    """Создаёт вопрос; при position=0 ставит его в конец списка."""
    question = Question(
        image_url=payload.image_url,
        position=payload.position or _next_position(db),
    )
    _apply_options(question, payload)
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.put("/questions/{question_id}", response_model=QuestionAdmin)
def update_question(
    question_id: int,
    payload: QuestionInput,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> Question:
    """Полностью обновляет вопрос и его варианты.

    Если ссылка на изображение изменилась, старый локальный файл удаляется.
    """
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    if question.image_url != payload.image_url:
        _remove_local_image(question.image_url, settings)

    question.image_url = payload.image_url
    question.position = payload.position
    _apply_options(question, payload)
    db.commit()
    db.refresh(question)
    return question


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> None:
    """Удаляет вопрос вместе с вариантами и локальным файлом изображения."""
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    _remove_local_image(question.image_url, settings)
    db.delete(question)
    db.commit()


@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
) -> UploadResponse:
    """Принимает изображение, проверяет тип/размер и сохраняет его под UUID-именем.

    Возвращает публичный путь `/uploads/<file>` для поля image_url.
    """
    content_type = file.content_type or ""
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported image type: {content_type or 'unknown'}",
        )

    data = await file.read()
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {settings.max_upload_mb} MB limit",
        )
    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file"
        )

    data, extension = _normalize_raster(data, content_type)
    filename = f"{uuid.uuid4().hex}{extension}"
    destination = settings.upload_dir / filename
    destination.write_bytes(data)

    return UploadResponse(url=f"/uploads/{filename}")
