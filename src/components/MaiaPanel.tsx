"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import type { ChatMessage, MaiaResponse } from "@/lib/api-types";
import MaiaCharacter from "./MaiaCharacter";
import type { LabActivity } from "@/lib/maia/activity";

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

/** Minimal Web Speech surface — lib.dom has no types for the webkit build. */
interface SpeechAlternativeLike { transcript: string }
interface SpeechResultLike { 0: SpeechAlternativeLike; isFinal: boolean }
interface SpeechResultEventLike { resultIndex: number; results: { length: number; [index: number]: SpeechResultLike } }
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechResultEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

function speechRecognizer(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Browser dictation into the composer. Audio goes only through the
 * browser's own speech service; Museion never records, stores, or
 * transmits it. Renders nothing when the API is unavailable.
 */
function useSpeechDictation(onTranscript: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognition = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setSupported(speechRecognizer() !== null));
    return () => {
      cancelAnimationFrame(frame);
      recognition.current?.abort();
    };
  }, []);

  const stop = useCallback(() => {
    recognition.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Recognizer = speechRecognizer();
    if (!Recognizer || recognition.current) return;
    const instance = new Recognizer();
    instance.lang = navigator.language || "en-US";
    instance.interimResults = true;
    instance.continuous = false;
    instance.onresult = (event) => {
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }
      onTranscript(transcript);
    };
    instance.onend = () => {
      recognition.current = null;
      setListening(false);
    };
    instance.onerror = () => {
      recognition.current = null;
      setListening(false);
    };
    recognition.current = instance;
    setListening(true);
    try {
      instance.start();
    } catch {
      recognition.current = null;
      setListening(false);
    }
  }, [onTranscript]);

  return { supported, listening, start, stop };
}

/**
 * Reveal already-validated text one character at a time. This is an
 * honest "stream": the whole reply passed the server leak gate before
 * a single character reached the browser, so nothing unvalidated is
 * shown mid-flight. Reduced motion skips straight to the full text.
 */
function useTypewriter(reducedMotion: boolean) {
  const [reveal, setReveal] = useState<{ id: string; count: number; total: number } | null>(null);
  const start = useCallback(
    (id: string, total: number) => {
      if (reducedMotion || total === 0) {
        setReveal(null);
        return;
      }
      setReveal({ id, count: 0, total });
    },
    [reducedMotion],
  );
  useEffect(() => {
    if (!reveal || reveal.count >= reveal.total) return;
    const stepChars = Math.max(1, Math.round(reveal.total / 90));
    const timer = window.setTimeout(() => {
      setReveal((current) => {
        if (!current) return null;
        const next = Math.min(current.total, current.count + stepChars);
        return next >= current.total ? null : { ...current, count: next };
      });
    }, 16);
    return () => window.clearTimeout(timer);
  }, [reveal]);
  return { reveal, start };
}

