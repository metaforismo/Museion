"use client";
import Link from "next/link";
import { useRef } from "react";
import styles from "./SiteHeader.module.css";

export default function PublicMenu() {
  const menu = useRef<HTMLDetailsElement>(null);
  const close = () => { if (menu.current) menu.current.open = false; };
  return <details ref={menu} className={styles.menu} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) close(); }} onKeyDown={(event) => { if (event.key === "Escape") { close(); menu.current?.querySelector("summary")?.focus(); } }}>
    <summary aria-label="Explore Museion"><span aria-hidden="true"><i /><i /></span></summary>
    <nav aria-label="Explore Museion" className={styles.menuPanel}><p>Follow your curiosity</p>{[["/#how-it-works", "How it works"], ["/#library", "Our courses"], ["/about", "Our method"], ["/help", "Help & questions"]].map(([href, label]) => <Link key={href} href={href} onClick={close}>{label}<span aria-hidden="true">↗</span></Link>)}</nav>
  </details>;
}
