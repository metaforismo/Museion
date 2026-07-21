"use client";

import { useEffect, useRef, type ReactNode } from "react";

export default function LandingMotion({ className, children }: { className?: string; children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealNodes = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    const stages = Array.from(root.querySelectorAll<HTMLElement>("[data-scroll-stage]"));

    const setStageState = (stage: HTMLElement, progress: number) => {
      let nextPhase = "";

      if (stage.dataset.scrollStage === "promise") {
        nextPhase = progress < 0.28 ? "cluster" : progress < 0.72 ? "story" : "resolved";
      }

      if (stage.dataset.scrollStage === "manifesto") {
        nextPhase = progress < 0.33 ? "create" : progress < 0.67 ? "think" : "transfer";
      }

      if (nextPhase && stage.dataset.phase !== nextPhase) stage.dataset.phase = nextPhase;
    };

    if (reducedMotion) {
      root.setAttribute("data-reduced-motion", "true");
      revealNodes.forEach((node) => node.setAttribute("data-visible", "true"));
      stages.forEach((stage) => {
        stage.dataset.phase = stage.dataset.scrollStage === "manifesto" ? "all" : "story";
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).setAttribute("data-visible", "true");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12%", threshold: 0.08 },
    );
    revealNodes.forEach((node) => observer.observe(node));

    let frame = 0;
    const updateStages = () => {
      frame = 0;
      const viewport = window.innerHeight;
      stages.forEach((stage) => {
        const rect = stage.getBoundingClientRect();
        const span = Math.max(1, rect.height - viewport);
        const progress = Math.min(1, Math.max(0, (72 - rect.top) / span));
        setStageState(stage, progress);
      });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(updateStages);
    };
    updateStages();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}
