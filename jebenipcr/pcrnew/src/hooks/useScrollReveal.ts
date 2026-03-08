import { useEffect, useRef } from "react";

type RevealState = "reveal-active" | "reveal-below" | "reveal-above";

export default function useScrollReveal() {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const setState = (state: RevealState) => {
      el.classList.remove("reveal-active", "reveal-below", "reveal-above");
      el.classList.add(state);
    };

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;

        if (e.isIntersecting) {
          setState("reveal-active");
          return;
        }

        const r = el.getBoundingClientRect();
        const below = r.top > window.innerHeight * 0.55;
        setState(below ? "reveal-below" : "reveal-above");
      },
      {
        root: null,
        threshold: 0.18,
        rootMargin: "-12% 0px -12% 0px",
      },
    );

    io.observe(el);
    // init
    setState("reveal-below");

    return () => io.disconnect();
  }, []);

  return ref;
}
