"""Seed the database with demo quiz questions.

Usage:
    uv run python seed.py          # add demo data if the table is empty
    uv run python seed.py --force  # wipe questions and re-seed
"""

import argparse

from app.database import Base, SessionLocal, engine
from app.models import Option, Question

DEMO = [
    {
        "image_url": "https://picsum.photos/seed/mountains/800/500",
        "position": 1,
        "options": [
            ("Горы", True),
            ("Море", False),
            ("Пустыня", False),
            ("Лес", False),
        ],
    },
    {
        "image_url": "https://picsum.photos/seed/city/800/500",
        "position": 2,
        "options": [
            ("Деревня", False),
            ("Город", True),
            ("Океан", False),
            ("Космос", False),
        ],
    },
    {
        "image_url": "https://picsum.photos/seed/cat/800/500",
        "position": 3,
        "options": [
            ("Собака", False),
            ("Птица", False),
            ("Кошка", True),
            ("Рыба", False),
        ],
    },
]


def seed(force: bool) -> None:
    """Наполняет БД демо-вопросами.

    Если данные уже есть и force=False — ничего не делает.
    При force=True предварительно очищает таблицы вопросов и вариантов.
    """
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(Question).count()
        if existing and not force:
            print(f"Database already has {existing} questions. Use --force to re-seed.")
            return
        if force:
            db.query(Option).delete()
            db.query(Question).delete()
            db.commit()

        for item in DEMO:
            question = Question(image_url=item["image_url"], position=item["position"])
            question.options = [
                Option(text=text, is_correct=is_correct, position=index)
                for index, (text, is_correct) in enumerate(item["options"])
            ]
            db.add(question)
        db.commit()
        print(f"Seeded {len(DEMO)} questions.")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="wipe and re-seed")
    seed(parser.parse_args().force)
