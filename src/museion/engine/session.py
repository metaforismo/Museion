"""Step-based learning session: the state Maia can see.

A session walks a lesson one step at a time, records every attempt and
hint, updates mastery, and exposes a structured snapshot of "what the
learner is doing right now". That snapshot is what makes Maia a tutor
with eyes on the lesson instead of a chatbot with an empty prompt box.

Every interaction is also appended to an event log, because the metric
that matters is not in-session performance but what remains later,
without help (Bastani et al. 2025: measure the learning, not the crutch).
"""

from __future__ import annotations

import time
import uuid
from dataclasses import dataclass, field
from typing import Any

from museion.content.schema import Lesson, MultipleChoiceAnswer, Step
from museion.engine.mastery import MasteryModel, ScaffoldingLevel
from museion.engine.verifier import VerificationResult, verify


@dataclass(frozen=True)
class StepOutcome:
    """What happened after one submitted answer."""

    correct: bool
    attempts_on_step: int
    lesson_complete: bool
    misconception_id: str | None
    mastery: float
    scaffolding: ScaffoldingLevel


@dataclass
class StepRecord:
    attempts: list[VerificationResult] = field(default_factory=list)
    hints_used: int = 0
    completed: bool = False


@dataclass
class LearnerSession:
    lesson: Lesson
    mastery: MasteryModel = field(default_factory=MasteryModel)
    session_id: str = field(default_factory=lambda: uuid.uuid4().hex)
    step_index: int = 0
    records: dict[str, StepRecord] = field(default_factory=dict)
    events: list[dict[str, Any]] = field(default_factory=list)
    chat_history: list[dict[str, str]] = field(default_factory=list)

    # -- state -----------------------------------------------------------

    @property
    def complete(self) -> bool:
        return self.step_index >= len(self.lesson.steps)

    @property
    def current_step(self) -> Step:
        if self.complete:
            raise RuntimeError("Lesson already complete")
        return self.lesson.steps[self.step_index]

    def record_for(self, step: Step) -> StepRecord:
        return self.records.setdefault(step.id, StepRecord())

    # -- actions ----------------------------------------------------------

    def submit_answer(self, raw_answer: str) -> StepOutcome:
        step = self.current_step
        record = self.record_for(step)
        result = verify(step, raw_answer)
        record.attempts.append(result)

        first_attempt = len(record.attempts) == 1
        mastery = self.mastery.record_attempt(
            step.concept,
            correct=result.correct,
            first_attempt=first_attempt,
            hints_used=record.hints_used,
        )

        self._log(
            "answer_submitted",
            step_id=step.id,
            answer=result.normalized_answer,
            correct=result.correct,
            attempt=len(record.attempts),
            hints_used=record.hints_used,
            misconception=result.misconception.id if result.misconception else None,
            mastery=mastery,
        )

        if result.correct:
            record.completed = True
            self.step_index += 1

        return StepOutcome(
            correct=result.correct,
            attempts_on_step=len(record.attempts),
            lesson_complete=self.complete,
            misconception_id=result.misconception.id if result.misconception else None,
            mastery=mastery,
            scaffolding=self.mastery.scaffolding_level(step.concept),
        )

    def request_hint(self) -> str | None:
        """Next rung of the deterministic hint ladder, capped by fading.

        Returns None when the policy says no more hints: either the ladder
        is exhausted or mastery is high enough that the learner should
        push through unassisted (expertise reversal).
        """
        step = self.current_step
        record = self.record_for(step)
        depth_allowed = min(
            self.mastery.max_hint_depth(step.concept), len(step.hints)
        )
        if record.hints_used >= depth_allowed:
            self._log("hint_denied", step_id=step.id, hints_used=record.hints_used)
            return None
        hint = step.hints[record.hints_used]
        record.hints_used += 1
        self._log("hint_given", step_id=step.id, hint_level=record.hints_used)
        return hint

    # -- Maia's view ------------------------------------------------------

    def snapshot(self) -> dict[str, Any]:
        """Structured lesson state injected into Maia's context."""
        step = self.current_step
        record = self.record_for(step)
        last = record.attempts[-1] if record.attempts else None
        options = None
        if isinstance(step.answer, MultipleChoiceAnswer):
            options = step.answer.options
        return {
            "lesson_title": self.lesson.title,
            "step_prompt": step.prompt,
            "options": options,
            "verified_solution": step.solution,
            "attempts": [a.normalized_answer for a in record.attempts],
            "last_misconception": (
                {
                    "description": last.misconception.description,
                    "remediation_focus": last.misconception.remediation_focus,
                }
                if last and last.misconception
                else None
            ),
            "hints_used": record.hints_used,
            "mastery": self.mastery.mastery(step.concept),
            "scaffolding": self.mastery.scaffolding_level(step.concept).value,
        }

    # -- internals --------------------------------------------------------

    def _log(self, kind: str, **payload: Any) -> None:
        self.events.append({"kind": kind, "ts": time.time(), **payload})
