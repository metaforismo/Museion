"""Deterministic answer verification.

Correctness is decided here, by code, against author-verified content.
The LLM never grades anything — this is the architectural guarantee that
Museion cannot make an arithmetic mistake the way a chatbot tutor can.
"""

from __future__ import annotations

from dataclasses import dataclass
from fractions import Fraction

from museion.content.schema import (
    ExpressionAnswer,
    Misconception,
    MultipleChoiceAnswer,
    NumericAnswer,
    Step,
)


@dataclass(frozen=True)
class VerificationResult:
    correct: bool
    normalized_answer: str
    misconception: Misconception | None = None


def normalize(raw: str) -> str:
    """Canonical form used for matching answers and misconception triggers."""
    return "".join(raw.strip().lower().split())


def _parse_number(text: str) -> float | None:
    """Parse '4', '4.0', '8/2', '-1/3' into a float; None if not numeric."""
    try:
        return float(Fraction(text))
    except (ValueError, ZeroDivisionError):
        return None


def verify(step: Step, raw_answer: str) -> VerificationResult:
    norm = normalize(raw_answer)
    spec = step.answer

    if isinstance(spec, NumericAnswer):
        value = _parse_number(norm)
        correct = value is not None and abs(value - spec.value) <= spec.tolerance
    elif isinstance(spec, MultipleChoiceAnswer):
        options = [normalize(o) for o in spec.options]
        if norm.isdigit() and 0 <= int(norm) < len(options):
            # Accept the option index as well as the option text.
            correct = int(norm) == spec.correct_index
        else:
            correct = norm == options[spec.correct_index]
    elif isinstance(spec, ExpressionAnswer):
        correct = norm in {normalize(form) for form in spec.accepted_forms}
    else:  # pragma: no cover - schema is a closed union
        raise TypeError(f"Unsupported answer spec: {type(spec)!r}")

    misconception = None
    if not correct:
        misconception = match_misconception(step, norm)

    return VerificationResult(
        correct=correct, normalized_answer=norm, misconception=misconception
    )


def match_misconception(step: Step, normalized_answer: str) -> Misconception | None:
    candidate_value = _parse_number(normalized_answer)
    for misconception in step.misconceptions:
        for trigger in misconception.trigger_answers:
            trigger_norm = normalize(trigger)
            if normalized_answer == trigger_norm:
                return misconception
            # Numeric triggers also match equivalent forms ("2.2" vs "11/5").
            trigger_value = _parse_number(trigger_norm)
            if (
                trigger_value is not None
                and candidate_value is not None
                and trigger_value == candidate_value
            ):
                return misconception
    return None
