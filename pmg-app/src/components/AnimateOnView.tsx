import { useEffect, useRef, useState } from "react";
import type { ReactNode, CSSProperties } from "react";

type Phase = "idleOut" | "animIn" | "idleIn" | "animOut";

type Props = {
  children: ReactNode;
  className?: string;

  inClass?: string;
  outClass?: string;

  playOnce?: boolean;

 
  fadeOnlyBelow?: number;


  style?: CSSProperties;
};

export default function AnimateOnView({
  children,
  className,
  inClass = "animate__fadeInUp",
  outClass = "animate__fadeOut",
  playOnce = false,
  fadeOnlyBelow = 0,
  style,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  const [phase, setPhase] = useState<Phase>("idleOut");
  const phaseRef = useRef<Phase>("idleOut");

  const cooldownRef = useRef<number>(0);

  const hasPlayedInRef = useRef<boolean>(false);

  const pickClasses = () => {
    if (fadeOnlyBelow > 0 && typeof window !== "undefined" && window.innerWidth <= fadeOnlyBelow) {
      return { inC: "animate__fadeIn", outC: "animate__fadeOut" };
    }
    return { inC: inClass, outC: outClass };
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ENTER_RATIO = 0.22; 
    const EXIT_RATIO = 0.06;  

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
          if (playOnce && hasPlayedInRef.current) {
            phaseRef.current = "idleIn";
            setPhase("idleIn");
            return;
          }

          phaseRef.current = "animIn";
          setPhase("animIn");
          cooldownRef.current = now + 220;
          return;
        }

        // EXIT
        if ((current === "idleIn" || current === "animIn") && r <= EXIT_RATIO) {
          phaseRef.current = "animOut";
          setPhase("animOut");
          cooldownRef.current = now + 220;
          return;
        }
      },
      {
        rootMargin: "-16% 0px -16% 0px",
        threshold: [0, EXIT_RATIO, ENTER_RATIO, 0.6, 1],
      }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [playOnce, fadeOnlyBelow, inClass, outClass]);

  const onAnimationEnd = () => {
    const current = phaseRef.current;

    if (current === "animIn") {
      hasPlayedInRef.current = true;
      phaseRef.current = "idleIn";
      setPhase("idleIn");
      return;
    }

    if (current === "animOut") {
      
      phaseRef.current = "idleOut";
      setPhase("idleOut");
      return;
    }
  };

  const { inC, outC } = pickClasses();

  const base = "aov";
  const hidden = phase === "idleOut" ? "aov--hidden" : "";

  const anim =
    phase === "animIn"
      ? `animate__animated ${inC}`
      : phase === "animOut"
      ? `animate__animated ${outC}`
      : "";

  return (
    <div
      ref={ref}
      onAnimationEnd={onAnimationEnd}
      className={[base, hidden, anim, className].filter(Boolean).join(" ")}
      style={style}
    >
      {children}
    </div>
  );
}
