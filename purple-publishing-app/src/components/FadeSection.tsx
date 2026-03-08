import { useEffect, useRef } from "react";

type FadeSectionProps = {
  id?: string;
  className?: string;
  children: React.ReactNode;
};

export default function FadeSection({
  id,
  className = "",
  children,
}: FadeSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reduce.matches) {
      el.style.setProperty("--fade-progress", "1");
      return;
    }

    let raf = 0;

    const clamp = (value: number, min: number, max: number) =>
      Math.max(min, Math.min(max, value));

    const update = () => {
      raf = 0;

      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;

      const enterDistance = vh * 0.92;
      const exitDistance = vh * 0.72;

      const enterProgress = clamp((vh - rect.top) / enterDistance, 0, 1);
      const exitProgress = clamp(rect.bottom / exitDistance, 0, 1);

      const rawProgress = Math.min(enterProgress, exitProgress);
      const easedProgress = rawProgress * rawProgress * (3 - 2 * rawProgress);

      el.style.setProperty("--fade-progress", String(easedProgress));
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section
      id={id}
      ref={sectionRef}
      className={className}
      style={{ ["--fade-progress" as any]: 0 }}
    >
      {children}
    </section>
  );
}