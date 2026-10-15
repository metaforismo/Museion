/**
 * The verified replay on `/judge` runs one fixed artifact: the binary-search
 * lesson, which is Computer Science. The canvas accent and the shell's zone
 * wash both derive their colour from this one name (through `subjectColor()`
 * and friends), so the two surfaces cannot drift onto different subjects.
 *
 * A generated course (`/learn/<runId>`) declares no subject; callers pass an
 * empty string there and the palette resolves its default pair.
 *
 * This constant lives alone so the app shell can import it without pulling
 * the judge contracts (zod, compiler schemas) into every page's bundle.
 */
export const JUDGE_SAMPLE_SUBJECT = "Computer Science";
