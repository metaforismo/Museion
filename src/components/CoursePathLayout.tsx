import type { ReactNode } from "react";
import styles from "./CoursePathLayout.module.css";

/** Keeps authored and source-based course overviews on the same responsive canvas. */
export default function CoursePathLayout({ overview, children }: { overview: ReactNode; children: ReactNode }) {
  return <div className={styles.layout}><aside className={styles.overview}>{overview}</aside><div id="learning-path" className={styles.path}>{children}</div></div>;
}
