"""Pydantic-схемы запросов и ответов, включая валидацию вопроса."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class OptionPublic(BaseModel):
    """Вариант ответа для публичного API — без признака правильного ответа."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    position: int


class QuestionPublic(BaseModel):
    """Вопрос для прохождения теста (без правильных ответов)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    image_url: str
    position: int
    options: list[OptionPublic]


class OptionAdmin(BaseModel):
    """Вариант ответа для админки, включая флаг правильного ответа."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    is_correct: bool
    position: int


class QuestionAdmin(BaseModel):
    """Вопрос в админке: полные данные с датой создания."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    image_url: str
    position: int
    created_at: datetime
    options: list[OptionAdmin]


class OptionInput(BaseModel):
    """Входной вариант ответа при создании/редактировании вопроса."""

    text: str = Field(min_length=1, max_length=512)
    is_correct: bool = False

    @field_validator("text")
    @classmethod
    def strip_text(cls, value: str) -> str:
        """Убирает пробелы по краям и запрещает пустой текст."""
        value = value.strip()
        if not value:
            raise ValueError("Option text must not be empty")
        return value


class QuestionInput(BaseModel):
    """Тело запроса на создание/обновление вопроса с проверкой инвариантов."""

    image_url: str = Field(min_length=1, max_length=1024)
    position: int = 0
    options: list[OptionInput]

    @field_validator("image_url")
    @classmethod
    def strip_image_url(cls, value: str) -> str:
        """Убирает пробелы и запрещает пустую ссылку на изображение."""
        value = value.strip()
        if not value:
            raise ValueError("Image URL must not be empty")
        return value

    @model_validator(mode="after")
    def validate_options(self) -> "QuestionInput":
        """Требует минимум два варианта и ровно один правильный."""
        if len(self.options) < 2:
            raise ValueError("A question needs at least 2 options")
        correct = sum(1 for option in self.options if option.is_correct)
        if correct != 1:
            raise ValueError("A question must have exactly one correct option")
        return self


class AnswerItem(BaseModel):
    """Ответ пользователя на один вопрос (option_id может быть пустым)."""

    question_id: int
    option_id: int | None = None


class QuizSubmission(BaseModel):
    """Набор ответов пользователя для подсчёта результата."""

    answers: list[AnswerItem]


class AnswerResult(BaseModel):
    """Результат проверки одного ответа."""

    question_id: int
    selected_option_id: int | None
    correct_option_id: int
    is_correct: bool


class QuizResult(BaseModel):
    """Итог прохождения: счёт и разбор по каждому вопросу."""

    score: int
    total: int
    details: list[AnswerResult]


class UploadResponse(BaseModel):
    """Ответ на загрузку изображения: публичный путь к файлу."""

    url: str


class HealthResponse(BaseModel):
    """Статус сервиса и число вопросов в БД."""

    status: str
    questions: int
