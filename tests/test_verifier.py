from museion.content import load_lesson
from museion.content.schema import (
    ExpressionAnswer,
    MultipleChoiceAnswer,
    NumericAnswer,
    Step,
)
from museion.engine.verifier import verify


def _step(answer, misconceptions=()):
    return Step(
        id="s",
        concept="c",
        prompt="p",
        answer=answer,
        solution="sol",
        misconceptions=list(misconceptions),
    )


def test_numeric_exact_match():
    step = _step(NumericAnswer(value=4, tolerance=0))
    assert verify(step, "4").correct
    assert verify(step, " 4.0 ").correct
    assert not verify(step, "5").correct


def test_numeric_accepts_fraction_form():
    step = _step(NumericAnswer(value=0.5, tolerance=0))
    assert verify(step, "1/2").correct


def test_numeric_garbage_is_incorrect_not_an_error():
    step = _step(NumericAnswer(value=4, tolerance=0))
    assert not verify(step, "banana").correct


def test_multiple_choice_by_text_and_index():
    step = _step(MultipleChoiceAnswer(options=["yes", "no"], correct_index=1))
    assert verify(step, "no").correct
    assert verify(step, "NO ").correct
    assert verify(step, "1").correct
    assert not verify(step, "yes").correct
    assert not verify(step, "0").correct


def test_expression_normalization():
    step = _step(ExpressionAnswer(accepted_forms=["5/6"]))
    assert verify(step, " 5 / 6 ").correct
    assert not verify(step, "2/5").correct


def test_misconception_matching_in_real_lesson():
    lesson = load_lesson("linear-equations-intro")
    step = lesson.step_by_id("step-1")
    result = verify(step, "2")
    assert not result.correct
    assert result.misconception is not None
    assert result.misconception.id == "subtract-the-coefficient"


def test_misconception_matches_equivalent_numeric_forms():
    lesson = load_lesson("linear-equations-intro")
    step = lesson.step_by_id("step-4")
    # "11/5" and "2.2" are the same trigger value in different forms.
    for raw in ("2.2", "11/5"):
        result = verify(step, raw)
        assert result.misconception is not None
        assert result.misconception.id == "wrong-order-divides-first"
