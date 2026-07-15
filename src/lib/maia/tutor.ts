/**
 * Maia's voice: the LLM interaction layer (server-only).
 *
 * Deliberately thin. All pedagogy-critical state (what is true, what
 * the learner did, how much help is allowed) is decided by the engine
 * and injected via the prompt; the model only converses.
 */

import Anthropic from "@anthropic-ai/sdk";

import type { LearnerSession } from "../engine/session";
import { log } from "../server/log";
import { revealsAnswer } from "./leak";
import { buildSystemPrompt } from "./prompt";

const MODEL = "claude-opus-4-8";
const MAX_TOKENS = 1024;

const OFFLINE_NOTICE =
  "[Maia is offline: no ANTHROPIC_API_KEY configured. " +
  "Falling back to the step's hint ladder.]";

let client: Anthropic | null = null;

export function maiaAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function getClient(): Anthropic {
  client ??= new Anthropic();
  return client;
}

/**
 * One tutoring turn, grounded in the current lesson state.
 * Returns a text stream for the client plus a promise that resolves
 * once the full reply has been persisted to the session history.
 */
export function maiaRespond(
  session: LearnerSession,
  learnerMessage: string,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  if (!maiaAvailable()) {
    const hint = session.requestHint();
    const reply = hint
      ? `${OFFLINE_NOTICE}\n${hint}`
      : `${OFFLINE_NOTICE}\nNo more hints are available at your mastery ` +
        "level — trust your reasoning and try the step.";
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(reply));
        controller.close();
      },
    });
  }

  session.chatHistory.push({ role: "user", content: learnerMessage });
  const stream = getClient().messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    thinking: { type: "adaptive" },
    system: buildSystemPrompt(session.snapshot()),
    messages: session.chatHistory.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  return new ReadableStream({
    async start(controller) {
      stream.on("text", (delta) => controller.enqueue(encoder.encode(delta)));
      try {
        const message = await stream.finalMessage();
        const reply = message.content
          .filter((block) => block.type === "text")
          .map((block) => block.text)
          .join("")
          .trim();
        session.chatHistory.push({ role: "assistant", content: reply });
        session.log("maia_turn", { learner: learnerMessage });
        // Token + cache instrumentation: cacheRead > 0 on follow-up
        // turns confirms the persona block is riding the prompt cache.
        session.log("maia_usage", {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
          cacheReadTokens: message.usage.cache_read_input_tokens ?? 0,
          cacheWriteTokens: message.usage.cache_creation_input_tokens ?? 0,
        });
        log.info("maia_turn_completed", {
          sessionId: session.sessionId,
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
          cacheReadTokens: message.usage.cache_read_input_tokens ?? 0,
        });
        // Instrumentation, not a block: numeric steps whose answer also
        // appears in the prompt can trigger false positives, so flagged
        // turns are logged for audit rather than redacted.
        if (!session.complete && revealsAnswer(session.currentStep, reply)) {
          session.log("maia_possible_leak", {
            stepId: session.currentStep.id,
            reply,
          });
          log.warn("maia_possible_leak", {
            sessionId: session.sessionId,
            stepId: session.currentStep.id,
          });
        }
        controller.close();
      } catch (error) {
        // Drop the unanswered user turn so history stays consistent.
        session.chatHistory.pop();
        controller.error(error);
      }
    },
  });
}
