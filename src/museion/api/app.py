"""HTTP API for Museion.

In-memory session store: enough to drive a frontend prototype. See
TODO.md for the persistence and auth roadmap.
"""

from __future__ import annotations

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from museion.content import load_all_lessons
from museion.engine.session import LearnerSession
from museion.maia.tutor import MaiaTutor

app = FastAPI(
    title="Museion",
    description="Interactive learning platform with Maia, a Socratic AI tutor.",
    version="0.1.0",
)

_sessions: dict[str, LearnerSession] = {}
_tutor = MaiaTutor()


class StartSessionRequest(BaseModel):
    lesson_id: str


class AnswerRequest(BaseModel):
    answer: str


class ChatRequest(BaseModel):
    message: str


def _get_session(session_id: str) -> LearnerSession:
    session = _sessions.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Unknown session")
    return session


def _require_active(session: LearnerSession) -> None:
    if session.complete:
        raise HTTPException(status_code=409, detail="Lesson already complete")


@app.get("/lessons")
def list_lessons() -> list[dict]:
    return [
        {
            "id": lesson.id,
            "title": lesson.title,
            "description": lesson.description,
            "concepts": lesson.concepts,
            "steps": len(lesson.steps),
        }
        for lesson in load_all_lessons().values()
    ]


@app.post("/sessions")
def start_session(body: StartSessionRequest) -> dict:
    lessons = load_all_lessons()
    if body.lesson_id not in lessons:
        raise HTTPException(status_code=404, detail="Unknown lesson")
    session = LearnerSession(lesson=lessons[body.lesson_id])
    _sessions[session.session_id] = session
    return {
        "session_id": session.session_id,
        "lesson_id": session.lesson.id,
        "step_prompt": session.current_step.prompt,
    }


@app.get("/sessions/{session_id}")
def session_state(session_id: str) -> dict:
    session = _get_session(session_id)
    if session.complete:
        return {"complete": True, "events": len(session.events)}
    return {"complete": False, **session.snapshot()}


@app.post("/sessions/{session_id}/answer")
def submit_answer(session_id: str, body: AnswerRequest) -> dict:
    session = _get_session(session_id)
    _require_active(session)
    outcome = session.submit_answer(body.answer)
    return {
        "correct": outcome.correct,
        "lesson_complete": outcome.lesson_complete,
        "attempts_on_step": outcome.attempts_on_step,
        "misconception_id": outcome.misconception_id,
        "mastery": outcome.mastery,
        "scaffolding": outcome.scaffolding.value,
        "next_prompt": None if outcome.lesson_complete else session.current_step.prompt,
    }


@app.post("/sessions/{session_id}/hint")
def request_hint(session_id: str) -> dict:
    session = _get_session(session_id)
    _require_active(session)
    hint = session.request_hint()
    return {"hint": hint, "granted": hint is not None}


@app.post("/sessions/{session_id}/maia")
def chat_with_maia(session_id: str, body: ChatRequest) -> dict:
    session = _get_session(session_id)
    _require_active(session)
    return {"reply": _tutor.respond(session, body.message)}
