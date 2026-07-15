import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-24 text-center animate-fade-up">
      <p className="font-display text-5xl font-semibold text-lapis-dark">404</p>
      <h1 className="mt-4 font-display text-2xl font-semibold">
        This hall of the Museion doesn&apos;t exist
      </h1>
      <p className="mt-3 text-ink-soft">
        The page you&apos;re looking for isn&apos;t in the collection — maybe
        the lesson moved, or the address has a typo.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-lg bg-lapis px-5 py-2.5 font-medium text-white transition hover:bg-lapis-dark"
        >
          Back to the lessons
        </Link>
        <Link
          href="/create"
          className="inline-flex min-h-11 items-center rounded-lg px-5 py-2.5 font-medium text-lapis-dark transition hover:bg-lapis-soft"
        >
          Create from a source
        </Link>
      </div>
    </div>
  );
}
