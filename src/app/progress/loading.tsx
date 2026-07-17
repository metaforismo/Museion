export default function ProgressLoading() {
  return (
    <div role="status" aria-label="Loading learning dashboard" className="mx-auto w-full max-w-7xl animate-pulse px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="flex flex-col gap-5 border-b border-ink/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="h-3 w-20 rounded bg-ink/10" />
          <div className="mt-4 h-10 w-72 rounded bg-ink/10" />
          <div className="mt-4 h-4 max-w-xl rounded bg-ink/5" />
        </div>
        <div className="h-11 w-32 rounded-lg bg-ink/10" />
      </div>
      <div className="grid gap-6 py-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,.6fr)]">
        <div className="rounded-[1.5rem] border border-ink/10 bg-surface p-6 sm:p-8">
          <div className="h-3 w-28 rounded bg-ink/10" />
          <div className="mt-4 h-8 w-80 rounded bg-ink/10" />
          <div className="mt-4 h-4 max-w-lg rounded bg-ink/5" />
          <div className="mt-8 grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((item) => <div key={item} className="h-8 rounded bg-ink/5" />)}
          </div>
          <div className="mt-8 h-16 border-t border-ink/10 bg-ink/5" />
        </div>
        <div className="rounded-[1.5rem] bg-ink p-6">
          <div className="h-3 w-24 rounded bg-white/15" />
          <div className="mt-4 h-7 w-48 rounded bg-white/15" />
          <div className="mt-6 h-32 rounded bg-white/10" />
        </div>
      </div>
      <div className="grid gap-6 border-t border-ink/10 py-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,.75fr)]">
        <div className="rounded-[1.5rem] border border-ink/10 bg-surface p-6">
          <div className="h-8 w-44 rounded bg-ink/10" />
          <div className="mt-6 h-56 bg-ink/5" />
        </div>
        <div className="h-64 rounded-[1.5rem] bg-gold-soft" />
      </div>
      <span className="sr-only">Loading your activity and recommended next step.</span>
    </div>
  );
}
