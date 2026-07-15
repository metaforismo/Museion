import { canonicalSha256 } from "@/lib/compiler";

import type { RuntimeAction, RuntimeReplayEvent, RuntimeState } from "./contracts";
import { initializeBlock, reduceBlock, type InteractiveBlock } from "./registry";

export async function replayRuntime(
  block: InteractiveBlock,
  actions: RuntimeAction[],
): Promise<{ state: RuntimeState; events: RuntimeReplayEvent[] }> {
  let state = initializeBlock(block);
  const events: RuntimeReplayEvent[] = [];
  for (let index = 0; index < actions.length; index += 1) {
    const action = actions[index];
    const outcome = reduceBlock(block, state, action);
    state = outcome.state;
    events.push({
      schemaVersion: "1.0",
      sequence: index + 1,
      action,
      stateSha256: await canonicalSha256(state),
      accepted: outcome.accepted,
      correct: outcome.correct,
      misconceptionId: outcome.misconceptionId,
    });
  }
  return { state, events };
}
