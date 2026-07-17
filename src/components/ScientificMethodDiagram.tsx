const METHOD_STEPS = [
  ["01", "Observe", "Attach exact source evidence."],
  ["02", "Predict", "Commit before seeing an explanation."],
  ["03", "Test", "Let code check the response."],
  ["04", "Revise", "Use bounded guidance on the misconception."],
  ["05", "Transfer", "Attempt a nearby problem without help."],
] as const;

export default function ScientificMethodDiagram() {
  return (
    <figure className="relative overflow-hidden rounded-[1.75rem] border border-ink/10 bg-surface p-6 shadow-[0_24px_70px_rgba(19,28,49,0.08)] sm:p-8">
      <div className="flex items-center justify-between gap-4 border-b border-ink/10 pb-5">
        <div>
          <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-lapis-dark">Learning protocol</p>
          <figcaption className="mt-2 text-lg font-semibold">One cycle. Five observable moves.</figcaption>
        </div>
        <span className="method-live-indicator inline-flex items-center gap-2 rounded-full border border-ink/10 bg-paper px-3 py-1.5 text-xs font-medium text-ink-soft">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-correct" />
          Active trace
        </span>
      </div>

      <div className="relative mt-7">
        <svg aria-hidden="true" viewBox="0 0 640 190" className="absolute inset-x-0 top-2 hidden h-48 w-full md:block">
          <path
            className="method-path"
            d="M52 43 C135 43 135 142 224 142 S313 43 406 43 S500 142 588 142"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
        <ol className="relative grid gap-3 md:grid-cols-5 md:gap-2">
          {METHOD_STEPS.map(([number, title, body], index) => (
            <li
              key={title}
              className={`method-step rounded-2xl border border-ink/10 bg-surface p-4 ${index % 2 === 1 ? "md:mt-24" : ""}`}
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[0.65rem] font-semibold text-lapis-dark">{number}</span>
                <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${index === 4 ? "bg-gold" : "bg-lapis"}`} />
              </div>
              <h3 className="mt-5 text-sm font-semibold">{title}</h3>
              <p className="mt-1.5 text-xs leading-5 text-ink-soft">{body}</p>
            </li>
          ))}
        </ol>
      </div>
      <p className="mt-7 border-l-2 border-gold pl-4 text-sm leading-6 text-ink-soft">
        The loop can produce an observation. It cannot, by itself, prove durable mastery.
      </p>
    </figure>
  );
}
