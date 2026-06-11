import pytest

from museion.content import load_lesson
from museion.engine.session import LearnerSession


@pytest.fixture
def session():
    return LearnerSession(lesson=load_lesson("linear-equations-intro"))


def test_correct_answers_walk_through_the_lesson(session):
    for answer in ("6", "4", "5"):
        outcome = session.submit_answer(answer)
        assert outcome.correct
        assert not outcome.lesson_complete
    outcome = session.submit_answer("3")
    assert outcome.correct
    assert outcome.lesson_complete
    assert session.complete


def test_wrong_answer_stays_on_step_and_reports_misconception(session):
    outcome = session.submit_answer("2")
    assert not outcome.correct
    assert outcome.misconception_id == "subtract-the-coefficient"
    assert session.step_index == 0
    assert session.submit_answer("6").correct
    assert session.step_index == 1


def test_hint_ladder_respects_fading_cap(session):
    # Fresh learner: novice scaffolding allows the full 3-hint ladder.
    hints = [session.request_hint() for _ in range(4)]
    assert all(h is not None for h in hints[:3])
    assert hints[3] is None  # ladder exhausted / cap reached


def test_proficient_learner_gets_fewer_hints():
    session = LearnerSession(lesson=load_lesson("linear-equations-intro"))
    # Drive mastery of the first step's concept to proficient.
    for _ in range(10):
        session.mastery.record_attempt(
            "balance-principle", correct=True, first_attempt=True, hints_used=0
        )
    assert session.request_hint() is not None
    assert session.request_hint() is None  # proficient cap: depth 1


def test_snapshot_contains_ground_truth_and_state(session):
    session.submit_answer("2")
    snap = session.snapshot()
    assert snap["lesson_title"] == "Solving Linear Equations"
    assert "Subtracting 6" in snap["verified_solution"]
    assert snap["attempts"] == ["2"]
    assert snap["last_misconception"] is not None
    assert snap["scaffolding"] == "novice"


def test_events_are_recorded(session):
    session.submit_answer("2")
    session.request_hint()
    session.submit_answer("6")
    kinds = [e["kind"] for e in session.events]
    assert kinds == ["answer_submitted", "hint_given", "answer_submitted"]


def test_completed_session_refuses_more_answers(session):
    for answer in ("6", "4", "5", "3"):
        session.submit_answer(answer)
    with pytest.raises(RuntimeError):
        session.submit_answer("1")
