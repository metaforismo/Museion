"""Content schema: the deterministic ground truth of Museion.

Every lesson is authored as structured data. Correct answers, worked
solutions, and known misconceptions live *here*, in verified content —
never in LLM output. Maia (the tutor) receives this data as context and
coaches against it; she is architecturally unable to be the source of
mathematical truth.
"""

from __future__ import annotations

from enum import Enum
from typing import Annotated, Literal, Union

from pydantic import BaseModel, Field


class StepKind(str, Enum):
    NUMERIC = "numeric"
    MULTIPLE_CHOICE = "multiple_choice"
    EXPRESSION = "expression"


class Misconception(BaseModel):
    """A known wrong path, with the trigger that identifies it.

    Triggers are matched deterministically against the learner's
    (normalized) answer, so Maia can be told *which* misunderstanding to
    address instead of guessing.
    """

    id: str
    trigger_answers: list[str] = Field(
        description="Normalized answers that indicate this misconception."
    )
    description: str = Field(
        description="What the learner likely did wrong, written for Maia."
    )
    remediation_focus: str = Field(
        description="The idea Maia should guide the learner to rediscover."
    )


class NumericAnswer(BaseModel):
    kind: Literal["numeric"] = "numeric"
    value: float
    tolerance: float = 1e-9


class MultipleChoiceAnswer(BaseModel):
    kind: Literal["multiple_choice"] = "multiple_choice"
    options: list[str]
    correct_index: int


class ExpressionAnswer(BaseModel):
    kind: Literal["expression"] = "expression"
    accepted_forms: list[str] = Field(
        description="Equivalent accepted answers; matched after normalization."
    )


AnswerSpec = Annotated[
    Union[NumericAnswer, MultipleChoiceAnswer, ExpressionAnswer],
    Field(discriminator="kind"),
]


class Step(BaseModel):
    """One reasoning step. Tutoring is step-based, not answer-based:
    every step has its own verified answer, solution and misconceptions,
    so feedback can land exactly where the reasoning breaks (VanLehn 2011).
    """

    id: str
    concept: str = Field(description="Concept this step exercises; drives mastery.")
    prompt: str
    answer: AnswerSpec
    solution: str = Field(
        description=(
            "Author-verified worked solution. Injected into Maia's context "
            "as ground truth; never shown to the learner verbatim."
        )
    )
    misconceptions: list[Misconception] = Field(default_factory=list)
    hints: list[str] = Field(
        default_factory=list,
        description=(
            "Deterministic hint ladder, least to most revealing. Used as the "
            "offline fallback and as scaffolding material for Maia. The final "
            "answer must never appear here."
        ),
    )


class Lesson(BaseModel):
    id: str
    title: str
    description: str
    concepts: list[str]
    steps: list[Step]

    def step_by_id(self, step_id: str) -> Step:
        for step in self.steps:
            if step.id == step_id:
                return step
        raise KeyError(f"No step {step_id!r} in lesson {self.id!r}")
