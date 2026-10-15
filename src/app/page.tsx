import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";

import BrandMark from "@/components/BrandMark";
import LandingMotion from "@/components/LandingMotion";
import MaiaCharacter from "@/components/MaiaCharacter";
import MaterialsScrollRail from "@/components/MaterialsScrollRail";
import PublicFooterNav from "@/components/PublicFooterNav";
import { coursePaths } from "@/lib/curriculum";
import { subjectColor } from "@/lib/curriculum/subjects";
import { COURSE_ART } from "@/lib/design/assets";

import styles from "./landing.module.css";

const SUBJECTS = [
  { name: "Mathematics", asset: "/landing/subjects/mathematics.webp", tone: "blue" },
  { name: "Physics", asset: "/landing/subjects/physics.webp", tone: "peach" },
  { name: "Biology", asset: "/landing/subjects/biology.webp", tone: "mint" },
  { name: "Computer science", asset: "/landing/subjects/computer-science.webp", tone: "violet" },
  { name: "Arithmetic", asset: "/landing/subjects/arithmetic.webp", tone: "yellow" },
  { name: "Research", asset: "/landing/subjects/research.webp", tone: "coral" },
] as const;

const MATERIALS = [
  { label: "Your notes", detail: "Ideas in your own words", asset: "/landing/source-notebook.png", tone: "blue" },
  { label: "A PDF", detail: "Pages and exact quotations", asset: "/landing/source-document.png", tone: "peach" },
  { label: "A transcript", detail: "Words worth coming back to", asset: "/landing/source-transcript.png", tone: "mint" },
  { label: "An excerpt", detail: "A focused source passage", asset: "/landing/source-excerpt.png", tone: "violet" },
  { label: "A lab handout", detail: "Claims, data, and procedure", asset: "/landing/source-lab.png", tone: "yellow" },
] as const;

const METHOD = [
  ["01", "Ground", "Start from evidence you can inspect."],
  ["02", "Predict", "Commit before the explanation appears."],
  ["03", "Interact", "Move the idea instead of just reading it."],
  ["04", "Reflect", "See what your attempt reveals and try again."],
  ["05", "Explain", "Put the why into your own words."],
  ["06", "Transfer", "Solve one nearby problem without Maia."],
  ["07", "Revisit", "Bring the concept back when practice can help."],
] as const;

const PRINCIPLES = [
  {
    quote: "Your work is checked against the activity, with feedback you can act on.",
    label: "Reliable feedback",
    mark: "✓",
  },
  {
    quote: "The original source stays close, so you can check where an idea comes from.",
    label: "Sources close by",
    mark: "↗",
  },
  {
    quote: "Maia asks the next useful question, but the final answer stays out of reach.",
    label: "Guidance that helps",
    mark: "?",
  },
  {
    quote: "Progress shows what you have tried. There is always room to practice again.",
    label: "Honest evidence",
    mark: "◎",
  },
  {
    quote: "The explanation appears after a learner move, never before the attempt.",
    label: "Commitment first",
    mark: "01",
  },
  {
    quote: "Try a nearby problem on your own to see what you can do without help.",
    label: "Unassisted transfer",
    mark: "↘",
  },
  {
    quote: "Generated courses stay reviewable and distinct from Museion Originals.",
    label: "Human review",
    mark: "◇",
  },
  {
    quote: "Bring material you have permission to use and keep its origins in view.",
    label: "Respect for sources",
    mark: "§",
  },
] as const;

const FAQS = [
  ["How do I get started?", "Create an account, then choose a Museion Original or build a course from your own material. Your courses and progress stay in your personal workspace."],
  ["Can I learn from my own material?", "Yes. Bring notes, excerpts, transcripts, or PDFs with selectable text that you have permission to use. The original sources remain available alongside your course."],
  ["Will Maia just tell me the answer?", "Maia guides your reasoning with questions, hints, and examples. You make an attempt first; independent practice gives you space to put the idea to work yourself."],
  ["What does my progress show?", "Museion records your attempts and the work you completed independently. These observations help you choose what to practice. Completing a lesson does not automatically mean you have mastered a subject."],
] as const;

