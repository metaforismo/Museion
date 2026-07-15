"use client";

import Link from "next/link";

export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-24 text-center animate-fade-up">
      <h1 className="font-display text-2xl font-semibold">
        Something went wrong on our side
      </h1>
      <p className="mt-3 leading-7 text-ink-soft">
        We could not render this page. Completed server actions may still be
        available, but unsent text or a local-only draft may need to be entered again.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="min-h-11 rounded-lg bg-lapis px-5 py-2.5 font-medium text-white transition hover:bg-lapis-dark"
        >
          Try this page again
        </button>
        <Link href="/" className="inline-flex min-h-11 items-center rounded-lg px-5 py-2.5 font-medium text-lapis-dark hover:bg-lapis-soft">
          Return to lessons
        </Link>
      </div>
    </div>
  );
}
