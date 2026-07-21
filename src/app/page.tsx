import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";

import BrandMark from "@/components/BrandMark";
import LandingMotion from "@/components/LandingMotion";
import MaiaCharacter from "@/components/MaiaCharacter";
import MethodTraceDemo from "@/components/MethodTraceDemo";
import { coursePaths } from "@/lib/curriculum";
import { subjectColor } from "@/lib/curriculum/subjects";

import styles from "./landing.module.css";

const SUBJECTS = [
  { name: "Mathematics", asset: "/landing/subject-mathematics-v2.png", tone: "blue" },
  { name: "Physics", asset: "/landing/subject-physics-v2.png", tone: "peach" },
  { name: "Biology", asset: "/landing/subject-biology-v2.png", tone: "mint" },
  { name: "Computer science", asset: "/landing/subject-computer-science-v2.png", tone: "violet" },
  { name: "Arithmetic", asset: "/landing/subject-arithmetic-v2.png", tone: "yellow" },
  { name: "Research", asset: "/landing/subject-research-v2.png", tone: "coral" },
] as const;

const MATERIALS = [
  { label: "Your notes", detail: "Ideas in your own words", asset: "/landing/source-notebook.png", tone: "blue" },
  { label: "A PDF", detail: "Pages and exact quotations", asset: "/landing/source-document.png", tone: "peach" },
  { label: "A transcript", detail: "Authorized text with provenance", asset: "/landing/source-transcript.png", tone: "mint" },
  { label: "An excerpt", detail: "A focused source passage", asset: "/landing/source-excerpt.png", tone: "violet" },
  { label: "A lab handout", detail: "Claims, data, and procedure", asset: "/landing/source-lab.png", tone: "yellow" },
] as const;

const COURSE_ART: Record<string, string> = {
  "algebra-as-balance": "/landing/course-algebra-balance.png",
  "search-by-halving": "/landing/course-search-halving.png",
  "probability-as-evidence": "/landing/course-probability-evidence.png",
  "functions-as-change": "/landing/course-functions-change.png",
  "claims-to-evidence": "/landing/course-claims-evidence.png",
  "samples-to-conclusions": "/landing/course-samples-conclusions.png",
};

const METHOD = [
  ["01", "Ground", "Start from evidence you can inspect."],
  ["02", "Predict", "Commit before the explanation appears."],
  ["03", "Interact", "Move the idea instead of just reading it."],
  ["04", "Diagnose", "Code checks the move and names the misconception."],
  ["05", "Explain", "Put the why into your own words."],
  ["06", "Transfer", "Solve one nearby problem without Maia."],
  ["07", "Revisit", "Bring the concept back when practice can help."],
] as const;

const PRINCIPLES = [
  {
    quote: "The model can propose the lesson. It never gets to decide what is correct.",
    label: "Deterministic truth",
    mark: "✓",
  },
  {
    quote: "Every published claim keeps its exact source span, page, and integrity hash.",
    label: "Source-grounded",
    mark: "↗",
  },
  {
    quote: "Maia asks the next useful question, but the final answer stays out of reach.",
    label: "Leak-gated tutor",
    mark: "?",
  },
  {
    quote: "A completed activity is an observation—not a claim of durable mastery.",
    label: "Honest evidence",
    mark: "◎",
  },
  {
    quote: "The explanation appears after a learner move, never before the attempt.",
    label: "Commitment first",
    mark: "01",
  },
  {
    quote: "The transfer check removes Maia, hints, and solution reveal by construction.",
    label: "Unassisted transfer",
    mark: "↘",
  },
  {
    quote: "Generated courses stay reviewable and distinct from Museion Originals.",
    label: "Human review",
    mark: "◇",
  },
  {
    quote: "A link records provenance. It is never treated as permission to scrape content.",
    label: "Rights-aware sources",
    mark: "§",
  },
] as const;

const FAQS = [
  [
    "Can I try Museion without an account?",
    "Yes. The sample lesson runs without an account or API key, including source evidence, deterministic feedback, Maia, and the transfer check.",
  ],
  [
    "Can I build from my own material?",
    "Yes. A Source Pack can combine notes, excerpts, transcripts, and selectable-text PDFs that you have the right to use. Links remain provenance; Museion does not scrape protected content.",
  ],
  [
    "Does Maia ever give away the answer?",
    "No. Maia receives the activity context and detected misconception, but final answers are excluded and every response passes a leak gate before it reaches the learner.",
  ],
  [
    "Is Museion claiming to improve learning?",
    "Not from this build. Museion records bounded observations from checked work. Durable mastery and far transfer require longitudinal evidence that the current product does not claim to have.",
  ],
] as const;

