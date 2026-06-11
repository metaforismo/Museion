from museion.engine.mastery import MasteryModel, ScaffoldingLevel


def test_starts_as_novice():
    model = MasteryModel()
    assert model.mastery("algebra") == 0.0
    assert model.scaffolding_level("algebra") is ScaffoldingLevel.NOVICE
    assert model.max_hint_depth("algebra") == 3


def test_unassisted_success_grows_mastery_and_fades_scaffolding():
    model = MasteryModel()
    for _ in range(10):
        model.record_attempt("algebra", correct=True, first_attempt=True, hints_used=0)
    assert model.mastery("algebra") > 0.8
    assert model.scaffolding_level("algebra") is ScaffoldingLevel.PROFICIENT
    assert model.max_hint_depth("algebra") == 1


def test_assisted_success_counts_less_than_unassisted():
    assisted, unassisted = MasteryModel(), MasteryModel()
    for _ in range(5):
        assisted.record_attempt("c", correct=True, first_attempt=False, hints_used=2)
        unassisted.record_attempt("c", correct=True, first_attempt=True, hints_used=0)
    assert assisted.mastery("c") < unassisted.mastery("c")


def test_failure_lowers_mastery():
    model = MasteryModel()
    model.record_attempt("c", correct=True, first_attempt=True, hints_used=0)
    before = model.mastery("c")
    model.record_attempt("c", correct=False, first_attempt=True, hints_used=0)
    assert model.mastery("c") < before
