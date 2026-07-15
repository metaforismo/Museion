import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why Museion is called Museion, who Maia is, and the learning science the platform is built on.",
};

const PRINCIPLES = [
  {
    title: "The answer is the one thing Maia won't say",
    body: "Handing over answers feels like help and works like a crutch: in a field study with ~1,000 students, free chatbot access raised in-session scores by 48% — and lowered unassisted exam scores by 17%. Tutors with a no-reveal guardrail erased that harm. Museion makes the guardrail architectural, not optional.",
  },
  {
    title: "Truth lives in code, not in the model",
    body: "Every answer is graded by the lesson engine against author-verified content. The AI never decides what's mathematically true — it receives the verified solution as context and coaches toward it. Museion cannot get the math wrong the way a chatbot can.",
  },
  {
    title: "Feedback lands on the step, not the result",
    body: "Decades of tutoring research show the gains come from intervening where the reasoning breaks — step by step — not from judging the final answer. Every Museion step has its own verified solution and its own library of known wrong turns.",
  },
  {
    title: "Help fades as mastery grows",
    body: "Scaffolding that helps a beginner holds back an expert. Museion tracks your mastery of each concept and withdraws support as it grows: full hint ladders for novices, a single Socratic nudge once you're proficient — until the questions you'd ask Maia are the ones you ask yourself.",
  },
  {
    title: "What counts is what remains",
    body: "Solving problems with help is performance; what you can do later, alone, is learning. That's why practice mode is unassisted, why assisted successes move your mastery less, and why the lesson's last words invite you back in a few days — without Maia.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:py-24">
      <article className="animate-fade-up">
        <p className="eyebrow">The name and the method</p>
        <h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.04em] sm:text-6xl">
          Why “Museion”?
        </h1>

        <section className="mt-6 space-y-4 text-lg leading-relaxed text-ink">
          <p>
            The <strong>Mouseion of Alexandria</strong> — literally the{" "}
            <em>seat of the Muses</em> — was the greatest house of knowledge of
            the ancient world. Scholars lived, argued, measured the Earth and
            mapped the stars there; its library tried to hold everything
            humanity knew. It wasn&apos;t a museum in the modern sense: it was
            a place where knowledge was <em>worked</em>, not displayed.
          </p>
          <p>
            That&apos;s the pairing this platform is named for: a great house
            of knowledge — and a guide who walks through it beside you.
          </p>
        </section>

        <h2 className="mt-12 font-display text-3xl font-semibold tracking-tight">
          And who is Maia?
        </h2>

        <section className="mt-6 space-y-4 text-lg leading-relaxed">
          <p>
            <strong>Maia</strong> takes her name from{" "}
            <em>maieutics</em> — the Socratic art of midwifery. Socrates said
            he worked like his mother Phaenarete, a midwife: he taught nothing,
            he helped people <em>give birth</em> to ideas they already carried.
            He did it almost entirely with questions.
          </p>
          <p>
            That is precisely what a good tutor does, and precisely what Maia
            is built to do. She can see the exact step you&apos;re on, every
            attempt you&apos;ve made, and the specific misunderstanding your
            last mistake points to — and she answers with the question that
            helps you see it yourself. The final answer is the one thing she
            will never say.
          </p>
          <p className="text-ink-soft">
            There&apos;s a second thread in the name, for the myth-minded: in
            Greek mythology Maia is the eldest of the Pleiades and the mother
            of Hermes — god of communication and the carrier of knowledge
            between worlds. A fitting mother for a tutor.
          </p>
        </section>

        <h2 className="mt-12 font-display text-3xl font-semibold tracking-tight">
          The science we build on
        </h2>
        <div className="mt-8 space-y-3">
          {PRINCIPLES.map((principle, index) => (
            <div
              key={principle.title}
              className={`grid gap-3 rounded-[1.35rem] p-6 sm:grid-cols-[3rem_1fr] ${index % 2 === 0 ? "premium-surface border border-white/80" : "border border-ink/10 bg-paper/50 lg:ml-10"}`}
            >
              <span className="tabular-nums font-mono text-sm font-semibold text-lapis">0{index + 1}</span>
              <div><h3 className="font-display text-lg font-semibold text-lapis-dark">{principle.title}</h3><p className="mt-2 leading-relaxed text-ink-soft">{principle.body}</p></div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            href="/welcome"
            className="rounded-lg bg-lapis px-5 py-2.5 font-medium text-white transition hover:bg-lapis-dark"
          >
            Take the tour
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-ink/15 bg-surface px-5 py-2.5 font-medium transition hover:border-lapis"
          >
            Browse lessons
          </Link>
        </div>
      </article>
    </div>
  );
}
