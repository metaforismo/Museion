import type { Metadata } from "next";
import Link from "next/link";

import AppIcon from "@/components/AppIcon";
import CoursePathCard from "@/components/CoursePathCard";
import JourneyStats from "@/components/JourneyStats";
import MaiaCharacter from "@/components/MaiaCharacter";
import MaiaNextStep from "@/components/MaiaNextStep";
import styles from "@/components/product.module.css";
import { Chip, Pressable, ProgressRail } from "@/components/ui";
import { allLessons } from "@/lib/content";
import { coursePaths } from "@/lib/curriculum";
import { subjectColor } from "@/lib/curriculum/subjects";
import { buildDashboardSnapshot, type DashboardSnapshot } from "@/lib/dashboard";
import { evidenceTone } from "@/lib/design/evidence-tone";
import { maiaStateForAction, MAIA_STATE_TITLE } from "@/lib/design/maia";
import { spreadPathsBySubject } from "@/lib/design/path-selection";
import { currentActor } from "@/lib/server/actor";
import { readLearnerPreferences } from "@/lib/server/preferences";

export const metadata: Metadata = { title: "Your learning", description: "Your courses, practice and next step." };
export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<DashboardSnapshot["nextAction"]["kind"], string> = {
  resume: "Continue learning", review: "Practice this concept", practice: "Start practice", launch: "Start learning", create: "Create a course",
};

function SectionHeading({ id, title, href, action }: { id: string; title: string; href?: string; action?: string }) {
  return <div className={styles.sectionHead}><h2 id={id} className={styles.sectionTitle}>{title}</h2>{href && <Link href={href} className={styles.link}>{action} <span aria-hidden="true">→</span></Link>}</div>;
}

