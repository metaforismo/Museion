/**
 * A horizontal completion meter. The width is clamped to a visible minimum
 * only once there is real progress — a nub of colour at zero would claim work
 * that has not happened.
 */
export default function ProgressRail({
  ratio,
  accent,
  label,
  showValue = true,
}: {
  ratio: number;
  accent: string;
  label?: string;
  showValue?: boolean;
}) {
  const percent = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
  const width = percent === 0 ? 0 : Math.max(4, percent);
  return (
    <div className="flex items-center gap-3">
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10"
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${width}%`, backgroundColor: accent }}
        />
      </div>
      {/* The progressbar already exposes the value; the visible figure is for sighted readers. */}
      {showValue && <span aria-hidden="true" className="text-micro tabular-nums text-ink-soft">{percent}%</span>}
    </div>
  );
}
