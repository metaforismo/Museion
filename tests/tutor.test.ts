import { describe, expect, it } from "vitest";

import { getLesson } from "@/lib/content";
import { LearnerSession } from "@/lib/engine/session";
import type {
  TutorProvider,
  TutorProviderResult,
  TutorTurn,
} from "@/lib/maia/contracts";
import { maiaRespond } from "@/lib/maia/tutor";

function result(turn: TutorTurn): TutorProviderResult {
  return {
    turn,
    requestedModel: "gpt-5.6",
    resolvedModel: "gpt-5.6-sol",
    responseId: "resp_test",
    usage: { inputTokens: 10, outputTokens: 5, cachedInputTokens: 0 },
  };
}

class FakeProvider implements TutorProvider {
  readonly id = "fake";
  calls = 0;

  constructor(private readonly turns: TutorTurn[], private readonly live = true) {}

  available(): boolean {
    return this.live;
  }

  async generate(): Promise<TutorProviderResult> {
    const turn = this.turns[Math.min(this.calls, this.turns.length - 1)];
    this.calls += 1;
    return result(turn);
  }
}

const safeTurn: TutorTurn = {
  message: "Which operation would preserve equality on both sides?",
  pedagogicalMove: "ask-probing-question",
  uiActions: [],
};

function session(): LearnerSession {
  return new LearnerSession(getLesson("linear-equations-intro")!);
}

describe("Maia pre-delivery gate", () => {
  it("repairs one leaking candidate before persisting or delivering", async () => {
    const provider = new FakeProvider([
      { ...safeTurn, message: "The answer is 6." },
      safeTurn,
    ]);
    const learner = session();

    const delivery = await maiaRespond(learner, "Tell me", provider);

    expect(provider.calls).toBe(2);
    expect(delivery).toMatchObject({ source: "openai-api", repaired: true });
    expect(delivery.turn.message).toBe(safeTurn.message);
    expect(learner.chatHistory.map((message) => message.content)).not.toContain(
      "The answer is 6.",
    );
  });

  it("falls back when the repaired candidate is still unsafe", async () => {
    const provider = new FakeProvider([
      { ...safeTurn, message: "The answer is 6." },
    ]);
    const learner = session();

    const delivery = await maiaRespond(learner, "Tell me", provider);

    expect(provider.calls).toBe(2);
    expect(delivery.source).toBe("deterministic");
    expect(delivery.turn.message).not.toContain("The answer is 6");
    expect(learner.events.filter((event) => event.kind === "maia_turn_rejected"))
      .toHaveLength(2);
  });

  it("rejects model actions outside the runtime-issued target allow-list", async () => {
    const provider = new FakeProvider([
      {
        ...safeTurn,
        uiActions: [{ kind: "highlight", targetId: "answer", text: null }],
      },
    ]);

    const delivery = await maiaRespond(session(), "Help", provider);

    expect(delivery.source).toBe("deterministic");
  });

  it("uses deterministic guidance without calling an unavailable provider", async () => {
    const provider = new FakeProvider([safeTurn], false);

    const delivery = await maiaRespond(session(), "Help", provider);

    expect(provider.calls).toBe(0);
    expect(delivery.source).toBe("deterministic");
  });

  it("does not consume a hint after the learner has solved the step", async () => {
    const learner = session();
    learner.submitAnswer("6");
    const delivery = await maiaRespond(
      learner,
      "Here is why it works",
      new FakeProvider([safeTurn], false),
    );

    expect(delivery.turn.pedagogicalMove).toBe("request-self-explanation");
    expect(learner.revealedHints()).toEqual([]);
  });

  it("rejects a delayed tutor result when the session version changes", async () => {
    let release!: (value: TutorProviderResult) => void;
    const delayed: TutorProvider = {
      id: "delayed",
      available: () => true,
      generate: () => new Promise((resolve) => { release = resolve; }),
    };
    const learner = session();
    const pending = maiaRespond(learner, "Help", delayed);
    learner.submitAnswer("2");
    release(result(safeTurn));

    await expect(pending).rejects.toThrow(/Session changed/);
    expect(learner.chatHistory).toEqual([]);
  });
});
