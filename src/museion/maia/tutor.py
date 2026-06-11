"""Maia's voice: the LLM interaction layer.

This module is deliberately thin. All pedagogy-critical state (what is
true, what the learner did, how much help is allowed) is decided by the
engine and injected via the prompt; the model only converses.
"""

from __future__ import annotations

import os

import anthropic

from museion.engine.session import LearnerSession
from museion.maia.prompt import build_system_prompt

MODEL = "claude-opus-4-8"
MAX_TOKENS = 1024

_OFFLINE_NOTICE = (
    "[Maia is offline: no ANTHROPIC_API_KEY configured. "
    "Falling back to the step's hint ladder.]"
)


class MaiaTutor:
    """Conversational tutor bound to a learner session."""

    def __init__(self, client: anthropic.Anthropic | None = None):
        self._client = client

    @property
    def available(self) -> bool:
        return self._client is not None or bool(os.environ.get("ANTHROPIC_API_KEY"))

    def _get_client(self) -> anthropic.Anthropic:
        if self._client is None:
            self._client = anthropic.Anthropic()
        return self._client

    def respond(self, session: LearnerSession, learner_message: str) -> str:
        """One tutoring turn, grounded in the current lesson state."""
        if not self.available:
            return self._offline_response(session)

        session.chat_history.append({"role": "user", "content": learner_message})
        with self._get_client().messages.stream(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            thinking={"type": "adaptive"},
            system=build_system_prompt(session.snapshot()),
            messages=list(session.chat_history),
        ) as stream:
            message = stream.get_final_message()

        reply = "".join(
            block.text for block in message.content if block.type == "text"
        ).strip()
        session.chat_history.append({"role": "assistant", "content": reply})
        session.events.append({"kind": "maia_turn", "learner": learner_message})
        return reply

    def _offline_response(self, session: LearnerSession) -> str:
        hint = session.request_hint()
        if hint is None:
            return (
                f"{_OFFLINE_NOTICE}\nNo more hints are available at your "
                "mastery level — trust your reasoning and try the step."
            )
        return f"{_OFFLINE_NOTICE}\n{hint}"
