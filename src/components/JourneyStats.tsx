import { GraduationScrollIcon, Idea01Icon, LibraryIcon, Target01Icon } from "@hugeicons/core-free-icons";

import { StatTile } from "@/components/ui";
import type { DashboardSnapshot } from "@/lib/dashboard";

/**
 * The record's own colours. These tiles count recorded work, so they may not
 * borrow a subject accent — violet here would read as Computer Science. Three
 * report activity; the unaided transfer is the one observation the learner
 * produced without help, so it alone carries the verified green.
 */
const JOURNEY_TILES = [
  { key: "lessonsCompleted", label: "Lessons completed", icon: GraduationScrollIcon, accent: "var(--color-lapis)", tint: "var(--color-lapis-soft)" },
  { key: "coursesCompleted", label: "Courses finished", icon: LibraryIcon, accent: "var(--color-lapis)", tint: "var(--color-lapis-soft)" },
  { key: "conceptsObserved", label: "Concepts observed", icon: Idea01Icon, accent: "var(--color-lapis)", tint: "var(--color-lapis-soft)" },
  { key: "unassistedTransfers", label: "Unaided transfers", icon: Target01Icon, accent: "var(--color-correct)", tint: "var(--color-correct-soft)" },
] as const satisfies readonly { key: keyof DashboardSnapshot["journey"]; label: string; icon: typeof LibraryIcon; accent: string; tint: string }[];

/** Static column classes per visible-tile count — Tailwind cannot see a computed name. */
const COLUMNS = ["", "sm:grid-cols-1", "sm:grid-cols-2", "sm:grid-cols-3", "sm:grid-cols-4"] as const;

/**
 * The recorded counts, arriving by count-up (real values only — the
 * animation approaches the record from below and lands on it exactly). One
 * grid for every surface that reports the journey, so the dashboard and the
 * evidence page cannot drift into two different readings of the same record.
 *
 * Only counts above zero render. A recorded 0 is honest, but these tiles
 * report work that happened, and a row of zeros is noise dressed as record —
 * the surfaces already gate the whole section on any activity, so what this
 * trims is the tiles the record cannot yet fill.
 */
export default function JourneyStats({ journey }: { journey: DashboardSnapshot["journey"] }) {
  const tiles = JOURNEY_TILES.filter((tile) => journey[tile.key] > 0);
  if (tiles.length === 0) return null;
  return (
    <div className={`grid grid-cols-2 gap-3 ${COLUMNS[tiles.length]}`}>
      {tiles.map((tile) => (
        <StatTile
          key={tile.key}
          label={tile.label}
          value={journey[tile.key]}
          icon={tile.icon}
          accent={tile.accent}
          tint={tile.tint}
        />
      ))}
    </div>
  );
}
