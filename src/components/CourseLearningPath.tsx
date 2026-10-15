"use client";

import Link from "next/link";
import { useId, type CSSProperties } from "react";
import { subjectColor, subjectDeep, subjectTint } from "@/lib/curriculum/subjects";
import styles from "./CourseLearningPath.module.css";

export type CourseLearningPathNode = {
  id: string;
  title: string;
  description?: string;
  /** The caller supplies observed progress and real access restrictions. */
  state: "done" | "current" | "ahead" | "locked";
  href?: string;
  onSelect?: () => void;
  actionLabel?: string;
  meta?: string;
  disabled?: boolean;
  kind?: "lesson" | "challenge" | "review";
};

export type CourseLearningPathProps = {
  nodes: readonly CourseLearningPathNode[];
  subject?: string;
  accent?: string;
  tint?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  justCompletedId?: string | null;
};

const positions = [28, 18, 32, 42, 30, 18];
const statusLabels = { done: "Completed", current: "Up next", ahead: "Available", locked: "Locked" } as const;

/** Shared visual grammar; each course runtime continues to own its sequence and progress. */
export default function CourseLearningPath({
  nodes, subject = "", accent = subjectColor(subject), tint = subjectTint(subject),
  eyebrow = "Course", title = "Your learning path", description, justCompletedId,
}: CourseLearningPathProps) {
  const headingId = useId();
  const surfaceStyle = { "--path-accent": accent, "--path-tint": tint, "--path-edge": subjectDeep(subject) } as CSSProperties;
  return (
    <section className={styles.path} style={surfaceStyle} aria-labelledby={headingId}>
      <header className={styles.header}>
        <span className={styles.headerMark} aria-hidden="true">↗</span>
        <div><p className={styles.eyebrow}>{eyebrow}</p><h2 id={headingId} className={styles.title}>{title}</h2>{description && <p className={styles.description}>{description}</p>}</div>
      </header>
      <ol role="list" className={styles.steps}>
        {nodes.map((node, index) => {
          const position = positions[index % positions.length];
          const nextPosition = positions[(index + 1) % positions.length];
          const current = node.state === "current";
          const unavailable = node.state === "locked" || node.disabled;
          const interactive = !unavailable && Boolean(node.href || node.onSelect);
          const arrived = node.id === justCompletedId && node.state === "done";
          const kind = node.kind ?? "lesson";
          const kindTotal = nodes.filter((item) => (item.kind ?? "lesson") === kind).length;
          const kindIndex = nodes.slice(0, index + 1).filter((item) => (item.kind ?? "lesson") === kind).length;
          const label = `${kind === "challenge" ? "Challenge" : kind === "review" ? "Review" : "Lesson"} ${kindIndex} of ${kindTotal}`;
          const accessibleLabel = `${label}: ${node.title}. ${statusLabels[node.state]}${node.meta ? `. ${node.meta}` : ""}`;
          const content = <>
            <span aria-hidden="true" className={`${styles.node} ${arrived ? styles.arrived : ""}`}><span className={styles.nodeFace}>{node.state === "done" ? <CheckMark /> : node.state === "locked" ? <LockMark /> : node.kind === "challenge" ? <span className={styles.challengeMark}>✦</span> : index + 1}</span></span>
            <span className={styles.lesson}>
              <span className={styles.lessonMeta}>{node.meta ?? (current ? "Up next" : label)}</span>
              <span className={styles.lessonTitle}>{node.title}</span>
              {current && node.description && <span className={styles.lessonDescription}>{node.description}</span>}
              {current && interactive && <span aria-hidden="true" className={styles.start}>{node.actionLabel ?? "Start lesson"}<span>→</span></span>}
              {node.state === "done" && <span className={styles.completed}>{interactive ? "Completed · revisit" : "Completed"}</span>}
              {node.state === "locked" && <span className={styles.lockedLabel}>Locked</span>}
            </span>
          </>;
          return (
            <li key={node.id} className={styles.step} data-state={node.state} style={{ "--node-x": `${position}%` } as CSSProperties}>
              {index < nodes.length - 1 && <svg aria-hidden="true" className={styles.connector} viewBox="0 0 100 100" preserveAspectRatio="none"><path d={`M ${position} 0 C ${position} 54, ${nextPosition} 46, ${nextPosition} 100`} className={node.state === "done" ? styles.walkedRail : styles.rail} vectorEffect="non-scaling-stroke" /></svg>}
              {node.href && !unavailable ? <Link className={styles.action} href={node.href} aria-label={accessibleLabel} aria-current={current ? "step" : undefined}>{content}</Link> : node.onSelect && !unavailable ? <button type="button" className={styles.action} onClick={node.onSelect} aria-label={accessibleLabel} aria-current={current ? "step" : undefined}>{content}</button> : <div className={styles.action} aria-label={accessibleLabel} aria-disabled={unavailable || undefined}>{content}</div>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
function CheckMark() { return <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function LockMark() { return <svg width="25" height="25" viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" /><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
