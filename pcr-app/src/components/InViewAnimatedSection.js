import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
function isElementInView(el, threshold) {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    // vidljiva visina elementa u viewportu
    const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
    const height = Math.max(1, r.height);
    const ratio = Math.max(0, Math.min(1, visible / height));
    return ratio >= threshold;
}
export default function InViewAnimatedSection({ children, className = "", durationMs = 650, threshold = 0.25, rootMargin = "0px 0px -10% 0px", }) {
    const ref = useRef(null);
    // null = još nije izračunato (sprečava “prvi flip”)
    const [inView, setInView] = useState(null);
    // 1) Odmah izračunaj stanje na mount (pre prvog paint-a) -> nema treperenja
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el)
            return;
        setInView(isElementInView(el, threshold));
    }, [threshold]);
    // 2) Observer posle toga samo održava stanje
    useEffect(() => {
        const el = ref.current;
        if (!el)
            return;
        const io = new IntersectionObserver(([entry]) => {
            // histereza: koristi ratio umesto isIntersecting (stabilnije)
            const ratio = entry.intersectionRatio;
            setInView((prev) => {
                const prevVal = prev ?? false;
                // Ako smo već IN, nemoj da pređe u OUT dok baš ne padne ispod (threshold - 0.06)
                // Ako smo OUT, nemoj da pređe u IN dok ne pređe (threshold + 0.06)
                const band = 0.06;
                const enterT = Math.min(0.95, threshold + band);
                const exitT = Math.max(0.05, threshold - band);
                if (prevVal)
                    return ratio >= exitT;
                return ratio >= enterT;
            });
        }, {
            threshold: Array.from({ length: 21 }, (_, i) => i / 20),
            rootMargin,
        });
        io.observe(el);
        return () => io.disconnect();
    }, [threshold, rootMargin]);
    // dok ne znamo stanje: ne stavljaj OUT/IN klase (sprečava blink)
    const animClass = inView === null
        ? ""
        : inView
            ? "animate__animated animate__slideInRight"
            : "animate__animated animate__slideOutLeft";
    return (_jsx("section", { ref: ref, className: `${className} ${animClass}`, style: {
            animationDuration: `${durationMs}ms`,
            willChange: "transform, opacity",
            overflow: "hidden",
        }, children: children }));
}
