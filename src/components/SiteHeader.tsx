import Link from "next/link";

import BrandMark from "./BrandMark";
import AuthButton from "./AuthButton";
import PublicMenu from "./PublicMenu";
import styles from "./SiteHeader.module.css";

export default function SiteHeader({ landing = false }: { landing?: boolean }) {
  return <header className={styles.header} data-surface={landing ? "landing" : "document"}>
    <div className={styles.inner}>
      <Link href="/" aria-label="Museion home" className={styles.brand}><BrandMark className="h-8 w-8 shrink-0"/><span>Museion</span></Link>
      <div className={styles.navigation}>
        <nav aria-label="Public navigation" className="flex items-center">
          <Link href="/#how-it-works" className={styles.navLink}>How it works</Link>
          <Link href="/#library" className={styles.navLink}>Courses</Link>
          <Link href="/help" className={styles.navLink}>Help</Link>
        </nav>
        <AuthButton/>
        <Link href="/signup" className={styles.start}>Start learning</Link>
        <PublicMenu/>
      </div>
    </div>
  </header>;
}