export default function MaiaPanel({
  sessionId,
  stepId,
  sessionVersion,
  onSessionVersion,
  outbox,
  getActivity,
  initialMessages = [],
}: {
  sessionId: string;
  stepId: string;
  sessionVersion: number;
  onSessionVersion: (version: number) => void;
  outbox: MaiaOutbox | null;
  /** Live, unchecked lab state captured at send time so Maia sees the canvas. */
  getActivity?: () => LabActivity | null;
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
  const [reducedMotion, setReducedMotion] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  // One rendered variant (spatial vs in-flow) so accessible names stay unique.
  const [isDesktop, setIsDesktop] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastOutboxId = useRef(0);
  const requestController = useRef<AbortController | null>(null);
  const requestScope = useRef(`${sessionId}:${stepId}`);
  const sendInFlight = useRef(false);
  const { reveal, start: startReveal } = useTypewriter(reducedMotion);
  const dictationBase = useRef("");
  const dictation = useSpeechDictation(
    useCallback((transcript: string) => {
      setInput(`${dictationBase.current}${dictationBase.current && !dictationBase.current.endsWith(" ") ? " " : ""}${transcript}`.slice(0, MAX_MAIA_MESSAGE_LENGTH));
    }, []),
  );
  const toggleDictation = () => {
    if (dictation.listening) {
      dictation.stop();
    } else {
      dictationBase.current = input;
      dictation.start();
    }
  };
  const micButton = dictation.supported && !streaming && (
    <button
      type="button"
      aria-pressed={dictation.listening}
      aria-label={dictation.listening ? "Stop dictating" : "Dictate to Maia"}
      title="Uses your browser's dictation service — Museion never stores audio"
      onClick={toggleDictation}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border text-sm transition ${
        dictation.listening
          ? "animate-pulse border-wrong/40 bg-wrong-soft text-wrong"
          : "border-ink/12 text-ink-soft hover:border-lapis/40 hover:text-lapis-dark"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      </svg>
    </button>
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const frame = requestAnimationFrame(() => setReducedMotion(query.matches));
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener("change", onChange);
    return () => {
      cancelAnimationFrame(frame);
      query.removeEventListener("change", onChange);
    };
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const frame = requestAnimationFrame(() => setIsDesktop(query.matches));
    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    query.addEventListener("change", onChange);
    return () => {
      cancelAnimationFrame(frame);
      query.removeEventListener("change", onChange);
    };
  }, []);

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
      const assistantId = crypto.randomUUID();
      setStreaming(true);
      setDeliverySource(null);
      setRetryMessage(null);
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "user", content: message },
        { id: assistantId, role: "assistant", content: "" },
      ]);

      const setAssistant = (content: string, revealIt = false) => {
        setMessages((m) => {
          const next = [...m];
          const index = next.findIndex((entry) => entry.id === assistantId);
          if (index >= 0) next[index] = { ...next[index], role: "assistant", content };
          return next;
        });
        if (revealIt) startReveal(assistantId, content.length);
      };

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
              ...(getActivity?.() ? { activity: getActivity() } : {}),
            }),
            signal: controller.signal,
          });
          if (res.status === 429) {
            const data = (await res.json().catch(() => null)) as { error?: string } | null;
            setAssistant(data?.error ?? "Maia needs a moment — try again shortly.");
            setRetryMessage(message);
            return;
          }
          if (res.status === 409) {
            const resync = (await fetch(`/api/sessions/${sessionId}`).then((r) => (r.ok ? r.json() : null)).catch(() => null)) as { sessionVersion?: number } | null;
            if (typeof resync?.sessionVersion === "number") onSessionVersion(resync.sessionVersion);
            setAssistant("The lesson state moved on — I re-synced. Ask again when ready.");
            setRetryMessage(message);
            return;
          }
          if (!res.ok) throw new Error(`Maia request failed (${res.status})`);
          const delivery = (await res.json()) as MaiaResponse;
          if (requestScope.current !== scope) {
            setAssistant("The lesson moved to a new step, so I stopped that reply.");
            return;
          }
          onSessionVersion(delivery.sessionVersion);
          setDeliverySource(delivery.source);
          setResolvedModel(delivery.resolvedModel ?? null);
          setAssistant(delivery.turn.message, true);
        } catch (error) {
          const cancelled = error instanceof DOMException && error.name === "AbortError";
          const stale = requestScope.current !== scope;
          let failureMessage = "Maia couldn't answer just now — try again in a moment.";
          if (stale) failureMessage = "The lesson moved to a new step, so I stopped that reply.";
          else if (cancelled) failureMessage = "That request was cancelled. Your lesson state did not change.";
          setAssistant(failureMessage);
          if (!stale) setRetryMessage(message);
        } finally {
          requestController.current = null;
          sendInFlight.current = false;
          setStreaming(false);
        }
      })();

      return true;
    },
    [getActivity, onSessionVersion, sessionId, sessionVersion, startReveal, stepId],
  );

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
  }, [atLiveEdge, messages, reveal]);

  const updateLiveEdge = () => {
    const element = scrollRef.current;
    if (!element) return;
    setAtLiveEdge(element.scrollHeight - element.scrollTop - element.clientHeight < 56);
  };

  const runtimeLabel =
    deliverySource === "openai-codex" || deliverySource === "openai-api"
      ? "Live guidance · leak-checked"
      : deliverySource === "deterministic"
        ? "Verified guidance"
        : "Grounded guidance";
  const technicalLabel = deliverySource === "openai-codex" ? resolvedModel ?? "Live model session" : deliverySource === "openai-api" ? "Configured API model" : "Deterministic guidance";

  const SUGGESTIONS = ["Give me a nudge", "What is this step really asking?", "Am I on the right track?"];
  const isRevealing = (id: string) => reveal?.id === id;
  const shown = (m: UiMessage) => (isRevealing(m.id) ? m.content.slice(0, reveal!.count) : m.content);

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant") ?? null;
  const assistantPending = streaming && lastAssistant?.content === "";
  const mascotState = streaming ? "thinking" : messages.length === 0 ? "curious" : "attentive";

  const composer = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (send(input)) setInput("");
      }}
      className="pointer-events-auto"
    >
      {messages.length === 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => send(suggestion)}
              className="rounded-full border border-ink/12 bg-surface/90 px-3 py-1.5 text-xs font-medium text-ink-soft shadow-[var(--shadow-1)] backdrop-blur transition hover:border-lapis/40 hover:text-lapis-dark"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      {retryMessage && !streaming && (
        <button type="button" onClick={() => send(retryMessage)} className="mb-2 text-xs font-semibold text-lapis-dark underline underline-offset-4">
          Retry last question
        </button>
      )}
      <div className="rounded-[1.4rem] border border-ink/12 bg-surface p-2 shadow-[var(--shadow-2)] transition focus-within:border-lapis/45">
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
          rows={1}
          placeholder="How can I help your reasoning?"
          aria-label="Message for Maia"
          aria-describedby="maia-message-help"
          className="min-h-10 w-full resize-none bg-transparent px-2 py-1.5 text-sm leading-6 outline-none placeholder:text-ink-soft/70 disabled:opacity-60"
        />
        <div className="flex min-h-9 items-center gap-2 px-1">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${streaming ? "bg-gold" : "bg-correct"}`}
            aria-hidden="true"
            title={runtimeLabel}
          />
          <span className="min-w-0 truncate text-[0.64rem] text-ink-soft">{runtimeLabel}</span>
          <span className="ml-auto shrink-0 font-mono text-[0.62rem] tabular-nums text-ink-soft">{input.length}/{MAX_MAIA_MESSAGE_LENGTH}</span>
          {micButton}
          <button
            type="button"
            aria-expanded={historyOpen}
            aria-label="Conversation history"
            onClick={() => setHistoryOpen((open) => !open)}
            className="hidden h-9 w-9 shrink-0 place-items-center rounded-full border border-ink/12 text-sm text-ink-soft transition hover:border-lapis/40 hover:text-lapis-dark lg:grid"
          >
            ≡
          </button>
          {streaming ? (
            <button type="button" onClick={() => requestController.current?.abort()} className="min-h-9 rounded-xl border border-ink/15 bg-surface px-3 text-xs font-semibold">Stop</button>
          ) : (
            <button type="submit" aria-label="Send message to Maia" disabled={!input.trim()} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-lg font-medium text-white transition hover:-translate-y-0.5 hover:bg-lapis-dark disabled:translate-y-0 disabled:opacity-30">↑</button>
          )}
        </div>
      </div>
      <p id="maia-message-help" className="mt-1.5 text-center text-[0.62rem] text-ink-soft">Answers stay private · the engine checks correctness</p>
    </form>
  );

  // Desktop: Maia is spatial — mascot + latest leak-gated reply as a
  // floating bubble inside the lesson stage, composer beside her, full
  // history in an on-demand drawer. Mobile keeps the in-flow panel. One
  // variant renders at a time so accessible names stay unique.
  if (isDesktop) {
    return (
      <>
        <div className="pointer-events-none fixed bottom-4 left-4 z-30 flex w-[26rem] max-w-[calc(100vw-2rem)] flex-col">
          {/* Maia speaks first: a deterministic, authored opener — no model
              call, nothing to leak — so asking feels lighter (Koji's
              speak-first finding, done honestly). */}
          {messages.length === 0 && !streaming && (
            <div className="pointer-events-auto mb-2.5 ml-16 max-w-[21rem] rounded-2xl rounded-bl-md border border-lapis/15 bg-surface px-4 py-3 text-sm leading-6 text-ink shadow-[var(--shadow-2)] animate-fade-up">
              I&apos;m right here with this step. Commit to a move — if it breaks, I&apos;ll ask you a smaller question, never hand you the answer.
            </div>
          )}
          {(lastAssistant || assistantPending) && (
            <div
              aria-live="polite"
              className="pointer-events-auto mb-2.5 ml-16 max-w-[21rem] whitespace-pre-wrap rounded-2xl rounded-bl-md border border-lapis/15 bg-surface px-4 py-3 text-sm leading-6 text-ink shadow-[var(--shadow-2)] animate-fade-up"
            >
              {assistantPending ? (
                <span className="inline-flex gap-1 py-1" aria-label="Maia is thinking">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-lapis/50 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-lapis/50 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-lapis/50" />
                </span>
              ) : lastAssistant ? (
                <>
                  {shown(lastAssistant)}
                  {isRevealing(lastAssistant.id) && <span className="ml-0.5 inline-block h-4 w-0.5 -translate-y-0.5 animate-pulse bg-lapis align-middle" aria-hidden="true" />}
                </>
              ) : null}
            </div>
          )}
          <div className="flex items-end gap-2.5">
            <MaiaCharacter
              state={mascotState}
              animated
              className="pointer-events-auto h-24 w-20 shrink-0 drop-shadow-[0_10px_18px_rgba(24,33,56,0.18)]"
              title="Maia, your tutor"
            />
            <div className="min-w-0 flex-1">{composer}</div>
          </div>
        </div>

        {historyOpen && (
          <aside
            aria-label="Maia conversation history"
            className="fixed bottom-0 right-0 top-14 z-40 flex w-[25rem] max-w-[92vw] flex-col border-l border-ink/10 bg-surface shadow-[var(--shadow-3)]"
          >
            <header className="flex min-h-14 items-center gap-3 border-b border-ink/8 px-4">
              <p className="font-display text-base font-semibold">Conversation with Maia</p>
              <details className="group relative ml-auto">
                <summary className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-xl text-base tracking-[0.16em] text-ink-soft transition hover:bg-paper hover:text-ink" aria-label="About Maia">•••</summary>
                <div className="absolute right-0 top-11 z-30 w-64 rounded-xl border border-ink/10 bg-surface p-4 text-xs leading-5 text-ink-soft shadow-[var(--shadow-3)]">
                  <p className="font-semibold text-ink">{runtimeLabel}</p>
                  <p className="mt-0.5 font-mono text-[0.64rem]">{technicalLabel}</p>
                  <p className="mt-1">Replies are checked for answer leakage before you see them. Deterministic code still decides correctness.</p>
                </div>
              </details>
              <button type="button" onClick={() => setHistoryOpen(false)} className="min-h-9 rounded-lg px-3 text-sm font-medium text-ink-soft hover:bg-paper hover:text-ink">Close</button>
            </header>
            <div
              ref={scrollRef}
              onScroll={updateLiveEdge}
              role="log"
              aria-label="Conversation with Maia"
              className="relative min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5"
            >
              {messages.length === 0 && <p className="pt-6 text-center text-sm text-ink-soft">No messages yet — ask Maia from the composer beside her.</p>}
              {messages.map((message) => {
                if (message.role === "user") {
                  return (
                    <div key={message.id} className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-lapis px-3.5 py-2.5 text-sm leading-6 text-white shadow-[var(--shadow-1)]">{message.content}</div>
                    </div>
                  );
                }
                return (
                  <div key={message.id} className="flex items-end gap-2">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-lapis-soft/70">
                      <MaiaCharacter state="attentive" className="h-7 w-6" />
                    </span>
                    <div className="max-w-[82%] whitespace-pre-wrap rounded-2xl rounded-bl-md border border-ink/8 bg-paper/70 px-3.5 py-2.5 text-sm leading-6 text-ink">{message.content}</div>
                  </div>
                );
              })}
              {!atLiveEdge && (
                <button
                  type="button"
                  onClick={() => { setAtLiveEdge(true); scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }}
                  className="sticky bottom-1 left-1/2 z-10 -translate-x-1/2 rounded-full border border-ink/10 bg-surface px-3 py-1.5 text-xs font-semibold text-lapis-dark shadow-[var(--shadow-2)]"
                >
                  Jump to latest ↓
                </button>
              )}
            </div>
          </aside>
        )}
      </>
    );
  }

  return (
    <aside
      aria-label="Maia, your tutor"
      className="mt-6 min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-ink/10 bg-surface shadow-[var(--shadow-1)]"
    >
      <header className="relative flex min-h-16 items-center gap-3 border-b border-ink/8 bg-[linear-gradient(180deg,rgba(232,237,252,0.5),transparent)] px-4 py-2.5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-lapis-soft">
          <MaiaCharacter state={streaming ? "thinking" : "attentive"} animated className="h-10 w-9" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-display text-base font-semibold leading-tight tracking-tight">Maia</p>
            <span className={`h-1.5 w-1.5 rounded-full ${streaming ? "animate-pulse bg-gold" : "bg-correct"}`} aria-hidden="true" />
          </div>
          <p className="mt-0.5 truncate text-[0.68rem] text-ink-soft">{streaming ? "thinking with you…" : "asks, never tells"}</p>
        </div>
        <button type="button" aria-expanded={mobileOpen} aria-controls="maia-conversation" onClick={() => setMobileOpen((open) => !open)} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-lapis-dark">{mobileOpen ? "Close" : "Ask Maia"}</button>
      </header>

      <div id="maia-conversation" className={`${mobileOpen ? "flex" : "hidden"} h-[32rem] min-h-0 flex-col`}>
        <div
          ref={scrollRef}
          onScroll={updateLiveEdge}
          role="log"
          aria-live="polite"
          aria-label="Conversation with Maia"
          className="relative min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5"
        >
          {messages.length === 0 && (
            <div className="mx-auto flex max-w-[19rem] flex-col items-center pt-4 text-center text-sm text-ink-soft lg:pt-[9vh]">
              <div className="relative mb-4">
                <span aria-hidden="true" className="absolute -inset-3 rounded-full bg-lapis-soft/70 blur-xl" />
                <MaiaCharacter state="curious" animated className="relative h-24 w-20" />
              </div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">Think it through with Maia</h2>
              <p className="mt-2 leading-6">Tell me where your reasoning feels uncertain. I&apos;ll ask a smaller question — never the answer.</p>
            </div>
          )}

          {messages.map((message, i) => {
            const last = i === messages.length - 1;
            if (message.role === "user") {
              return (
                <div key={message.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-lapis px-3.5 py-2.5 text-sm leading-6 text-white shadow-[var(--shadow-1)]">
                    {message.content}
                  </div>
                </div>
              );
            }
            const text = shown(message);
            const pending = last && streaming && message.content === "";
            return (
              <div key={message.id} className="flex items-end gap-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-lapis-soft/70">
                  <MaiaCharacter state={pending || isRevealing(message.id) ? "thinking" : "attentive"} className="h-7 w-6" />
                </span>
                <div className="max-w-[82%] whitespace-pre-wrap rounded-2xl rounded-bl-md border border-ink/8 bg-paper/70 px-3.5 py-2.5 text-sm leading-6 text-ink">
                  {pending ? (
                    <span className="inline-flex gap-1 py-1" aria-label="Maia is thinking">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-lapis/50 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-lapis/50 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-lapis/50" />
                    </span>
                  ) : (
                    <>
                      {text}
                      {isRevealing(message.id) && <span className="ml-0.5 inline-block h-4 w-0.5 -translate-y-0.5 animate-pulse bg-lapis align-middle" aria-hidden="true" />}
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {!atLiveEdge && (
            <button
              type="button"
              onClick={() => { setAtLiveEdge(true); scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }}
              className="sticky bottom-1 left-1/2 z-10 -translate-x-1/2 rounded-full border border-ink/10 bg-surface px-3 py-1.5 text-xs font-semibold text-lapis-dark shadow-[var(--shadow-2)]"
            >
              Jump to latest ↓
            </button>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (send(input)) setInput("");
          }}
          className="border-t border-ink/8 bg-surface p-3"
        >
          {messages.length === 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  className="rounded-full border border-ink/12 bg-paper/60 px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:border-lapis/40 hover:text-lapis-dark"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          {retryMessage && !streaming && <button type="button" onClick={() => send(retryMessage)} className="mb-2 text-xs font-semibold text-lapis-dark underline underline-offset-4">Retry last question</button>}
          <div className="rounded-[1.15rem] border border-ink/12 bg-surface p-2.5 shadow-[var(--shadow-1)] transition focus-within:border-lapis/45 focus-within:shadow-[var(--shadow-2)]">
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
              placeholder="Ask about your reasoning…"
              aria-label="Message for Maia"
              aria-describedby="maia-message-help"
              className="min-h-12 w-full resize-none bg-transparent px-1 py-0.5 text-sm leading-6 outline-none placeholder:text-ink-soft/70 disabled:opacity-60"
            />
            <div className="mt-1 flex min-h-9 items-center gap-2 border-t border-ink/8 pt-1.5">
              <span className="inline-flex min-w-0 items-center gap-1.5 text-[0.66rem] text-ink-soft">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${streaming ? "bg-gold" : "bg-correct"}`} aria-hidden="true" />
                <span className="truncate">{runtimeLabel}</span>
              </span>
              <span className="ml-auto shrink-0 font-mono text-[0.62rem] tabular-nums text-ink-soft">{input.length}/{MAX_MAIA_MESSAGE_LENGTH}</span>
              {micButton}
              {streaming ? (
                <button type="button" onClick={() => requestController.current?.abort()} className="min-h-9 rounded-xl border border-ink/15 bg-surface px-3 text-xs font-semibold">Stop</button>
              ) : (
                <button type="submit" aria-label="Send message to Maia" disabled={!input.trim()} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-lg font-medium text-white transition hover:-translate-y-0.5 hover:bg-lapis-dark disabled:translate-y-0 disabled:opacity-30">↑</button>
              )}
            </div>
          </div>
          <p id="maia-message-help" className="mt-2 text-center text-[0.62rem] text-ink-soft">Answers stay private · the engine checks correctness</p>
        </form>
      </div>
    </aside>
  );
}
