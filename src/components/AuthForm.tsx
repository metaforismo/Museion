"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import BrandMark from "@/components/BrandMark";
import { clearLearnerBrowserState, restoreLearnerBrowserState } from "@/lib/client/storage";
import styles from "./AuthForm.module.css";

interface VerificationChallenge { challengeId: string; expiresAt: number; resendAfter: number; deliveryMode: "local-outbox" | "email" }
export default function AuthForm({ mode, next }: { mode: "login" | "signup"; next?: string }) {
  const signup = mode === "signup";
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<VerificationChallenge | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const focusInput = useRef<HTMLInputElement>(null);
  const previousStep = useRef(step);
  useEffect(() => { if (previousStep.current !== step) { previousStep.current = step; focusInput.current?.focus(); } }, [step]);
  useEffect(() => { if (!countdown) return; const timer = window.setTimeout(() => setCountdown((seconds) => Math.max(0, seconds - 1)), 1000); return () => window.clearTimeout(timer); }, [countdown]);
  async function request(endpoint: string, body: unknown) {
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Something went wrong. Try again.");
    return result;
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    if (signup && step === 0) { setStep(1); return; }
    setBusy(true);
    try {
      if (signup && step === 1) {
        const result = await request("/api/auth/signup", { email, password, displayName: name, ...(next ? { next } : {}) });
        setChallenge(result); setCountdown(result.resendAfter); setCode(""); setStep(2); setBusy(false); return;
      }
      const result = signup
        ? await request("/api/auth/verify", { challengeId: challenge?.challengeId, code })
        : await request("/api/auth/login", { email, password, ...(next ? { next } : {}) });
      clearLearnerBrowserState();
      if (result.preferences) restoreLearnerBrowserState(result.preferences);
      window.location.assign(result.next);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Couldn't connect. Please try again."); setBusy(false); }
  }
  async function resend() {
    if (!challenge || countdown || busy) return;
    setBusy(true); setError(null);
    try { const result = await request("/api/auth/resend", { challengeId: challenge.challengeId }); setChallenge({ ...challenge, ...result }); setCountdown(result.resendAfter); setCode(""); focusInput.current?.focus(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Couldn't request another code."); }
    finally { setBusy(false); }
  }
  const heading = !signup ? "Good to see you again." : step === 0 ? "A new chapter starts here." : step === 1 ? "Make it yours." : "One last little step.";
  const subtitle = !signup ? "Your questions, courses, and next discoveries are waiting." : step === 0 ? "First, a little introduction. We'll find your starting point together." : step === 1 ? "Choose a password to keep your learning space yours." : challenge?.deliveryMode === "local-outbox" ? `Enter the local code for ${email} to open your learning space.` : `Verify ${email} to open your learning space.`;
  return <div className={styles.page}>
    <section className={styles.formSide} aria-labelledby="auth-title">
      <Link href="/" className={styles.brand} aria-label="Museion home"><BrandMark className={styles.mark} />Museion</Link>
      <div className={styles.formCard}>
        {signup && <ol className={styles.progress} aria-label="Create your account">{["About you", "Password", "Verify"].map((label, index) => <li key={label} data-active={index === step} data-done={index < step} aria-current={index === step ? "step" : undefined}><span>{index < step ? "✓" : index + 1}</span>{label}</li>)}</ol>}
        <div key={step} className={styles.stage}>
          <p className={styles.eyebrow}>{signup ? "A place for your curiosity" : "Pick up where you left off"}</p>
          <h1 id="auth-title">{heading}</h1><p className={styles.subtitle}>{subtitle}</p>
          <form onSubmit={submit} className={styles.form} aria-busy={busy}>
            {signup && step === 0 && <label>Your name<input ref={focusInput} name="displayName" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={80} placeholder="What should we call you?" required disabled={busy} /></label>}
            {(!signup || step === 0) && <label>Email<input ref={!signup ? focusInput : undefined} name="email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" required disabled={busy} /></label>}
            {(!signup || step === 1) && <>
              <div className={styles.field}><label htmlFor="account-password">Password</label><div className={styles.password}><input ref={signup ? focusInput : undefined} id="account-password" name="password" value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} autoComplete={signup ? "new-password" : "current-password"} minLength={10} maxLength={128} required disabled={busy} aria-describedby={signup ? "password-help" : undefined} /><button type="button" disabled={busy} onClick={() => setShowPassword(!showPassword)} aria-pressed={showPassword} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button></div></div>
              {signup && <p id="password-help" className={styles.help}>At least 10 characters. A few memorable words work well.</p>}
            </>}
            {signup && step === 2 && <>
              <label>Verification code<input ref={focusInput} name="code" className={styles.code} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} placeholder="000000" required disabled={busy} aria-describedby="verification-help" /></label>
              <div id="verification-help" className={styles.delivery}>{challenge?.deliveryMode === "local-outbox" ? <><strong>Local verification</strong><p>Open the verification message in the private auth outbox on this computer. No email is sent or mailbox ownership verified in this build. The code expires after 10 minutes.</p><details className={styles.localReference}><summary>Local message reference</summary><code>{challenge.challengeId}</code></details></> : <p>Use the code in your verification email. It expires after 10 minutes.</p>}</div>
            </>}
            {error && <p role="alert" className={styles.error}>{error}</p>}
            <button type="submit" className={styles.submit} disabled={busy}>{busy ? (signup && step === 1 ? "Preparing your code…" : signup ? "Verifying…" : "Signing you in…") : !signup ? "Sign in" : step === 0 ? "Continue" : step === 1 ? "Get verification code" : "Verify & continue"}<span aria-hidden="true">↗</span></button>
          </form>
          {signup && step > 0 && <div className={styles.stepActions}><button type="button" disabled={busy} onClick={() => { setError(null); setStep(step === 2 ? 0 : step - 1); }}>← {step === 2 ? "Change details" : "Back"}</button>{step === 2 && <button type="button" disabled={busy || countdown > 0} onClick={() => void resend()}>{countdown ? `New code in ${countdown}s` : "Request another code"}</button>}</div>}
        </div>
        <p className={styles.switch}>{signup ? "Already have an account?" : "New to Museion?"} <Link href={`${signup ? "/login" : "/signup"}${next ? `?next=${encodeURIComponent(next)}` : ""}`}>{signup ? "Sign in" : "Create an account"}</Link></p>
        <p className={styles.legal}><Link href="/privacy">How we handle your data</Link> · <Link href="/terms">Using Museion</Link></p>
      </div>
      <Link href="/" className={styles.back}>← Back to Museion</Link>
    </section>
    <section className={styles.story} aria-label="Learning with Museion">
      <div className={styles.storyContent}><p className={styles.eyebrow}>Follow a little curiosity</p><h2>Big ideas.<br /><span>Small steps.</span><br />All yours.</h2><p>There’s a wonderful feeling in working something out. Let’s find more of it.</p></div>
      <p className={styles.storyFoot}>Your questions. Your pace. Your understanding.</p>
    </section>
  </div>;
}