function Cloud({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`${styles.cloud} ${className}`}>
      <Image
        src="/landing/museion-cloud.png"
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
        <Cloud className={styles.heroCloudLeft} />
        <Cloud className={styles.heroCloudRight} />
        <Image src="/landing/source-notebook.png" alt="" width={180} height={180} sizes="(max-width: 700px) 72px, 126px" className={`${styles.heroSourceAsset} ${styles.heroNotebook}`} />
        <Image src="/landing/source-document.png" alt="" width={180} height={180} sizes="(max-width: 700px) 68px, 116px" className={`${styles.heroSourceAsset} ${styles.heroDocument}`} />
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
            <InlineCharm src="/landing/hero-spark-charm-v2.png" className={styles.orbGold} /> don&apos;t have
            <br /> to stay passive
          </h1>
          <p className={styles.heroCopy}>Museion turns material you trust into interactive lessons that make your reasoning visible.</p>
          <div className={styles.heroActions}>
            <Link href="/judge" className={styles.primaryButton}>
              Try a lesson <span aria-hidden="true">→</span>
            </Link>
            <Link href="/create" className={styles.textButton}>
              Build from your material
            </Link>
          </div>
          <MaiaCharacter
            state="celebrating"
            animated
            className={styles.heroMaia}
            title="Maia, Museion's learning companion"
          />
        </div>
      </section>

      <section className={styles.promise} aria-labelledby="promise-title" data-scroll-stage="promise">
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
                <Image src={subject.asset} alt="" width={420} height={420} sizes="96px" className={styles.subjectAsset} aria-hidden="true" />
                <span className={styles.subjectName}>{subject.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.demoSection} id="how-it-works" aria-labelledby="demo-title">
        <div className={styles.demoGlow} aria-hidden="true" />
        <div className={styles.demoHeader} data-reveal="soft">
          <p className={styles.sectionKicker}>The product, not a mock-up</p>
          <h2 id="demo-title">A lesson that waits for your move.</h2>
          <p>Pick an answer. The deterministic engine responds; Maia only asks what helps you reason again.</p>
        </div>
        <div className={styles.demoFrame} data-reveal="clip">
          <div className={styles.browserBar} aria-hidden="true">
            <span />
            <span />
            <span />
            <p>museion / algebra as balance</p>
          </div>
          <MethodTraceDemo />
        </div>
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

      <section className={styles.materialSection} aria-labelledby="materials-title">
        <div className={styles.materialIntro} data-reveal="soft">
          <p className={styles.sectionKicker}>One function, many kinds of material</p>
          <h2 id="materials-title">Bring what you&apos;re already learning from.</h2>
        </div>
        <div className={styles.materialRail} role="region" aria-label="Supported Source Pack materials" tabIndex={0}>
          {MATERIALS.map((material, index) => (
            <article key={material.label} className={styles.materialCard} data-tone={material.tone} data-reveal="clip" style={{ "--reveal-delay": `${index * 55}ms` } as CSSProperties}>
              <span className={styles.materialNumber}>0{index + 1}</span>
              <span className={styles.materialVisual} aria-hidden="true">
                <Image src={material.asset} alt="" width={250} height={250} sizes="220px" className={styles.materialImage} />
              </span>
              <h3>{material.label}</h3>
              <p>{material.detail}</p>
            </article>
          ))}
        </div>
        <div className={styles.sourceComposer} data-reveal="soft">
          <div>
            <span className={styles.composerLabel}>Describe what you want to understand</span>
            <p>Build me a course from these notes, with citations and a transfer check.</p>
          </div>
          <Link href="/create" className={styles.primaryButton}>
            Create <span aria-hidden="true">→</span>
          </Link>
        </div>
        <Cloud className={styles.materialCloud} />
      </section>

      <section className={styles.manifesto} aria-label="Create, think, transfer" data-scroll-stage="manifesto">
        <div className={styles.manifestoSticky}>
          <Cloud className={styles.manifestoCloudLeft} />
          <Cloud className={styles.manifestoCloudRight} />
          <Spark className={styles.manifestoSpark}>?</Spark>
          <Spark className={styles.manifestoGold}>✓</Spark>
          <div className={`${styles.manifestoWord} ${styles.wordCreate}`}>
            <h2>Create</h2>
            <MaiaCharacter state="curious" animated className={styles.manifestoMaia} />
            <p>Turn trusted material into a designed investigation.</p>
          </div>
          <div className={`${styles.manifestoWord} ${styles.wordThink}`}>
            <h2>Think</h2>
            <MaiaCharacter state="redirecting" animated className={styles.manifestoMaia} />
            <p>Commit, test, and explain before anything is revealed.</p>
          </div>
          <div className={`${styles.manifestoWord} ${styles.wordTransfer}`}>
            <h2>Transfer</h2>
            <MaiaCharacter state="celebrating" animated className={styles.manifestoMaia} />
            <p>Try the idea once more—this time without Maia.</p>
          </div>
        </div>
      </section>

      <section className={styles.library} id="library" aria-labelledby="library-title">
        <div className={styles.libraryHeader} data-reveal>
          <p className={styles.sectionKicker}>Or start with a Museion Original</p>
          <h2 id="library-title">A library of courses built to be questioned.</h2>
          <p>Each path has documented sources, misconceptions, deterministic checks, and one honest evidence boundary.</p>
        </div>
        <div className={styles.courseArc}>
          {coursePaths.slice(0, 6).map((course, index) => {
            const accent = subjectColor(course.subject);
            const art = COURSE_ART[course.id];
            return (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
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
        <Link href="/library" className={styles.outlineButton}>
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
            <div className={styles.sourceStack} aria-hidden="true">
              <span>Source · inspect the evidence</span>
              <span>Attempt · commit to a move</span>
              <span>Feedback · see what the move means</span>
            </div>
          </article>
          <article className={`${styles.featureCard} ${styles.featureViolet}`} data-reveal>
            <div>
              <span className={styles.featureTag}>Built to make you think</span>
              <h3>Maia asks about the misconception—not for another generic answer.</h3>
            </div>
            <div className={styles.maiaFeature}>
              <MaiaCharacter state="redirecting" animated className={styles.featureMaia} />
              <p>Which term is keeping <strong>2x</strong> from being alone?</p>
            </div>
          </article>
          <article className={`${styles.featureCard} ${styles.featureMint}`} data-reveal>
            <div>
              <span className={styles.featureTag}>Adapts to the evidence</span>
              <h3>Museion responds to checked work while staying honest about what it cannot know.</h3>
            </div>
            <div className={styles.evidenceLines} aria-hidden="true">
              <span><i /> Observed in this session</span>
              <span><i /> Suggested support</span>
              <span><i /> No mastery claim</span>
            </div>
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
          <h2 id="method-title">Seven deliberate moves. No learning theatre.</h2>
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
              <p className={styles.sectionKicker}>The evidence contract</p>
              <h2 id="principles-title">Made for learners. Accountable to evidence.</h2>
              <p>Eight promises you can inspect in the product—not claims you have to take on faith.</p>
            </div>
            <span className={styles.contractNote}>Inspectable by design</span>
            <Image src="/landing/course-claims-evidence.png" alt="" width={640} height={640} sizes="360px" className={styles.principlesAsset} />
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
        <Cloud className={styles.finalCloudLeft} />
        <Cloud className={styles.finalCloudRight} />
        <Spark className={styles.finalStarOne}>✦</Spark>
        <Spark className={styles.finalStarTwo}>+</Spark>
        <div className={styles.finalCopy}>
          <h2 id="final-title">Let&apos;s make thinking visible.</h2>
          <p>Start with a two-minute lesson. No account, no API key.</p>
          <Link href="/judge" className={styles.primaryButton}>Try Museion <span aria-hidden="true">→</span></Link>
        </div>
        <div className={styles.finalMaiaWrap}>
          <MaiaCharacter state="celebrating" animated className={styles.finalMaia} />
        </div>
        <footer className={styles.landingFooter}>
          <Link href="/" aria-label="Museion home" className={styles.footerBrand}>
            <BrandMark className="h-8 w-8" />
            <span>Museion</span>
          </Link>
          <p>© 2026 · A house for reasoning from sources.</p>
          <nav aria-label="Legal">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </nav>
        </footer>
      </section>
    </LandingMotion>
  );
}
