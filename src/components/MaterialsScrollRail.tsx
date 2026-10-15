"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  className: string;
  stickyClassName: string;
  railClassName: string;
  intro: ReactNode;
  footer: ReactNode;
  children: ReactNode;
};

/** Vertical page progress moves a native horizontal scroller. There are no
 * wheel, touch, or keyboard listeners: visitors can still scroll it directly. */
export default function MaterialsScrollRail({ className, stickyClassName, railClassName, intro, footer, children }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    const rail = railRef.current;
    if (!section || !sticky || !rail) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const shortViewport = window.matchMedia("(max-height: 640px)");
    let frame = 0;
    let active = false;
    let overflow = 0;
    let top = 80;

    const update = () => {
      frame = 0;
      if (!active) return;
      const distance = Math.max(1, section.offsetHeight - sticky.offsetHeight);
      const progress = Math.min(1, Math.max(0, (top - section.getBoundingClientRect().top) / distance));
      rail.scrollLeft = progress * overflow;
    };
    const schedule = () => {
      if (active && !frame) frame = requestAnimationFrame(update);
    };
    const configure = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      active = false;
      if (reducedMotion.matches || shortViewport.matches) {
        section.removeAttribute("data-scroll-driven");
        section.style.removeProperty("--material-panel-height");
        section.style.removeProperty("--material-scroll-distance");
        return;
      }
      section.setAttribute("data-scroll-driven", "true");
      top = Number.parseFloat(getComputedStyle(sticky).top) || 80;
      overflow = Math.max(0, rail.scrollWidth - rail.clientWidth);
      const panelHeight = sticky.offsetHeight;
      if (overflow < 24 || panelHeight > window.innerHeight - top) {
        section.removeAttribute("data-scroll-driven");
        return;
      }
      section.style.setProperty("--material-panel-height", `${panelHeight}px`);
      section.style.setProperty("--material-scroll-distance", `${Math.max(420, overflow)}px`);
      active = true;
      update();
    };
    configure();
    const resizeObserver = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(configure);
    resizeObserver?.observe(rail);
    reducedMotion.addEventListener("change", configure);
    shortViewport.addEventListener("change", configure);
    window.addEventListener("resize", configure);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("pageshow", configure);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      reducedMotion.removeEventListener("change", configure);
      shortViewport.removeEventListener("change", configure);
      window.removeEventListener("resize", configure);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("pageshow", configure);
    };
  }, []);

  return (
    <section ref={sectionRef} className={className} aria-labelledby="materials-title">
      <div ref={stickyRef} className={stickyClassName}>
        {intro}
        <div ref={railRef} className={railClassName} role="region" aria-label="Learning materials. Scroll horizontally to explore all five." tabIndex={0}>
          {children}
        </div>
        {footer}
      </div>
    </section>
  );
}
