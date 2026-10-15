import Link from "next/link";
import type { ReactNode } from "react";
import { PUBLIC_DOCUMENTS } from "@/lib/site/public-routes";
import styles from "./PublicPage.module.css";

export type PublicSection = { id: string; title: string; body: ReactNode };

export default function PublicPage({ path, eyebrow, title, intro, notice, sections, children }: {
  path: string; eyebrow: string; title: string; intro: string; notice?: ReactNode; sections: PublicSection[]; children?: ReactNode;
}) {
  return <article className={styles.page}>
    <header className={styles.hero}><p className={styles.eyebrow}>{eyebrow}</p><h1>{title}</h1><p className={styles.intro}>{intro}</p>{notice && <aside className={styles.notice}>{notice}</aside>}</header>
    <div className={styles.layout}>
      <aside className={styles.contents}><nav aria-label="On this page"><p>On this page</p>{sections.map(({ id, title: sectionTitle }) => <a key={id} href={`#${id}`}>{sectionTitle}</a>)}</nav><nav aria-label="More about Museion">{PUBLIC_DOCUMENTS.map(({ href, label }) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>{label}<span aria-hidden="true">↗</span></Link>)}</nav></aside>
      <div className={styles.body}>{sections.map(({ id, title: sectionTitle, body }, index) => <section key={id} id={id}><span className={styles.number} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><h2>{sectionTitle}</h2><div>{body}</div></section>)}{children}<Link href="/signup" className={styles.cta}>Start learning <span aria-hidden="true">→</span></Link></div>
    </div>
  </article>;
}
