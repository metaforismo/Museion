/**
 * A small SVG progress ring. Pure presentation — the caller passes real
 * completed/total counts; this never invents progress.
 */
export default function ProgressRing({
  completed,
  total,
  size = 40,
  stroke = 4,
  color = "var(--color-lapis)",
  className,
  centerLabel,
}: {
  completed: number;
  total: number;
  size?: number;
  stroke?: number;
  color?: string;
  className?: string;
  /** Override the default "completed/total" center text (e.g. "72%"). */
  centerLabel?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = total > 0 ? Math.min(1, completed / total) : 0;
  const done = fraction >= 1 && total > 0;
  return (
    <span className={`relative inline-grid place-items-center ${className ?? ""}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-ink/10" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute text-[0.6rem] font-semibold tabular-nums" style={{ color: done ? color : undefined }}>
        {centerLabel ?? (done ? "✓" : `${completed}/${total}`)}
      </span>
    </span>
  );
}
