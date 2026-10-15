import { useId, type ReactNode } from "react";

import MaiaCharacter from "@/components/MaiaCharacter";
import type { TutorUiAction } from "@/lib/maia/contracts";
import { targetUiActions } from "@/lib/maia/ui-targets";

import styles from "./ActivityTarget.module.css";

/** A tutor may direct attention to a registered surface, never interact with
 * its controls. Focus actions are visual cues and do not steal keyboard focus. */
export default function ActivityTarget({
  as: Tag = "div",
  targetId,
  actions = [],
  label,
  className = "",
  children,
}: {
  as?: "div" | "span";
  targetId: string;
  actions?: readonly TutorUiAction[];
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const id = useId();
  const relevant = targetUiActions(targetId, actions);
  const annotations = [...new Set(relevant.filter((action) => action.kind === "annotate" && action.text).map((action) => action.text!))];
  const marked = relevant.length > 0;
  const outlined = relevant.some((action) => action.kind === "highlight" || action.kind === "focus");
  const pulseOnly = marked && relevant.every((action) => action.kind === "pulse");
  const attentionKey = relevant.map((action) => `${action.kind}:${action.text ?? ""}`).join("|");
  return (
    <Tag
      data-activity-target={targetId}
      data-maia-marked={marked || undefined}
      data-maia-outlined={outlined || undefined}
      data-maia-pulse-only={pulseOnly || undefined}
      data-maia-focus={relevant.some((action) => action.kind === "focus") || undefined}
      className={`${styles.target} ${Tag === "span" ? styles.inline : ""} ${className}`}
      aria-describedby={annotations.length ? `${id}-note` : undefined}
    >
      {children}
      {marked && (
        <span key={attentionKey} className={styles.marker} aria-hidden="true" title={`Maia marked ${label}`}>
          <MaiaCharacter state="curious" className={styles.markerCharacter} />
        </span>
      )}
      {annotations.length > 0 && (
        <span id={`${id}-note`} className={styles.annotation} role="status" aria-live="polite">
          <span className={styles.annotationLabel}>Maia · {label}</span>
          {annotations.map((text) => <span className={styles.annotationText} key={text}>{text}</span>)}
        </span>
      )}
      {marked && !annotations.length && <span className="sr-only" role="status">Maia marked {label}.</span>}
    </Tag>
  );
}