function ActiveLearningCard({ item }: { item: DashboardSnapshot["activeLearning"][number] }) {
  const lessonId = /^\/lessons\/([^/?#]+)/.exec(item.href)?.[1];
  const subject = allLessons().find((lesson) => lesson.id === lessonId)?.track;
  return <Link href={item.href} className={`${styles.card} ${styles.activeCard}`}>
    <div className="flex items-center justify-between gap-3"><Chip tone="neutral">{item.kind === "generated" ? "From your source" : "Museion course"}</Chip><span aria-hidden="true" className="text-ink-soft">↗</span></div>
    <h3 className={styles.activeTitle}>{item.title}</h3><p className={styles.rowDetail}>{item.detail}</p>
    <div className="mt-4"><ProgressRail ratio={item.progress} accent={subjectColor(subject ?? "default")} label={`${item.title} progress`} /></div>
  </Link>;
}

export default async function DashboardPage() {
  const actor = await currentActor();
  const preferences = await readLearnerPreferences();
  const snapshot = await buildDashboardSnapshot(actor.ownerId, { suggestedCourseId: preferences?.suggestedCourseId });
  const hasActivity = snapshot.activeLearning.length > 0 || snapshot.journey.lessonsCompleted > 0;
  const firstName = actor.displayName?.trim().split(/\s+/)[0];
  const heroState = maiaStateForAction(snapshot.nextAction.kind);
  const selectedPaths = spreadPathsBySubject(coursePaths, snapshot.courseProgress, 3);
  const greeting = hasActivity ? `Welcome back${firstName ? `, ${firstName}` : ""}.` : `Let’s begin${firstName ? `, ${firstName}` : ""}.`;

  return <div className={styles.page}>
    <header className={styles.greeting}><div><p className={styles.eyebrow}>Your learning space</p><h1 className={styles.heading}>{greeting}</h1><p className={styles.subheading}>{preferences ? `A little closer to ${preferences.goal}.` : "One good question. One small discovery. Your next step starts here."}</p></div><Link href="/library" className={styles.link}>Explore courses <span aria-hidden="true">↗</span></Link></header>

    <section className={styles.hero} aria-labelledby="next-action-title">
      <div className={styles.heroBody}><p className="flex items-center gap-2 text-label font-semibold uppercase tracking-[.08em] text-lapis-dark"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-lapis"/>{hasActivity ? "Picked up where you left off" : "Your first discovery"}</p>
        <h2 id="next-action-title" className={styles.heroTitle}>{snapshot.nextAction.title}</h2><p className={styles.heroCopy}>{snapshot.nextAction.description}</p>
        <div className={styles.heroActions}><Pressable href={snapshot.nextAction.href} accent="var(--color-ink)" edge="var(--color-ink)">{ACTION_LABELS[snapshot.nextAction.kind]} <span aria-hidden="true">→</span></Pressable>{snapshot.reviewQueue.length > 0 && snapshot.nextAction.kind !== "review" && <Link href="/review" className={styles.link}>{snapshot.reviewQueue.length} to revisit</Link>}</div>
        <MaiaNextStep action={snapshot.nextAction} dailyMinutes={preferences?.dailyMinutes}/>
      </div>
      <div className={styles.heroArt}><MaiaCharacter state={heroState} size="hero" title={MAIA_STATE_TITLE[heroState]} /></div>
    </section>

    {snapshot.journey.lessonsCompleted > 0 && <section aria-label="Your progress so far" className="mt-5"><JourneyStats journey={snapshot.journey}/></section>}

    <div className={styles.contentGrid}><div>
      <section className={styles.section} aria-labelledby="learning-title"><SectionHeading id="learning-title" title="Your courses" href="/library" action="View library"/>
        {snapshot.activeLearning.length > 0 ? snapshot.activeLearning.map((item) => <ActiveLearningCard key={item.id} item={item}/>) : <div className={`${styles.card} ${styles.empty}`}><span className={styles.emptyIcon} aria-hidden="true"><AppIcon name="library" className="h-5 w-5"/></span><h3 className={styles.emptyTitle}>Your next curiosity belongs here.</h3><p className={styles.emptyCopy}>Choose a course or bring something you want to understand. We’ll keep your place as you learn.</p><Link href="/library" className={`${styles.link} mt-3`}>Find your first course <span aria-hidden="true">→</span></Link></div>}
      </section>
      {snapshot.evidence.length > 0 && <section className={styles.section} aria-labelledby="understanding-title"><SectionHeading id="understanding-title" title="What you’ve been working on" href="/progress" action="See progress"/><div className={styles.card}>{snapshot.evidence.slice(0,4).map((item) => <div key={`${item.concept}:${item.state}`} className={styles.row}><div><p className={styles.rowTitle}>{item.concept}</p><p className={styles.rowDetail}>{item.state === "hint-free-practice" ? "Practised without hints" : item.state === "immediate-transfer" ? "Checked in a new example" : "Worked through with guidance"}</p></div><Chip tone={evidenceTone(item.result)}>{item.result}</Chip></div>)}</div></section>}
      {snapshot.reviewQueue.length > 0 && <section className={styles.section} aria-labelledby="review-title"><SectionHeading id="review-title" title="Worth another look" href="/review" action="See all"/><div className={styles.card}>{snapshot.reviewQueue.slice(0,2).map((item) => <Link href={item.href} key={item.id} className={styles.row}><div><h3 className={styles.rowTitle}>{item.concept}</h3><p className={styles.rowDetail}>{item.reason}</p></div><span aria-hidden="true">→</span></Link>)}</div></section>}
    </div><aside>
      <section className={`${styles.card} ${styles.tutorCard}`} aria-labelledby="maia-title"><div className={styles.tutorTop}><MaiaCharacter size="inline" state="curious" title="Maia"/><div><h2 id="maia-title" className={styles.tutorTitle}>A little help from Maia</h2><p className={styles.rowDetail}>Your thinking companion</p></div></div><p className={styles.emptyCopy}>Stuck on a step? Tell Maia what you’ve tried. She’ll help you see it differently, then leave the next move to you.</p><Link href={snapshot.nextAction.href} className={`${styles.link} mt-3`}>Learn together <span aria-hidden="true">→</span></Link></section>
      <section className={`${styles.section} mt-6`} aria-labelledby="sources-title"><SectionHeading id="sources-title" title="Your sources"/>{snapshot.recentSources.length > 0 ? <div className={styles.card}>{snapshot.recentSources.slice(0,3).map((source) => <Link key={source.id} href={source.href} className={styles.row}><div className="min-w-0"><h3 className={`${styles.rowTitle} truncate`}>{source.title}</h3><p className={styles.rowDetail}>{source.pages} {source.pages === 1 ? "page" : "pages"}</p></div><span aria-hidden="true">↗</span></Link>)}</div> : <div className={`${styles.card} ${styles.empty}`}><h3 className={styles.emptyTitle}>Turn a source into a course.</h3><p className={styles.emptyCopy}>Bring your notes or a document. Build a guided path around what you want to learn.</p><Link href="/create" className={`${styles.link} mt-3`}>Add a source <span aria-hidden="true">→</span></Link></div>}</section>
    </aside></div>

    <section className={styles.pathSection} aria-labelledby="paths-title"><SectionHeading id="paths-title" title={hasActivity ? "Make room for a new curiosity" : "A few places to start"} href="/library" action="All courses"/><div className={styles.paths}>{selectedPaths.map((course) => <CoursePathCard key={course.id} course={course} progress={snapshot.courseProgress[course.id] ?? { completed:0,total:course.lessonIds.length }}/>)}</div></section>
    <details className={styles.disclosure}><summary>How your progress is measured</summary><p>{snapshot.limitations.join(" ")} <Link href="/progress" className="font-medium text-lapis-dark">View your learning record.</Link></p></details>
  </div>;
}
