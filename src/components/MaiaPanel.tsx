"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ChatMessage, MaiaResponse } from "@/lib/api-types";

/** A message another component asks the panel to send to Maia. */
export interface MaiaOutbox {
  /** Monotonic id so the same text can be sent twice. */
  id: number;
  text: string;
}

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
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [deliverySource, setDeliverySource] = useState<MaiaResponse["source"] | null>(null);
  const [resolvedModel, setResolvedModel] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastOutboxId = useRef(0);
  const requestController = useRef<AbortController | null>(null);

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || streaming) return;
      setStreaming(true);
      setDeliverySource(null);
      setMessages((m) => [
        ...m,
        { role: "user", content: message },
        { role: "assistant", content: "" },
      ]);

      const setLastAssistantMessage = (content: string) =>
        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = { role: "assistant", content };
          return next;
        });

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
          return;
        }
        if (!res.ok) {
          throw new Error(`Maia request failed (${res.status})`);
        }
        const delivery = (await res.json()) as MaiaResponse;
        onSessionVersion(delivery.sessionVersion);
        setDeliverySource(delivery.source);
        setResolvedModel(delivery.resolvedModel ?? null);
        setLastAssistantMessage(delivery.turn.message);
      } catch (error) {
        setLastAssistantMessage(
          error instanceof DOMException && error.name === "AbortError"
            ? "That request was cancelled. Your lesson state did not change."
            : "Maia couldn't answer just now — try again in a moment.",
        );
      } finally {
        requestController.current = null;
        setStreaming(false);
      }
    },
    [onSessionVersion, sessionId, sessionVersion, stepId, streaming],
  );

  // Programmatic sends from the lesson player ("ask Maia why",
  // self-explanations).
  useEffect(() => {
    if (outbox && outbox.id > lastOutboxId.current) {
      lastOutboxId.current = outbox.id;
      void send(outbox.text);
    }
  }, [outbox, send]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  return (
    <aside
      aria-label="Maia, your tutor"
      className="flex h-[36rem] min-w-0 flex-col rounded-xl border border-ink/10 bg-surface shadow-sm lg:sticky lg:top-6"
    >
      <div className="flex items-center gap-2 border-b border-ink/10 px-4 py-3">
        <span
          aria-hidden
          className="flex h-7 w-7 items-center justify-center rounded-full bg-lapis font-display text-sm font-semibold text-white"
        >
          M
        </span>
        <div>
          <p className="text-sm font-semibold leading-tight">Maia</p>
          <p className="text-xs text-ink-soft">
            asks the right questions — never gives the answer
          </p>
        </div>
        <span className={`ml-auto rounded-md px-2 py-1 text-[0.68rem] font-semibold ${deliverySource === "deterministic" ? "bg-gold-soft text-ink" : "bg-correct-soft text-correct"}`}>
          {deliverySource === "openai-codex" ? resolvedModel ?? "GPT-5.6 Terra" : deliverySource === "openai-api" ? "OpenAI API" : deliverySource === "deterministic" ? "Verified fallback" : "Grounded tutor"}
        </span>
      </div>

      <div
        ref={scrollRef}
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
                    onClick={() => void send(suggestion)}
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
            key={i}
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
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
          setInput("");
        }}
        className="flex gap-2 border-t border-ink/10 p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={streaming}
          placeholder="Ask Maia…"
          aria-label="Message for Maia"
          className="min-w-0 flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none transition focus:border-lapis disabled:opacity-60"
        />
        {streaming ? <button type="button" onClick={() => requestController.current?.abort()} className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-medium">Cancel</button> : <button type="submit" disabled={!input.trim()} className="rounded-lg bg-lapis px-4 py-2 text-sm font-medium text-white transition hover:bg-lapis-dark disabled:opacity-50">Send</button>}
      </form>
    </aside>
  );
}
