"""Публичные эндпоинты прохождения теста: список вопросов, проверка и подсчёт."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Option, Question
from ..schemas import (
    AnswerItem,
    AnswerResult,
    QuestionPublic,
    QuizResult,
    QuizSubmission,
)

router = APIRouter(prefix="/api/quiz", tags=["quiz"])


def _evaluate(answer: AnswerItem, db: Session) -> AnswerResult | None:
    """Сверяет выбранный вариант с правильным для одного вопроса.

    Возвращает None, если вопрос не найден или у него нет правильного варианта.
    Игнорирует вариант, не принадлежащий указанному вопросу.
    """
    question = db.get(Question, answer.question_id)
    if question is None:
        return None
    correct = next((o for o in question.options if o.is_correct), None)
    if correct is None:
        return None
    selected = db.get(Option, answer.option_id) if answer.option_id is not None else None
    selected_id = selected.id if selected and selected.question_id == question.id else None
    return AnswerResult(
        question_id=question.id,
        selected_option_id=selected_id,
        correct_option_id=correct.id,
        is_correct=selected_id == correct.id,
    )


@router.get("", response_model=list[QuestionPublic])
def list_questions(db: Session = Depends(get_db)) -> list[Question]:
    """Возвращает все вопросы в порядке position без правильных ответов."""
    stmt = select(Question).order_by(Question.position, Question.id)
    return list(db.scalars(stmt).all())


@router.post("/check", response_model=AnswerResult, tags=["quiz"])
def check_answer(answer: AnswerItem, db: Session = Depends(get_db)) -> AnswerResult:
    """Проверяет один ответ «на лету» для мгновенной подсветки в UI."""
    result = _evaluate(answer, db)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    return result


@router.post("/submit", response_model=QuizResult)
def submit_quiz(payload: QuizSubmission, db: Session = Depends(get_db)) -> QuizResult:
    """Считает итоговый счёт по всем ответам; ничего не сохраняет в БД."""
    details: list[AnswerResult] = []
    score = 0
    total = 0

    for answer in payload.answers:
        result = _evaluate(answer, db)
        if result is None:
            continue
        total += 1
        if result.is_correct:
            score += 1
        details.append(result)

    return QuizResult(score=score, total=total, details=details)
