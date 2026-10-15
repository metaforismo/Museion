"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import type { ChatMessage, MaiaResponse } from "@/lib/api-types";
import MaiaCharacter from "./MaiaCharacter";
import type { LabActivity } from "@/lib/maia/activity";
import { browserDictationAvailable, type DictationEnvironment } from "@/lib/client/dictation";
import styles from "./lesson-workspace.module.css";
import { useMaiaGuidance } from "@/lib/client/use-maia-guidance";
import { tutorDeliveryMatchesScope, type MaiaGuidance, type MaiaGuidanceScope } from "@/lib/maia/proactive";
import type { TutorUiAction } from "@/lib/maia/contracts";

/** A message another component asks the panel to send to Maia. */
export interface MaiaOutbox {
  /** Monotonic id so the same text can be sent twice. */
  id: number;
  text: string;
  /** The lesson step that produced the message. */
  stepId: string;
}

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
  onerror: ((event: { error?: string }) => void) | null;
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
 * transmits it. Renders nothing when the API, page policy, or permission
 * disallows it.
 */
function useSpeechDictation(onTranscript: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognition = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    let active = true;
    let permission: PermissionStatus | null = null;
    const available = browserDictationAvailable({ isSecureContext: window.isSecureContext, recognizerAvailable: speechRecognizer() !== null, document: document as unknown as DictationEnvironment["document"] });
    const frame = requestAnimationFrame(() => setSupported(available && permission?.state !== "denied"));
    if (available && navigator.permissions?.query) {
      void navigator.permissions.query({ name: "microphone" as PermissionName }).then((status) => {
        if (!active) return;
        permission = status;
        setSupported(status.state !== "denied");
        status.onchange = () => { if (active) setSupported(status.state !== "denied"); };
      }).catch(() => { /* The verified page policy remains authoritative when permission queries are unsupported. */ });
    }
    return () => {
      active = false;
      if (permission) permission.onchange = null;
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
    if (!supported || !Recognizer || recognition.current) return;
    setError(null);
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
    instance.onerror = (event) => {
      recognition.current = null;
      setListening(false);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") setSupported(false);
      setError("Dictation isn't available right now. You can type your question below.");
    };
    recognition.current = instance;
    setListening(true);
    try {
      instance.start();
    } catch {
      recognition.current = null;
      setListening(false);
      setSupported(false);
      setError("Dictation isn't available right now. You can type your question below.");
    }
  }, [onTranscript, supported]);

  return { supported, listening, error, start, stop };
}

