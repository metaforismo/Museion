"use client";

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
      <p className="mt-3 text-ink-soft">
        Your progress in the current session is safe on the server — try
        again and you should land right where you were.
      </p>
      <button
        onClick={reset}
        className="mt-8 rounded-lg bg-lapis px-5 py-2.5 font-medium text-white transition hover:bg-lapis-dark"
      >
        Try again
      </button>
    </div>
  );
}
