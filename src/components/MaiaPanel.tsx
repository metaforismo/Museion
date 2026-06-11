"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const NUDGE_MESSAGE = "I just answered wrong and I'm not sure why. Can you help me see it?";

export default function MaiaPanel({
  sessionId,
  nudge,
}: {
  sessionId: string;
  nudge: number;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastNudge = useRef(0);

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || streaming) return;
      setStreaming(true);
      setMessages((m) => [
        ...m,
        { role: "user", content: message },
        { role: "assistant", content: "" },
      ]);
      try {
        const res = await fetch(`/api/sessions/${sessionId}/maia`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });
        if (!res.ok || !res.body) {
          throw new Error(`Maia request failed (${res.status})`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setMessages((m) => {
            const next = [...m];
            const last = next[next.length - 1];
            next[next.length - 1] = {
              ...last,
              content: last.content + chunk,
            };
            return next;
          });
        }
      } catch {
        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = {
            role: "assistant",
            content: "Maia couldn't answer just now — try again in a moment.",
          };
          return next;
        });
      } finally {
        setStreaming(false);
      }
    },
    [sessionId, streaming],
  );

  // "Ask Maia why" from the lesson player.
  useEffect(() => {
    if (nudge > lastNudge.current) {
      lastNudge.current = nudge;
      void send(NUDGE_MESSAGE);
    }
  }, [nudge, send]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  return (
    <aside className="flex h-[36rem] flex-col rounded-xl border border-ink/10 bg-surface shadow-sm lg:sticky lg:top-6">
      <div className="flex items-center gap-2 border-b border-ink/10 px-4 py-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lapis font-display text-sm font-semibold text-white">
          M
        </span>
        <div>
          <p className="text-sm font-semibold leading-tight">Maia</p>
          <p className="text-xs text-ink-soft">
            asks the right questions — never gives the answer
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
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
          className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm outline-none transition focus:border-lapis disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="rounded-lg bg-lapis px-4 py-2 text-sm font-medium text-white transition hover:bg-lapis-dark disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </aside>
  );
}
