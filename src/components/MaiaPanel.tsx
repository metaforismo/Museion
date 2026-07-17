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

  const runtimeLabel = deliverySource === "openai-codex"
    ? resolvedModel ?? "GPT-5.6 Terra via Codex"
    : deliverySource === "openai-api"
      ? "OpenAI API"
      : deliverySource === "deterministic"
        ? "Verified guidance"
        : "Grounded guidance";

  return (
    <aside
      aria-label="Maia, your tutor"
      className="mt-6 min-w-0 overflow-hidden rounded-2xl border border-ink/10 bg-surface shadow-sm lg:fixed lg:inset-y-14 lg:right-0 lg:z-20 lg:mt-0 lg:flex lg:w-96 lg:flex-col lg:rounded-none lg:border-y-0 lg:border-r-0 lg:shadow-[-18px_0_55px_rgba(32,55,155,0.07)]"
    >
      <header className="relative flex min-h-16 items-center gap-3 border-b border-ink/8 px-4 py-2.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lapis-soft/75">
          <MaiaCharacter state={streaming ? "thinking" : "attentive"} className="h-9 w-8" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-display text-base font-semibold leading-tight tracking-tight">Maia</p>
            <span className={`h-1.5 w-1.5 rounded-full ${streaming ? "animate-pulse bg-gold" : "bg-correct"}`} aria-hidden="true" />
          </div>
          <p className="mt-0.5 truncate text-[0.68rem] text-ink-soft">Questions for this learning move</p>
        </div>
        <details className="group relative hidden lg:block">
          <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-xl text-lg tracking-[0.16em] text-ink-soft transition hover:bg-paper hover:text-ink" aria-label="About Maia">•••</summary>
          <div className="absolute right-0 top-12 z-30 w-64 rounded-xl border border-ink/10 bg-surface p-4 text-xs leading-5 text-ink-soft shadow-[0_18px_50px_rgba(19,28,49,0.14)]">
            <p className="font-semibold text-ink">{runtimeLabel}</p>
            <p className="mt-1">Replies are checked for answer leakage. Deterministic code still decides correctness.</p>
          </div>
        </details>
        <button type="button" aria-expanded={mobileOpen} aria-controls="maia-conversation" onClick={() => setMobileOpen((open) => !open)} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-lapis-dark lg:hidden">{mobileOpen ? "Close" : "Ask Maia"}</button>
      </header>
      <div id="maia-conversation" className={`${mobileOpen ? "flex" : "hidden"} h-[32rem] min-h-0 flex-col bg-[radial-gradient(circle_at_50%_0%,rgba(231,236,252,0.62),transparent_44%)] lg:flex lg:h-auto lg:flex-1`}>
        <div
          ref={scrollRef}
          onScroll={updateLiveEdge}
          role="log"
          aria-live="polite"
          aria-label="Conversation with Maia"
          className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6"
        >
        {messages.length === 0 && (
          <div className="mx-auto flex max-w-[18rem] flex-col items-center pt-5 text-center text-sm text-ink-soft lg:pt-[12vh]">
            <div className="relative mb-5">
              <span aria-hidden="true" className="absolute inset-2 rounded-full bg-lapis-soft blur-xl" />
              <MaiaCharacter state="curious" className="relative h-20 w-[4.5rem]" />
            </div>
            <h2 className="font-display text-xl font-semibold tracking-tight text-ink">Think it through with Maia</h2>
            <p className="mt-2 leading-6">Tell me where your reasoning feels uncertain. I&apos;ll ask a smaller question without giving away the answer.</p>
            <div className="mt-6 w-full divide-y divide-ink/8 border-y border-ink/8 text-left">
              {["Give me a nudge", "What is this step really asking?"].map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => send(suggestion)}
                    className="flex min-h-11 w-full items-center justify-between gap-3 px-1 text-xs font-medium text-lapis-dark transition hover:pl-2"
                  >
                    <span>{suggestion}</span><span aria-hidden="true">→</span>
                  </button>
                ),
              )}
            </div>
          </div>
        )}
        {messages.map((message, i) => (
          <div key={message.id} className={`flex items-start gap-2.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            {message.role === "assistant" && <MaiaCharacter state={streaming && i === messages.length - 1 ? "thinking" : "attentive"} className="mt-1 h-8 w-7 shrink-0" />}
            <div className={`max-w-[84%] whitespace-pre-wrap text-sm leading-6 ${message.role === "user" ? "rounded-[1.15rem] rounded-br-md bg-lapis px-3.5 py-2.5 text-white" : "pt-1 text-ink"}`}>
              {message.content || (streaming && i === messages.length - 1 ? "…" : "")}
            </div>
          </div>
        ))}
        {!atLiveEdge && <button type="button" onClick={() => { setAtLiveEdge(true); scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }} className="sticky bottom-0 mx-auto block rounded-full border border-ink/10 bg-surface px-3 py-1.5 text-xs font-semibold text-lapis-dark shadow-md">Jump to latest ↓</button>}
        </div>

        <form
        onSubmit={(e) => {
          e.preventDefault();
          if (send(input)) setInput("");
        }}
        className="bg-gradient-to-t from-surface via-surface to-transparent p-4 pt-7"
      >
        {retryMessage && !streaming && <button type="button" onClick={() => send(retryMessage)} className="mb-2 text-xs font-semibold text-lapis-dark underline underline-offset-4">Retry last question</button>}
        <div className="rounded-[1.4rem] border border-ink/12 bg-surface p-3 shadow-[0_12px_36px_rgba(32,55,155,0.10)] transition focus-within:border-lapis/45 focus-within:shadow-[0_14px_42px_rgba(32,55,155,0.14)]">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (send(input)) setInput("");
              }
            }}
            disabled={streaming}
            maxLength={MAX_MAIA_MESSAGE_LENGTH}
            rows={2}
            placeholder="Ask about your reasoning"
            aria-label="Message for Maia"
            aria-describedby="maia-message-help"
            className="min-h-14 w-full resize-none bg-transparent px-1 py-1 text-sm leading-6 outline-none placeholder:text-ink-soft/70 disabled:opacity-60"
          />
          <div className="mt-2 flex min-h-10 items-center gap-2 border-t border-ink/8 pt-2">
            <span className="inline-flex min-w-0 items-center gap-1.5 text-[0.66rem] text-ink-soft"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-correct" aria-hidden="true" /><span className="truncate">{runtimeLabel}</span></span>
            <span className="ml-auto shrink-0 font-mono text-[0.62rem] tabular-nums text-ink-soft">{input.length}/{MAX_MAIA_MESSAGE_LENGTH}</span>
            {streaming ? <button type="button" onClick={() => requestController.current?.abort()} className="min-h-10 rounded-xl border border-ink/15 bg-surface px-3 text-xs font-semibold">Cancel</button> : <button type="submit" aria-label="Send message to Maia" disabled={!input.trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-lg font-medium text-white transition hover:-translate-y-0.5 hover:bg-lapis-dark disabled:translate-y-0 disabled:opacity-30">↑</button>}
          </div>
        </div>
        <p id="maia-message-help" className="mt-2 text-center text-[0.62rem] text-ink-soft">Answers stay private · the engine checks correctness</p>
        </form>
      </div>
    </aside>
  );
}
