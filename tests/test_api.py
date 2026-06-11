import pytest
from fastapi.testclient import TestClient

from museion.api.app import app


@pytest.fixture
def client():
    return TestClient(app)


def _start(client, lesson_id="linear-equations-intro"):
    response = client.post("/sessions", json={"lesson_id": lesson_id})
    assert response.status_code == 200
    return response.json()["session_id"]


def test_list_lessons(client):
    lessons = client.get("/lessons").json()
    ids = {l["id"] for l in lessons}
    assert {"linear-equations-intro", "fractions-unlike-denominators"} <= ids


def test_full_lesson_flow_over_http(client):
    session_id = _start(client)

    wrong = client.post(f"/sessions/{session_id}/answer", json={"answer": "2"}).json()
    assert wrong["correct"] is False
    assert wrong["misconception_id"] == "subtract-the-coefficient"

    hint = client.post(f"/sessions/{session_id}/hint").json()
    assert hint["granted"] is True

    for answer in ("6", "4", "5", "3"):
        last = client.post(
            f"/sessions/{session_id}/answer", json={"answer": answer}
        ).json()
        assert last["correct"] is True
    assert last["lesson_complete"] is True

    state = client.get(f"/sessions/{session_id}").json()
    assert state["complete"] is True


def test_unknown_lesson_and_session_are_404(client):
    assert client.post("/sessions", json={"lesson_id": "nope"}).status_code == 404
    assert client.get("/sessions/missing").status_code == 404


def test_completed_session_rejects_further_answers(client):
    session_id = _start(client, "fractions-unlike-denominators")
    for answer in ("no", "6", "5/6"):
        client.post(f"/sessions/{session_id}/answer", json={"answer": answer})
    response = client.post(f"/sessions/{session_id}/answer", json={"answer": "x"})
    assert response.status_code == 409
