"""Lesson content: schema and loader for the deterministic ground truth."""

from __future__ import annotations

import json
from importlib import resources

from .schema import Lesson

__all__ = ["Lesson", "load_lesson", "load_all_lessons"]


def load_all_lessons() -> dict[str, Lesson]:
    """Load every bundled lesson, keyed by lesson id."""
    lessons: dict[str, Lesson] = {}
    package = resources.files("museion.content.lessons")
    for entry in sorted(package.iterdir(), key=lambda e: e.name):
        if entry.name.endswith(".json"):
            lesson = Lesson.model_validate(json.loads(entry.read_text("utf-8")))
            lessons[lesson.id] = lesson
    return lessons


def load_lesson(lesson_id: str) -> Lesson:
    lessons = load_all_lessons()
    try:
        return lessons[lesson_id]
    except KeyError:
        raise KeyError(
            f"Unknown lesson {lesson_id!r}. Available: {sorted(lessons)}"
        ) from None