function Cloud({ className = "", eager = false }: { className?: string; eager?: boolean }) {
  return (
    <span aria-hidden="true" className={`${styles.cloud} ${className}`}>
      <Image
        src="/landing/museion-cloud.png"
        loading={eager ? "eager" : "lazy"}
        alt=""
        width={900}
        height={600}
        sizes="(max-width: 700px) 220px, 360px"
        className={styles.cloudImage}
      />
    </span>
  );
}

function InlineCharm({ src, className = "" }: { src: string; className?: string }) {
  return (
    <span className={`${styles.wordOrb} ${styles.assetOrb} ${className}`} aria-hidden="true">
      <Image src={src} alt="" width={320} height={320} sizes="64px" className={styles.inlineCharmImage} />
    </span>
  );
}

function Spark({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <span aria-hidden="true" className={`${styles.spark} ${className}`}>
      {children}
    </span>
  );
}

export default function HomePage() {
  return (
    <LandingMotion className={styles.page}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <Cloud className={styles.heroCloudLeft} eager />
        <Cloud className={styles.heroCloudRight} eager />
        <Image src="/landing/source-notebook.png" alt="" loading="eager" width={180} height={180} sizes="(max-width: 700px) 72px, 126px" className={`${styles.heroSourceAsset} ${styles.heroNotebook}`} />
        <Image src="/landing/source-document.png" alt="" loading="eager" width={180} height={180} sizes="(max-width: 700px) 68px, 116px" className={`${styles.heroSourceAsset} ${styles.heroDocument}`} />
        <Image src="/landing/source-transcript.png" alt="" width={180} height={180} sizes="(max-width: 700px) 82px, 132px" className={`${styles.heroSourceAsset} ${styles.heroTranscript}`} />
        <Image src="/landing/source-lab.png" alt="" width={180} height={180} sizes="(max-width: 700px) 66px, 108px" className={`${styles.heroSourceAsset} ${styles.heroLab}`} />
        <Spark className={styles.sparkStar}>✦</Spark>

        <div className={styles.heroInner}>
          <p className={styles.heroKicker}>
            <span aria-hidden="true" /> Built for thinking, not answer collecting
          </p>
          <h1 id="hero-title" className={styles.heroTitle} aria-label="Sources don't have to stay passive">
            <span className={styles.heroRotator} aria-hidden="true">
              <span>Sources</span>
              <span>Notes</span>
              <span>Videos</span>
              <span>Books</span>
            </span>{" "}
            {/* The space after the charm has to be explicit: the JSX
                transform drops the literal one that used to sit here, which
                is half of why the hero rendered as "Sources✦don't have". The
                other half is the charm image overflowing its own box; see
                .wordOrb in landing.module.css. */}
            <InlineCharm src="/landing/hero-spark-charm-v2.png" className={styles.orbGold} />{" "}
            don&apos;t have
            <br /> to stay passive
          </h1>
          <p className={styles.heroCopy}>Museion turns material you trust into interactive lessons that make your reasoning visible.</p>
          <div className={styles.heroActions}>
            <Link href="/signup" className={styles.primaryButton}>
              Start learning <span aria-hidden="true">→</span>
            </Link>
            <Link href="/signup?next=/create" className={styles.textButton}>
              Build from your material
            </Link>
          </div>
          {/* `curious` because nothing has been achieved here — a move is
              available. `celebrating` claimed a verified moment that the top
              of the marketing page cannot have produced. */}
          <MaiaCharacter
            state="curious"
            className={styles.heroMaia}
            title="Maia, Museion's learning companion"
          />
        </div>
      </section>

      <section className={styles.promise} aria-labelledby="promise-title" data-scroll-stage="promise" data-phase="cluster">
        <div className={styles.promiseSticky}>
          <p className={styles.sectionKicker}>Start with evidence. Not an empty prompt.</p>
          <h2 id="promise-title" className={styles.promiseTitle}>
            Museion learns from your <InlineCharm src="/landing/promise-source-charm-v2.png" className={styles.orbPeach} /> sources,
            <br /> finds the <InlineCharm src="/landing/promise-idea-charm-v2.png" className={styles.orbBlue} /> ideas worth testing,
            <br /> and turns them into a <InlineCharm src="/landing/promise-trust-charm-v2.png" className={styles.orbMint} /> course you can trust.
          </h2>
          <div className={styles.subjectOrbit} aria-label="Subjects available in Museion">
            {SUBJECTS.map((subject) => (
              <div key={subject.name} className={styles.subjectChip} data-tone={subject.tone}>
                <Image src={subject.asset} alt="" loading="eager" width={256} height={256} unoptimized className={styles.subjectAsset} aria-hidden="true" />
                <span className={styles.subjectName}>{subject.name}</span>
              </div>
            ))}
            <div className={styles.promiseOutcome} aria-hidden="true">
              <Image src="/landing/source-pack-folder-v3.webp" alt="" width={640} height={640} sizes="112px" />
              <span>One evidence-backed course</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.overviewSection} id="how-it-works" aria-labelledby="overview-title">
        <div className={styles.overviewGlow} aria-hidden="true" />
        <div className={styles.overviewHeader} data-reveal="soft">
          <p className={styles.sectionKicker}>Your own space to learn</p>
          <h2 id="overview-title">A lesson that waits for your move.</h2>
          <p>Your courses, your questions, and a companion to help you think them through. It all begins in your personal workspace.</p>
        </div>
        <figure className={styles.overviewFrame} data-reveal="soft" aria-label="How learning in Museion is organized">
          <Image src="/landing/learning-world.webp" alt="A notebook and playful scientific objects representing ideas to explore" width={1536} height={1024} sizes="(max-width: 700px) 90vw, 640px" className={styles.overviewArtwork} />
          <figcaption className={styles.overviewSteps}>
            <span><i aria-hidden="true">01</i> Choose a course</span>
            <span><i aria-hidden="true">02</i> Explore with Maia</span>
            <span><i aria-hidden="true">03</i> Practice on your own</span>
          </figcaption>
        </figure>
        <div className={styles.overviewAction}><Link href="/signup" className={styles.primaryButton}>Create your workspace <span aria-hidden="true">→</span></Link></div>
      </section>

      <section className={styles.onePack} aria-labelledby="one-pack-title">
        <Image src="/landing/source-notebook.png" alt="" width={250} height={250} sizes="150px" className={`${styles.packAsset} ${styles.packAssetOne}`} />
        <Image src="/landing/source-document.png" alt="" width={250} height={250} sizes="140px" className={`${styles.packAsset} ${styles.packAssetTwo}`} />
        <Image src="/landing/source-transcript.png" alt="" width={250} height={250} sizes="155px" className={`${styles.packAsset} ${styles.packAssetThree}`} />
        <Image src="/landing/source-lab.png" alt="" width={250} height={250} sizes="135px" className={`${styles.packAsset} ${styles.packAssetFour}`} />
        <Cloud className={styles.packCloudLeft} />
        <Cloud className={styles.packCloudRight} />
        <div className={styles.packCenter} data-reveal="soft">
          <Image
            src="/landing/source-pack-folder-v3.webp"
            alt=""
            width={640}
            height={640}
            sizes="(max-width: 700px) 128px, 176px"
            className={styles.packFolder}
          />
          <h2 id="one-pack-title">
            You can <span className={styles.magicPill}><Image src="/landing/hero-spark-charm-v2.png" alt="" width={320} height={320} sizes="32px" />Build a course</span>
            <br /> from one Source Pack
          </h2>
        </div>
      </section>

      <MaterialsScrollRail
        className={styles.materialSection}
        stickyClassName={styles.materialSticky}
        railClassName={styles.materialRail}
        intro={<div className={styles.materialIntro}>
          <p className={styles.sectionKicker}>One function, many kinds of material</p>
          <h2 id="materials-title">Bring what you&apos;re already learning from.</h2>
        </div>}
        footer={<>
          <div className={styles.sourceComposer}>
            <div>
              <span className={styles.composerLabel}>Describe what you want to understand</span>
              <p>Turn these notes into a course I can explore, question, and practice.</p>
            </div>
            <Link href="/signup?next=/create" className={styles.primaryButton}>Create <span aria-hidden="true">→</span></Link>
          </div>
          <Cloud className={styles.materialCloud} />
        </>}
      >
        {MATERIALS.map((material, index) => (
          <article key={material.label} className={styles.materialCard} data-tone={material.tone}>
            <span className={styles.materialNumber}>0{index + 1}</span>
            <span className={styles.materialVisual} aria-hidden="true">
              <Image src={material.asset} alt="" loading="eager" width={250} height={250} sizes="220px" className={styles.materialImage} />
            </span>
            <h3>{material.label}</h3>
            <p>{material.detail}</p>
          </article>
        ))}
      </MaterialsScrollRail>

      <section className={styles.manifesto} aria-label="Create, think, transfer" data-scroll-stage="manifesto" data-phase="create">
        <div className={styles.manifestoSticky}>
          <Cloud className={styles.manifestoCloudLeft} />
          <Cloud className={styles.manifestoCloudRight} />
          <Spark className={styles.manifestoSpark}>?</Spark>
          <Spark className={styles.manifestoGold}>✓</Spark>
          <div className={`${styles.manifestoWord} ${styles.wordCreate}`}>
            <h2>Create</h2>
            <MaiaCharacter state="curious" className={styles.manifestoMaia} />
            <p>Turn trusted material into a designed investigation.</p>
          </div>
          <div className={`${styles.manifestoWord} ${styles.wordThink}`}>
            <h2>Think</h2>
            <MaiaCharacter state="redirecting" className={styles.manifestoMaia} />
            <p>Commit, test, and explain before anything is revealed.</p>
          </div>
          <div className={`${styles.manifestoWord} ${styles.wordTransfer}`}>
            <h2>Transfer</h2>
            <MaiaCharacter state="celebrating" className={styles.manifestoMaia} />
            <p>Try the idea once more—this time without Maia.</p>
          </div>
        </div>
      </section>

      <section className={styles.library} id="library" aria-labelledby="library-title">
        <div className={styles.libraryHeader} data-reveal>
          <p className={styles.sectionKicker}>Or start with a Museion Original</p>
          <h2 id="library-title">A library of courses built to be questioned.</h2>
          <p>Thoughtfully built paths through big ideas, with sources to explore and practice to make them your own.</p>
        </div>
        <div className={styles.courseArc}>
          {coursePaths.slice(0, 6).map((course, index) => {
            const accent = subjectColor(course.subject);
            const art = COURSE_ART[course.id];
            return (
              <Link
                key={course.id}
                href={`/signup?next=/courses/${course.id}`}
                className={styles.courseTile}
                style={{
                  "--course-accent": accent,
                  "--course-index": index,
                  "--reveal-delay": `${index * 55}ms`,
                } as CSSProperties}
                data-reveal
              >
                <span className={styles.courseCover} aria-hidden="true">
                  {art ? (
                    <Image
                      src={art}
                      alt=""
                      width={640}
                      height={640}
                      sizes="(max-width: 700px) 130px, 150px"
                      className={styles.courseCoverImage}
                    />
                  ) : null}
                </span>
                <span className={styles.courseSubject}>{course.subject}</span>
                <h3>{course.title}</h3>
                <p>{course.lessonIds.length} investigations</p>
                <span className={styles.courseArrow} aria-hidden="true">↗</span>
              </Link>
            );
          })}
        </div>
        <Link href="/signup?next=/library" className={styles.outlineButton}>
          Browse all courses <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section className={styles.more} aria-labelledby="more-title">
        <div className={styles.moreHeader} data-reveal>
          <p className={styles.sectionKicker}>Meet Maia, your reasoning companion</p>
          <h2 id="more-title">Help that gets you unstuck without taking over.</h2>
        </div>
        <div className={styles.featureGrid}>
          <article className={`${styles.featureCard} ${styles.featureBlue}`} data-reveal>
            <div>
              <span className={styles.featureTag}>Concepts you can work with</span>
              <h3>Every lesson turns a trusted source into a move you can make and check.</h3>
            </div>
            <div className={styles.learningFlow}>
              <div className={styles.sourceIdeaGraphic} aria-hidden="true">
                <div className={styles.sourcePageMark}><span>“</span><i /><i /><i /><b /></div>
                <svg className={styles.sourceIdeaPath} viewBox="0 0 140 76" fill="none"><path d="M4 52C38 52 29 12 69 12s29 40 63 40" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" /><path d="m126 46 8 6-8 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span className={styles.questionMark}>?</span>
                <span className={styles.sourceIdeaCaption}>From a source to a question</span>
              </div>
            <ol className={styles.learningSequence} aria-label="How a learning moment is structured">
              <li className={styles.sequenceSource}>
                <span className={styles.sequenceNumber}>01</span>
                <div><span className={styles.sequenceLabel}>Source</span><h4>Keep the idea close.</h4><p>Read the original passage. Keep the evidence within reach.</p></div>
                <span className={styles.sourceExcerpt} aria-hidden="true"><i /><i /><i /></span>
              </li>
              <li className={styles.sequenceAttempt}>
                <span className={styles.sequenceNumber}>02</span>
                <div><span className={styles.sequenceLabel}>Attempt</span><h4>Make a prediction.</h4><p>Predict what a move will change, before seeing the result.</p></div>
                <span className={styles.attemptMark} aria-hidden="true">↗</span>
              </li>
              <li className={styles.sequenceFeedback}>
                <span className={styles.sequenceNumber}>03</span>
                <div><span className={styles.sequenceLabel}>Feedback</span><h4>See what changed.</h4><p>Connect the outcome to your reasoning. Choose what to try next.</p></div>
                <span className={styles.feedbackMark} aria-hidden="true">✓</span>
              </li>
            </ol>
            </div>
          </article>
          <article className={`${styles.featureCard} ${styles.featureViolet}`} data-reveal>
            <div>
              <span className={styles.featureTag}>Built to make you think</span>
              <h3>Maia asks the question that helps you find your next step.</h3>
            </div>
            <div className={styles.maiaFeature}>
              <MaiaCharacter state="redirecting" className={styles.featureMaia} />
              <div className={styles.guidanceNote}><span>THE KIND OF HELP YOU CAN EXPECT</span><p>A question that points you back to the idea. A hint when you need another way in.</p><small>Your next move stays yours.</small></div>
            </div>
          </article>
          <article className={`${styles.featureCard} ${styles.featureMint}`} data-reveal>
            <div>
              <span className={styles.featureTag}>Adapts to the evidence</span>
              <h3>Build on what you have tried and come back to the ideas that need more practice.</h3>
            </div>
            <ol className={styles.practiceNotes} aria-label="How Museion helps you choose what to practice">
              <li><span aria-hidden="true">↗</span><div><strong>Start from your attempt</strong><p>See what your choice reveals about the idea.</p></div></li>
              <li><span aria-hidden="true">?</span><div><strong>Find a useful next step</strong><p>Return to a tricky concept with more support.</p></div></li>
              <li><span aria-hidden="true">✓</span><div><strong>Make room for another try</strong><p>Practice independently and see what holds.</p></div></li>
            </ol>
          </article>
        </div>
      </section>

      <section className={styles.methodSection} aria-labelledby="method-title">
        <Spark className={styles.methodStarOne}>✦</Spark>
        <Spark className={styles.methodStarTwo}>+</Spark>
        <Cloud className={styles.methodCloudOne} />
        <Cloud className={styles.methodCloudTwo} />
        <div className={styles.methodHeader} data-reveal>
          <p className={styles.sectionKicker}>One method for every subject</p>
          <h2 id="method-title">Seven deliberate moves. One idea at a time.</h2>
        </div>
        <div className={styles.methodCard} data-reveal>
          <div className={styles.methodPitch}>
            <p className={styles.methodCount}>07</p>
            <p>moves you can see in every lesson</p>
            <Link href="/about" className={styles.primaryButton}>Read the method <span aria-hidden="true">→</span></Link>
          </div>
          <ol className={styles.methodList}>
            {METHOD.map(([number, title, body]) => (
              <li key={title}>
                <span>{number}</span>
                <div><strong>{title}</strong><p>{body}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.principles} aria-labelledby="principles-title">
        <div className={styles.principlesInner}>
          <div className={styles.principlesLead} data-reveal="clip">
            <div className={styles.principlesHeader}>
              <p className={styles.sectionKicker}>Made with care</p>
              <h2 id="principles-title">Made for learners. Accountable to evidence.</h2>
              <p>Sources you can inspect. Feedback you can use. Space to do the thinking.</p>
            </div>
            <span className={styles.contractNote}>Inspectable by design</span>
            <Image src={COURSE_ART["claims-to-evidence"]} alt="" width={640} height={640} sizes="360px" className={styles.principlesAsset} />
          </div>
          <div className={styles.principleGrid}>
            {PRINCIPLES.map((principle, index) => (
              <article key={principle.label} data-reveal="soft" style={{ "--reveal-delay": `${(index % 4) * 45}ms` } as CSSProperties}>
                <span className={styles.principleMark} aria-hidden="true">{principle.mark}</span>
                <blockquote>“{principle.quote}”</blockquote>
                <footer>
                  <p><strong>{principle.label}</strong><br />Museion product principle</p>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.faq} aria-labelledby="faq-title">
        <h2 id="faq-title">FAQs</h2>
        <div>
          {FAQS.map(([question, answer], index) => (
            <details key={question} open={index === 0}>
              <summary>{question}<span aria-hidden="true">+</span></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.finalCta} aria-labelledby="final-title">
        <div className={styles.finalSky}>
          <Image
            src="/landing/footer-cloud-blue-v1.webp"
            alt=""
            aria-hidden="true"
            width={768}
            height={768}
            sizes="144px"
            className={`${styles.footerAccentCloud} ${styles.footerAccentCloudBlue}`}
          />
          <Image
            src="/landing/footer-cloud-white-v1.webp"
            alt=""
            aria-hidden="true"
            width={768}
            height={768}
            sizes="112px"
            className={`${styles.footerAccentCloud} ${styles.footerAccentCloudWhite}`}
          />
          <Spark className={styles.finalStarOne}>✦</Spark>
          <Spark className={styles.finalStarTwo}>+</Spark>
          <div className={styles.finalCopy} data-reveal="soft">
            <p className={styles.sectionKicker}>Ready when curiosity is</p>
            <h2 id="final-title">Let&apos;s make thinking visible.</h2>
            <p>Create your account. Find a course. Follow your curiosity.</p>
            <Link href="/signup" className={styles.primaryButton}>Start learning <span aria-hidden="true">→</span></Link>
            <p className={styles.finalLogin}>Already have an account? <Link href="/login">Sign in.</Link></p>
          </div>
          <div className={styles.finalScene} data-reveal="soft">
            <Image
              src="/landing/footer-maia-cloud-scene-v2.webp"
              alt="Maia emerging from a continuous cloud landscape"
              width={1672}
              height={941}
              sizes="100vw"
              className={styles.finalSceneImage}
            />
          </div>
        </div>
        <footer className={styles.landingFooter}>
          <div className={styles.footerPromise}>
            <Link href="/" aria-label="Museion home" className={styles.footerBrand}>
              <BrandMark className="h-8 w-8" />
              <span>Museion</span>
            </Link>
            <strong>A house for reasoning from sources.</strong>
            <span>© 2026 Museion</span>
          </div>
          <PublicFooterNav />
        </footer>
      </section>
    </LandingMotion>
  );
}
