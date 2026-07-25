import MaiaCharacter from "./MaiaCharacter";
import { Card } from "./ui";
import { momentCopy, type MomentKind } from "@/lib/design/moments";

/**
 * A checked milestone. Maia animates here because this is one of the two
 * places she is genuinely live, and she is the largest she ever gets.
 *
 * The colour is deliberately not a subject accent: this band reports the
 * learning record, not a topic, so it takes the record's verified green
 * (#137638 on #e7f6ec, 5.1:1) the same way the unaided-transfer stat tile
 * does. Passing accent and tint in from the caller, as the brief proposed,
 * would have made a hand-rolled colour the default way to use it.
 */
export default function VerifiedMoment({ kind, className = "" }: { kind: MomentKind; className?: string }) {
  const copy = momentCopy(kind);
  return (
    <Card
      as="section"
      tone="tinted"
      tint="var(--color-correct-soft)"
      accent="var(--color-correct)"
      role="status"
      className={`animate-verified-bloom flex items-center gap-5 px-5 py-4 sm:px-7 ${className}`.trim()}
    >
      {/* Decorative: the two lines beside her already say what happened, and a
          screen reader reading the pose as well would only add noise. */}
      <MaiaCharacter state="celebrating" animated size="moment" className="shrink-0" />
      <div className="min-w-0">
        <p className="text-micro font-semibold uppercase tracking-[0.08em] text-correct">Verified moment</p>
        <p className="mt-1.5 text-2xl font-semibold tracking-title">{copy.title}</p>
        <p className="mt-1.5 text-body leading-6 text-ink-soft">{copy.evidence}</p>
      </div>
    </Card>
  );
}
