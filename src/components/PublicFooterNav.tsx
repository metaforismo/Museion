import Link from "next/link";
import { PUBLIC_DOCUMENTS } from "@/lib/site/public-routes";
import styles from "./PublicFooterNav.module.css";

const GROUPS = [
  { label: "Explore", paths: ["/about", "/help"] },
  { label: "Trust & access", paths: ["/accessibility", "/privacy", "/terms"] },
];

export default function PublicFooterNav({ className }: { className?: string }) {
  return <nav aria-label="Museion information" className={`${styles.navigation} ${className ?? ""}`}>
    {GROUPS.map(({ label, paths }) => <div key={label} className={styles.group}>
      <p className={styles.heading}>{label}</p>
      <div className={styles.links}>{PUBLIC_DOCUMENTS.filter(({ href }) => paths.includes(href)).map(({ href, label: linkLabel }) => <Link key={href} href={href}>{linkLabel}</Link>)}</div>
    </div>)}
  </nav>;
}
