/**
 * The five-step type scale. Arbitrary text-[Xrem] classes are banned; the
 * mapping below is the deterministic migration rule applied by every surface
 * task. Where role and table disagree, role wins and the reviewer decides.
 */

export const TYPE_SCALE = {
  micro: "text-micro",
  label: "text-label",
  "body-sm": "text-body-sm",
  body: "text-body",
  lead: "text-lead",
} as const;

/** Old arbitrary rem value -> replacement utility. */
export const LEGACY_SIZE_MAP: Record<string, string> = {
  "0.56rem": "text-micro",
  "0.6rem": "text-micro",
  "0.62rem": "text-micro",
  "0.64rem": "text-micro",
  "0.65rem": "text-micro",
  "0.66rem": "text-micro",
  "0.67rem": "text-micro",
  "0.68rem": "text-label",
  "0.7rem": "text-label",
  "0.78rem": "text-body-sm",
  "0.8rem": "text-body-sm",
  "0.82rem": "text-body-sm",
  "0.84rem": "text-body-sm",
  "0.95rem": "text-body",
  "1.02rem": "text-lead",
  "1.7rem": "text-3xl",
};
