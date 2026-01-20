import { useEffect, useState } from "react";

export function useInViewOnce(
  ref: React.RefObject<HTMLElement | null>,
  options?: IntersectionObserverInit
) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || isVisible) return;

    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        obs.disconnect();
      }
    }, options);

    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, isVisible, options]);

  return isVisible;
}
