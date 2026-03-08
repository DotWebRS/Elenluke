import { useEffect, useRef, useState } from "react";

type Phase = "idle" | "in" | "out";

export function useInViewFade<T extends HTMLElement>(opts?: {
  enterRatio?: number; // kad se smatra "vidljivo"
  exitRatio?: number; // kad se smatra "izlazi"
  rootMargin?: string;
}) {
  const ref = useRef<T | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  const enterRatio = opts?.enterRatio ?? 0.22;
  const exitRatio = opts?.exitRatio ?? 0.08;
  const rootMargin = opts?.rootMargin ?? "0px 0px -10% 0px";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        const r = e.intersectionRatio;

        if (e.isIntersecting && r >= enterRatio) {
          setPhase("in");
          return;
        }

        if (r <= exitRatio) {
          setPhase("out");
          return;
        }
      },
      {
        threshold: [0, exitRatio, enterRatio, 0.35, 0.5, 0.75, 1],
        root: null,
        rootMargin,
      },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [enterRatio, exitRatio, rootMargin]);

  return { ref, phase };
}
