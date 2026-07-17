"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import type { ChatMessage, MaiaResponse } from "@/lib/api-types";
import MaiaCharacter from "./MaiaCharacter";

/** A message another component asks the panel to send to Maia. */
export interface MaiaOutbox {
  /** Monotonic id so the same text can be sent twice. */
  id: number;
  text: string;
  /** The lesson step that produced the message. */
  stepId: string;
}

const MAX_MAIA_MESSAGE_LENGTH = 2_000;
type UiMessage = ChatMessage & { id: string };

export default function MaiaPanel({
  sessionId,
  stepId,
  sessionVersion,
  onSessionVersion,
  outbox,
  initialMessages = [],
}: {
  sessionId: string;
  stepId: string;
  sessionVersion: number;
  onSessionVersion: (version: number) => void;
  outbox: MaiaOutbox | null;
  initialMessages?: ChatMessage[];
}) {
  const [messages, setMessages] = useState<UiMessage[]>(() => initialMessages.map((message, index) => ({ ...message, id: `${sessionId}:initial:${index}` })));
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [deliverySource, setDeliverySource] = useState<MaiaResponse["source"] | null>(null);
  const [resolvedModel, setResolvedModel] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [atLiveEdge, setAtLiveEdge] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastOutboxId = useRef(0);
  const requestController = useRef<AbortController | null>(null);
  const requestScope = useRef(`${sessionId}:${stepId}`);
  const sendInFlight = useRef(false);

  useLayoutEffect(() => {
    requestScope.current = `${sessionId}:${stepId}`;
    requestController.current?.abort();
    return () => requestController.current?.abort();
  }, [sessionId, stepId]);

  const send = useCallback(
    (text: string) => {
      const message = text.trim();
      if (!message || sendInFlight.current) return false;
      sendInFlight.current = true;
      setMobileOpen(true);
      const scope = `${sessionId}:${stepId}`;
      setStreaming(true);
      setDeliverySource(null);
      setRetryMessage(null);
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "user", content: message },
        { id: crypto.randomUUID(), role: "assistant", content: "" },
      ]);

      const setLastAssistantMessage = (content: string) =>
        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = { ...next[next.length - 1], role: "assistant", content };
          return next;
        });

      void (async () => {
        try {
          const controller = new AbortController();
          requestController.current = controller;
          const res = await fetch(`/api/sessions/${sessionId}/maia`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message,
              expectedStepId: stepId,
              expectedVersion: sessionVersion,
              idempotencyKey: crypto.randomUUID(),
            }),
            signal: controller.signal,
          });
          if (res.status === 429) {
            // The server explains WHY (burst pause vs conversation cap).
            const data = (await res.json().catch(() => null)) as {
              error?: string;
            } | null;
            setLastAssistantMessage(
              data?.error ?? "Maia needs a moment — try again shortly.",
            );
            setRetryMessage(message);
            return;
          }
          if (!res.ok) {
            throw new Error(`Maia request failed (${res.status})`);
          }
          const delivery = (await res.json()) as MaiaResponse;
          if (requestScope.current !== scope) {
            setLastAssistantMessage("The lesson moved to a new step, so I stopped that reply.");
            return;
          }
          onSessionVersion(delivery.sessionVersion);
          setDeliverySource(delivery.source);
          setResolvedModel(delivery.resolvedModel ?? null);
          setLastAssistantMessage(delivery.turn.message);
        } catch (error) {
          const cancelled = error instanceof DOMException && error.name === "AbortError";
          const stale = requestScope.current !== scope;
          let failureMessage = "Maia couldn't answer just now — try again in a moment.";
          if (stale) failureMessage = "The lesson moved to a new step, so I stopped that reply.";
          else if (cancelled) failureMessage = "That request was cancelled. Your lesson state did not change.";
          setLastAssistantMessage(failureMessage);
          if (!stale) setRetryMessage(message);
        } finally {
          requestController.current = null;
          sendInFlight.current = false;
          setStreaming(false);
        }
      })();

      return true;
    },
    [onSessionVersion, sessionId, sessionVersion, stepId],
  );

  // Programmatic sends from the lesson player ("ask Maia why",
  // self-explanations).
  useEffect(() => {
    if (!outbox || outbox.id <= lastOutboxId.current) return;
    if (outbox.stepId !== stepId) {
      lastOutboxId.current = outbox.id;
      return;
    }
    if (!streaming) {
      if (send(outbox.text)) lastOutboxId.current = outbox.id;
    }
  }, [outbox, send, stepId, streaming]);

  useEffect(() => {
    if (atLiveEdge) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [atLiveEdge, messages]);

  const updateLiveEdge = () => {
    const element = scrollRef.current;
    if (!element) return;
    setAtLiveEdge(element.scrollHeight - element.scrollTop - element.clientHeight < 48);
  };

  return (
    <aside
      aria-label="Maia, your tutor"
      className="min-w-0 rounded-xl border border-ink/10 bg-surface shadow-sm lg:sticky lg:top-6"
    >
      <div className="flex items-center gap-2 border-b border-ink/10 px-4 py-3">
        <MaiaCharacter state={streaming ? "thinking" : "attentive"} className="h-10 w-9 shrink-0" />
        <div>
          <p className="text-sm font-semibold leading-tight">Maia</p>
          <p className="text-xs text-ink-soft">Socratic guidance for this step</p>
        </div>
        <button type="button" aria-expanded={mobileOpen} aria-controls="maia-conversation" onClick={() => setMobileOpen((open) => !open)} className="ml-auto min-h-11 rounded-lg px-3 text-sm font-semibold text-lapis-dark lg:hidden">{mobileOpen ? "Close" : "Ask Maia"}</button>
      </div>
      <div id="maia-conversation" className={`${mobileOpen ? "flex" : "hidden"} h-[28rem] flex-col lg:flex lg:h-[32rem]`}>
        <details className="border-b border-ink/10 px-4 py-2 text-xs text-ink-soft">
          <summary className="cursor-pointer font-medium">Tutor status</summary>
          <p className="mt-2">{deliverySource === "openai-codex" ? resolvedModel ?? "GPT-5.6 Terra via Codex" : deliverySource === "openai-api" ? "OpenAI API" : deliverySource === "deterministic" ? "Verified deterministic guidance" : "Grounded tutor ready"}</p>
        </details>
        <div
          ref={scrollRef}
          onScroll={updateLiveEdge}
          role="log"
          aria-live="polite"
          aria-label="Conversation with Maia"
          className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
        >
        {messages.length === 0 && (
          <div className="text-sm text-ink-soft">
            <p>
              Stuck? Tell me what you tried, or what feels confusing. I can see
              the step you&apos;re on.
            </p>
            <div className="mt-3 flex flex-col items-start gap-2">
              {["Give me a nudge", "What is this step really asking?"].map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => send(suggestion)}
                    className="rounded-full border border-lapis/30 bg-lapis-soft px-3 py-1 text-xs text-lapis-dark transition hover:border-lapis"
                  >
                    {suggestion}
                  </button>
                ),
              )}
            </div>
          </div>
        )}
        {messages.map((message, i) => (
          <div
            key={message.id}
            className={`max-w-[90%] rounded-xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
              message.role === "user"
                ? "ml-auto bg-lapis text-white"
                : "bg-paper text-ink"
            }`}
          >
            {message.content ||
              (streaming && i === messages.length - 1 ? "…" : "")}
          </div>
        ))}
        {!atLiveEdge && <button type="button" onClick={() => { setAtLiveEdge(true); scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }} className="sticky bottom-0 mx-auto block rounded-full border border-ink/10 bg-surface px-3 py-1.5 text-xs font-semibold text-lapis-dark shadow-md">Jump to latest ↓</button>}
        </div>

        <form
        onSubmit={(e) => {
          e.preventDefault();
          if (send(input)) setInput("");
        }}
        className="border-t border-ink/10 p-3"
      >
        {retryMessage && !streaming && <button type="button" onClick={() => send(retryMessage)} className="mb-2 text-xs font-semibold text-lapis-dark underline underline-offset-4">Retry last question</button>}
        <div className="mb-2 flex items-center justify-between gap-3 text-xs text-ink-soft">
          <span id="maia-message-help">Ask about your reasoning, not for the final answer.</span>
          <span className="shrink-0 font-mono tabular-nums">{input.length}/{MAX_MAIA_MESSAGE_LENGTH}</span>
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={streaming}
            maxLength={MAX_MAIA_MESSAGE_LENGTH}
            placeholder="Ask Maia…"
            aria-label="Message for Maia"
            aria-describedby="maia-message-help"
            className="min-w-0 flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none transition focus:border-lapis disabled:opacity-60"
          />
          {streaming ? <button type="button" onClick={() => requestController.current?.abort()} className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-medium">Cancel</button> : <button type="submit" disabled={!input.trim()} className="rounded-lg bg-lapis px-4 py-2 text-sm font-medium text-white transition hover:bg-lapis-dark disabled:opacity-50">Send</button>}
        </div>
        </form>
      </div>
    </aside>
  );
}
