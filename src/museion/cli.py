"""Interactive terminal demo: walk a lesson with Maia at your side.

Run with `museion` (after `pip install -e .`) or `python -m museion.cli`.
Commands inside a step: type an answer, `hint`, `ask <question>`, `quit`.
"""

from __future__ import annotations

import sys

from museion.content import load_all_lessons
from museion.engine.session import LearnerSession
from museion.maia.tutor import MaiaTutor


def _choose_lesson() -> str:
    lessons = list(load_all_lessons().values())
    print("\n=== Museion ===\nAvailable lessons:")
    for i, lesson in enumerate(lessons, start=1):
        print(f"  {i}. {lesson.title} — {lesson.description}")
    while True:
        choice = input("Choose a lesson number: ").strip()
        if choice.isdigit() and 1 <= int(choice) <= len(lessons):
            return lessons[int(choice) - 1].id
        print("Please enter a valid number.")


def run_lesson(lesson_id: str) -> None:
    session = LearnerSession(lesson=load_all_lessons()[lesson_id])
    tutor = MaiaTutor()
    mode = "live" if tutor.available else "offline (hint ladder only)"
    print(f"\nStarting '{session.lesson.title}' — Maia is {mode}.")
    print("Type an answer, 'hint', 'ask <question>', or 'quit'.\n")

    while not session.complete:
        step = session.current_step
        print(f"--- Step {session.step_index + 1}/{len(session.lesson.steps)} ---")
        print(step.prompt)
        while True:
            raw = input("> ").strip()
            if not raw:
                continue
            if raw.lower() == "quit":
                print("Goodbye — your progress lives only in this run for now.")
                return
            if raw.lower() == "hint":
                hint = session.request_hint()
                print(hint or "No more hints at your mastery level — you've got this.")
                continue
            if raw.lower().startswith("ask "):
                print(f"\nMaia: {tutor.respond(session, raw[4:])}\n")
                continue

            outcome = session.submit_answer(raw)
            if outcome.correct:
                print(f"✓ Correct. (mastery: {outcome.mastery:.2f})\n")
                break
            print("✗ Not yet.")
            if tutor.available:
                print(f"\nMaia: {tutor.respond(session, raw)}\n")
            elif outcome.misconception_id:
                print(f"(detected misconception: {outcome.misconception_id})")

    print("Lesson complete! 🎓")
    print(f"Events recorded: {len(session.events)}")


def main() -> None:
    try:
        run_lesson(_choose_lesson())
    except (KeyboardInterrupt, EOFError):
        print("\nGoodbye.")
        sys.exit(0)


if __name__ == "__main__":
    main()
