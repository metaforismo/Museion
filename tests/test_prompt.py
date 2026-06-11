from museion.content import load_lesson
from museion.engine.session import LearnerSession
from museion.maia.prompt import MAIA_PERSONA, build_state_block, build_system_prompt


def _snapshot(with_mistake: bool = False):
    session = LearnerSession(lesson=load_lesson("linear-equations-intro"))
    if with_mistake:
        session.submit_answer("2")
    return session.snapshot()


def test_persona_contains_the_non_revelation_guardrail():
    assert "NEVER state the final answer" in MAIA_PERSONA


def test_state_block_injects_verified_solution_and_attempts():
    block = build_state_block(_snapshot(with_mistake=True))
    assert "VERIFIED SOLUTION" in block
    assert "Subtracting 6" in block  # ground truth is in context
    assert "Learner's attempts so far: 2" in block
    assert "MISCONCEPTION detected" in block
    assert "SCAFFOLDING: novice" in block


def test_state_block_without_attempts():
    block = build_state_block(_snapshot())
    assert "none yet" in block
    assert "MISCONCEPTION" not in block


def test_system_prompt_caches_stable_persona_only():
    persona_block, state_block = build_system_prompt(_snapshot())
    assert persona_block["cache_control"] == {"type": "ephemeral"}
    assert persona_block["text"] == MAIA_PERSONA
    # The volatile state must not carry a cache marker.
    assert "cache_control" not in state_block


def test_multiple_choice_options_are_visible_to_maia():
    session = LearnerSession(lesson=load_lesson("fractions-unlike-denominators"))
    block = build_state_block(session.snapshot())
    assert "Options: yes, no" in block
