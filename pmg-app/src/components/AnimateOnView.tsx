import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  inClass?: string;  // npr. animate__fadeInLeftBig
  outClass?: string; // npr. animate__fadeOutUp
};

type Phase = "idleOut" | "animIn" | "idleIn" | "animOut";

export default function AnimateOnView({
  children,
  className,
  inClass = "animate__fadeInUpBig",
  outClass = "animate__fadeOutUp",
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState<Phase>("idleOut");
  const phaseRef = useRef<Phase>("idleOut");

  // prevents rapid flip-flop near boundary
  const cooldownRef = useRef<number>(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ENTER_RATIO = 0.22; // enter when clearly visible
    const EXIT_RATIO = 0.04;  // exit when almost gone

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        const now = performance.now();
        if (now < cooldownRef.current) return;

        const r = entry.intersectionRatio;
        const current = phaseRef.current;

        // ENTER
        if ((current === "idleOut" || current === "animOut") && r >= ENTER_RATIO) {
          phaseRef.current = "animIn";
          setPhase("animIn");
          cooldownRef.current = now + 250; // small hysteresis buffer
          return;
        }

        // EXIT
        if ((current === "idleIn" || current === "animIn") && r <= EXIT_RATIO) {
          phaseRef.current = "animOut";
          setPhase("animOut");
          cooldownRef.current = now + 250;
          return;
        }
      },
      {
        // central activation zone = less jitter
        rootMargin: "-18% 0px -18% 0px",
        threshold: [0, EXIT_RATIO, ENTER_RATIO, 0.6, 1],
      }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  // When animation finishes, go to idle state (no animation class => no restarts)
  const onAnimationEnd = () => {
    const current = phaseRef.current;
    if (current === "animIn") {
      phaseRef.current = "idleIn";
      setPhase("idleIn");
    } else if (current === "animOut") {
      phaseRef.current = "idleOut";
      setPhase("idleOut");
    }
  };

  const base = "aov";
  const hidden = phase === "idleOut" ? "aov--hidden" : "";

  const anim =
    phase === "animIn"
      ? `animate__animated ${inClass}`
      : phase === "animOut"
      ? `animate__animated ${outClass}`
      : ""; // idleIn / idleOut => no animate class (prevents flicker)

  return (
    <div
      ref={ref}
      onAnimationEnd={onAnimationEnd}
      className={[base, hidden, anim, className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}
