import React, { useEffect, useMemo, useState } from "react";

type InitialMode = "enter" | "hidden" | "static";

type ScrollAnimateProps = {
  targetRef: React.RefObject<Element | null>;
  enter: string; // "animate__fadeInUpBig"
  exit: string;  // "animate__fadeOutRightBig"
  initialMode?: InitialMode; // Hero: "enter", About: "hidden"
  enterMs?: number;
  exitMs?: number;
  className?: string;
  style?: React.CSSProperties;
  threshold?: number;
  rootMargin?: string;
  children: React.ReactNode;
};

export function ScrollAnimate({
  targetRef,
  enter,
  exit,
  initialMode = "hidden",
  enterMs = 950,
  exitMs = 1100,
  className,
  style,
  threshold = 0.22,
  rootMargin = "0px 0px -12% 0px",
  children,
}: ScrollAnimateProps) {
  const [inView, setInView] = useState(false);
  const [hasEverBeenInView, setHasEverBeenInView] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(!!mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  useEffect(() => {
    const el = targetRef.current;
    if (!el || reduceMotion) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        const isIn = entry.isIntersecting;
        setInView(isIn);
        if (isIn) setHasEverBeenInView(true);
      },
      { threshold, rootMargin }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [targetRef, threshold, rootMargin, reduceMotion]);

  const phase: "static" | "hidden" | "enter" | "exit" = useMemo(() => {
    if (reduceMotion) return "static";

    // pre prvog realnog ulaska u viewport:
    if (!hasEverBeenInView) {
      if (initialMode === "static") return "static";
      if (initialMode === "enter") return "enter";
      return "hidden";
    }

    // posle toga: normalno enter/exit na scroll
    return inView ? "enter" : "exit";
  }, [reduceMotion, hasEverBeenInView, initialMode, inView]);

  const animClass = useMemo(() => {
    if (reduceMotion) return className || "";

    if (phase === "static") return (className || "").trim();
    if (phase === "hidden") return `scroll-hidden ${className || ""}`.trim();

    const which = phase === "enter" ? enter : exit;
    return `scroll-anim animate__animated ${which} ${className || ""}`.trim();
  }, [reduceMotion, phase, enter, exit, className]);

  const duration = phase === "exit" ? exitMs : enterMs;

  return (
    <div
      className={animClass}
      style={{
        ...(phase === "enter" || phase === "exit"
          ? { ["--animate-duration" as any]: `${duration}ms` }
          : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