export default function MaiaPanel({
  sessionId,
  stepId,
  sessionVersion,
  onSessionVersion,
  outbox,
  getActivity,
  initialMessages = [],
  proactiveGuidance,
  variantIndex = 0,
  independent = false,
  onUiActions,
  onGuidanceChange,
}: {
  sessionId: string;
  stepId: string;
  sessionVersion: number;
  onSessionVersion: (version: number) => void;
  outbox: MaiaOutbox | null;
  /** Live, unchecked lab state captured at send time so Maia sees the canvas. */
  getActivity?: () => LabActivity | null;
  initialMessages?: ChatMessage[];
  proactiveGuidance?: MaiaGuidance | null;
  variantIndex?: number;
  independent?: boolean;
  onUiActions?: (actions: TutorUiAction[], version: number) => void;
  onGuidanceChange?: (guidance: MaiaGuidance | null) => void;
}) {
  const [messages, setMessages] = useState<UiMessage[]>(() => initialMessages.map((message, index) => ({ ...message, id: `${sessionId}:initial:${index}` })));
  const { guidance, dismiss } = useMaiaGuidance({ sessionId, stepId, variantIndex, sessionVersion, independent }, proactiveGuidance);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [deliverySource, setDeliverySource] = useState<MaiaResponse["source"] | null>(null);
  const [deliveryModel, setDeliveryModel] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [atLiveEdge, setAtLiveEdge] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastOutboxId = useRef(0);
  const requestController = useRef<AbortController | null>(null);
  const requestScope = useRef(`${sessionId}:${stepId}:${variantIndex}`);
  const latestScope = useRef<MaiaGuidanceScope>({ sessionId, stepId, variantIndex, sessionVersion, independent });
  const sendInFlight = useRef(false);
  const dictationBase = useRef("");
  const dictation = useSpeechDictation(
    useCallback((transcript: string) => {
      setInput(`${dictationBase.current}${dictationBase.current && !dictationBase.current.endsWith(" ") ? " " : ""}${transcript}`);
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
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border text-body-sm transition ${
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
    const apply = (matches: boolean) => {
      setIsDesktop(matches);
    };
    const frame = requestAnimationFrame(() => apply(query.matches));
    const onChange = (event: MediaQueryListEvent) => apply(event.matches);
    query.addEventListener("change", onChange);
    return () => {
      cancelAnimationFrame(frame);
      query.removeEventListener("change", onChange);
    };
  }, []);

  useLayoutEffect(() => {
    requestScope.current = `${sessionId}:${stepId}:${variantIndex}`;
    requestController.current?.abort();
    return () => requestController.current?.abort();
  }, [sessionId, stepId, variantIndex]);

  useLayoutEffect(() => { latestScope.current = { sessionId, stepId, variantIndex, sessionVersion, independent }; }, [sessionId, stepId, variantIndex, sessionVersion, independent]);

  useEffect(() => { onGuidanceChange?.(guidance); }, [guidance, onGuidanceChange]);

  useEffect(() => {
    if (!guidance) return;
    const frame = requestAnimationFrame(() => setMobileOpen(true));
    return () => cancelAnimationFrame(frame);
  }, [guidance]);

  const send = useCallback(
    (text: string) => {
      const message = text.trim();
      if (!message || sendInFlight.current) return false;
      sendInFlight.current = true;
      setMobileOpen(true);
      setAtLiveEdge(true);
      const scope = `${sessionId}:${stepId}:${variantIndex}`;
      const assistantId = crypto.randomUUID();
      setStreaming(true);
      setDeliverySource(null);
      setDeliveryModel(null);
      setRetryMessage(null);
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "user", content: message },
        { id: assistantId, role: "assistant", content: "" },
      ]);

      const setAssistant = (content: string) => {
        setMessages((m) => {
          const next = [...m];
          const index = next.findIndex((entry) => entry.id === assistantId);
          if (index >= 0) next[index] = { ...next[index], role: "assistant", content };
          return next;
        });
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
            setAssistant("You're on a newer step now. Ask your question again here.");
            setRetryMessage(message);
            return;
          }
          if (!res.ok) throw new Error(`Maia request failed (${res.status})`);
          const delivery = (await res.json()) as MaiaResponse;
          if (!tutorDeliveryMatchesScope({ sessionId, stepId, variantIndex, sessionVersion }, latestScope.current, delivery.sessionVersion)) {
            setAssistant("The lesson moved to a new step, so I stopped that reply.");
            return;
          }
          latestScope.current = { ...latestScope.current, sessionVersion: delivery.sessionVersion };
          onSessionVersion(delivery.sessionVersion);
          onUiActions?.(delivery.turn.uiActions, delivery.sessionVersion);
          setDeliverySource(delivery.source);
          setDeliveryModel(delivery.resolvedModel ?? null);
          setAssistant(delivery.turn.message);
        } catch (error) {
          const cancelled = error instanceof DOMException && error.name === "AbortError";
          const stale = requestScope.current !== scope;
          let failureMessage = "Maia couldn't answer just now — try again in a moment.";
          if (stale) failureMessage = "The lesson moved to a new step, so I stopped that reply.";
          else if (cancelled) failureMessage = "That question was cancelled. Ask again when you're ready.";
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
    [getActivity, onSessionVersion, onUiActions, sessionId, sessionVersion, stepId, variantIndex],
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
  }, [atLiveEdge, messages, guidance]);

  useLayoutEffect(() => {
    const element = inputRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 180)}px`;
  }, [input, isDesktop, mobileOpen]);

  const updateLiveEdge = () => {
    const element = scrollRef.current;
    if (!element) return;
    setAtLiveEdge(element.scrollHeight - element.scrollTop - element.clientHeight < 56);
  };

  const runtimeLabel =
    deliverySource === "openai-codex" || deliverySource === "openai-api" || deliverySource === "openrouter-free"
      ? "Live reply"
      : deliverySource === "deterministic"
        ? "Lesson guidance"
        : "How Maia helps";

  const mascotState = streaming ? "thinking" : messages.length === 0 ? "curious" : "attentive";

  const composer = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (send(input)) setInput("");
      }}
      className={styles.composer}
    >
      {retryMessage && !streaming && (
        <button type="button" onClick={() => send(retryMessage)} className="mb-2 text-label font-semibold text-lapis-dark underline underline-offset-4">
          Retry last question
        </button>
      )}
      <div className={styles.composerInput}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (send(input)) setInput("");
            }
          }}
          disabled={streaming}
          rows={2}
          placeholder="Share your thinking…"
          aria-label="Message for Maia"
          className={styles.messageInput}
        />
        <div className={styles.composerActions}>
          {micButton}
          {streaming ? (
            <button type="button" onClick={() => requestController.current?.abort()} className="min-h-9 rounded-xl border border-ink/15 bg-surface px-3 text-label font-semibold">Stop</button>
          ) : (
            <button type="submit" aria-label="Send message to Maia" disabled={!input.trim()} className="pressable grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-lg font-medium text-white hover:bg-lapis-dark">↑</button>
          )}
        </div>
      </div>
      {dictation.error && <p role="status" className="mt-2 text-body-sm text-ink-soft">{dictation.error}</p>}
    </form>
  );

  const expanded = isDesktop || mobileOpen;
    return (
      <aside className={styles.companion} aria-label="Maia, your tutor">
        <header className={styles.companionHeader}>
          <div className="min-w-0 flex-1">
            <p className="text-lead font-semibold">Maia</p>
          </div>
          <details className={styles.aboutMaia}>
            <summary aria-label="About Maia">•••</summary>
            <div>
              <p className="font-semibold text-ink">{runtimeLabel}</p>
              <p className="mt-1">{deliverySource === "deterministic" ? "Live tutoring isn’t available right now. You can still use guidance from this lesson." : "Maia helps you reason through the activity. Lesson guidance is authored; live replies are checked before they appear."}</p>
              {deliveryModel && <p className="mt-2 break-words text-label">Tutor connection: {deliverySource === "openrouter-free" ? "OpenRouter free" : deliverySource === "openai-codex" ? "Codex" : "OpenAI API"} · {deliveryModel}</p>}
            </div>
          </details>
          {!isDesktop && <button type="button" className={styles.chatToggle} aria-expanded={expanded} aria-controls="maia-workspace-conversation" onClick={() => setMobileOpen((open) => !open)}>{expanded ? "Hide" : "Ask Maia"}</button>}
        </header>
        {!expanded && guidance && <p className={styles.compactInvitation}>{guidance.invitation}</p>}
        {expanded && <div id="maia-workspace-conversation" className={styles.conversationPane}>
          <div ref={scrollRef} onScroll={updateLiveEdge} className={styles.conversationScroll}>
            <div className={styles.conversationStack}>
              {guidance && <section key={guidance.id} className={styles.authoredGuidance} aria-label="Lesson guidance">
                <button type="button" onClick={dismiss} aria-label="Dismiss lesson guidance" className={styles.dismissGuidance}>×</button>
                <p className={styles.guidanceMessage}>{guidance.message}</p>
              </section>}
              <div role="log" aria-label="Conversation with Maia" aria-busy={streaming} className={styles.messageList}>
                {messages.map((message) => <div key={message.id} className={`${styles.messageRow} ${message.role === "user" ? styles.userRow : ""}`}>
                  <div className={`${styles.messageBubble} ${message.role === "user" ? styles.userBubble : styles.maiaBubble}`}>
                    <span className="sr-only">{message.role === "user" ? "You: " : "Maia: "}</span>
                    {message.content || <span role="status" className={styles.replyPending} aria-label="Maia is preparing a reply"><span /><span /><span /></span>}
                  </div>
                </div>)}
              </div>
              {!atLiveEdge && <button type="button" onClick={() => { setAtLiveEdge(true); scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: reducedMotion ? "instant" : "smooth" }); }} className={styles.jumpLatest}>Latest message ↓</button>}
            </div>
          </div>
          <div className={styles.composerDock}><MaiaCharacter state={mascotState} className={styles.composerCharacter} title="Maia, your tutor" animated={streaming} />{composer}</div>
        </div>}
      </aside>
    );
  }
