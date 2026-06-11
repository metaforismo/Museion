"""Per-concept mastery model and the fading policy built on it.

This implements the "assistance dilemma" resolution (Koedinger & Aleven
2007): how much help, and when. Mastery is tracked per concept; the
scaffolding Maia is allowed to offer fades as mastery grows (Wood, Bruner
& Ross 1976), because guidance that helps novices hurts experts
(expertise reversal effect, Kalyuga & Sweller).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class ScaffoldingLevel(str, Enum):
    """How much support Maia may give for a concept right now."""

    NOVICE = "novice"          # full ladder, proactive coaching
    DEVELOPING = "developing"  # ladder capped, hints on request
    PROFICIENT = "proficient"  # Socratic prompts only; Maia asks, never tells


# Hint-ladder depth allowed per scaffolding level (see maia/policy notes).
MAX_HINT_DEPTH = {
    ScaffoldingLevel.NOVICE: 3,
    ScaffoldingLevel.DEVELOPING: 2,
    ScaffoldingLevel.PROFICIENT: 1,
}

_LEARNING_RATE = 0.3
_DEVELOPING_THRESHOLD = 0.4
_PROFICIENT_THRESHOLD = 0.8


@dataclass
class MasteryModel:
    """Exponential-moving-average mastery in [0, 1] per concept.

    First-attempt performance is the signal: solving with hints or after
    failures is performance-with-a-crutch, so it moves mastery less
    (Soderstrom & Bjork: performance is not learning).
    """

    scores: dict[str, float] = field(default_factory=dict)

    def mastery(self, concept: str) -> float:
        return self.scores.get(concept, 0.0)

    def record_attempt(
        self, concept: str, correct: bool, first_attempt: bool, hints_used: int
    ) -> float:
        if correct:
            # Unassisted first-attempt success is full evidence of mastery;
            # assisted success is discounted.
            evidence = 1.0 if (first_attempt and hints_used == 0) else 0.5
        else:
            evidence = 0.0
        current = self.mastery(concept)
        updated = current + _LEARNING_RATE * (evidence - current)
        self.scores[concept] = updated
        return updated

    def scaffolding_level(self, concept: str) -> ScaffoldingLevel:
        score = self.mastery(concept)
        if score >= _PROFICIENT_THRESHOLD:
            return ScaffoldingLevel.PROFICIENT
        if score >= _DEVELOPING_THRESHOLD:
            return ScaffoldingLevel.DEVELOPING
        return ScaffoldingLevel.NOVICE

    def max_hint_depth(self, concept: str) -> int:
        return MAX_HINT_DEPTH[self.scaffolding_level(concept)]
