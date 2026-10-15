"use client";

import { useEffect, useRef, type ReactNode } from "react";

export default function LandingMotion({ className, children }: { className?: string; children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const shortViewport = window.matchMedia("(max-height: 640px)");
    const revealNodes = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    const stages = Array.from(root.querySelectorAll<HTMLElement>("[data-scroll-stage]"));
    let observer: IntersectionObserver | undefined;
    let frame = 0;
    let staticMotion = false;

    const updateStages = () => {
      frame = 0;
      if (staticMotion) return;
      stages.forEach((stage) => {
        const sticky = stage.firstElementChild as HTMLElement | null;
        if (!sticky || stage.dataset.motionStatic === "true") return;
        const rect = stage.getBoundingClientRect();
        const top = Number.parseFloat(window.getComputedStyle(sticky).top) || 80;
        const span = Math.max(1, rect.height - sticky.getBoundingClientRect().height);
        const progress = Math.min(1, Math.max(0, (top - rect.top) / span));
        const phase = stage.dataset.scrollStage === "promise"
          ? progress < 0.18 ? "cluster" : progress < 0.78 ? "story" : "resolved"
          : progress < 0.33 ? "create" : progress < 0.67 ? "think" : "transfer";
        if (stage.dataset.phase !== phase) stage.dataset.phase = phase;
      });
    };

    const onScroll = () => {
      if (!staticMotion && !frame) frame = requestAnimationFrame(updateStages);
    };

    const configure = () => {
      observer?.disconnect();
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      staticMotion = preference.matches || shortViewport.matches || !("IntersectionObserver" in window);
      revealNodes.forEach((node) => node.setAttribute("data-visible", "true"));
      root.toggleAttribute("data-motion-ready", !staticMotion);
      if (!staticMotion) root.setAttribute("data-motion-ready", "true");
      root.setAttribute("data-motion-static", String(staticMotion));
      stages.forEach((stage) => {
        const sticky = stage.firstElementChild as HTMLElement | null;
        // A sticky scene must fit below the actual header. Otherwise a short
        // screen clips the text while retaining the extra scroll distance.
        stage.removeAttribute("data-motion-static");
        const top = sticky ? Number.parseFloat(window.getComputedStyle(sticky).top) || 80 : 80;
        const doesNotFit = stage.dataset.scrollStage === "promise" && !!sticky && (sticky.getBoundingClientRect().height > window.innerHeight - top + 1
          || sticky.scrollHeight > sticky.clientHeight + 1);
        stage.dataset.motionStatic = String(staticMotion || doesNotFit);
        if (staticMotion || doesNotFit) stage.dataset.phase = stage.dataset.scrollStage === "promise" ? "story" : "all";
      });
      if (staticMotion) return;

      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).setAttribute("data-visible", "true");
            observer?.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -32px 0px", threshold: 0.05 });
      revealNodes.forEach((node) => {
        if (node.getBoundingClientRect().top >= window.innerHeight) {
          node.setAttribute("data-visible", "false");
          observer?.observe(node);
        }
      });
      updateStages();
    };

    configure();
    preference.addEventListener("change", configure);
    shortViewport.addEventListener("change", configure);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", configure);
    window.addEventListener("pageshow", onScroll);
    return () => {
      observer?.disconnect();
      preference.removeEventListener("change", configure);
      shortViewport.removeEventListener("change", configure);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", configure);
      window.removeEventListener("pageshow", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={rootRef} className={className}>{children}</div>;
}
