import { useEffect, useMemo, useRef, useState } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { API_BASE } from "../config/apiBase";

type AboutCms = { paragraphs: string[] };

const DEFAULT: AboutCms = {
  paragraphs: [
    "Purple Crunch Publishing is the creative backbone of the Purple Music Group. A home for songwriters, producers, and artists who want to shape the sound of the digital generation.",
  ],
};

function buildUrl(path: string) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return base ? `${base}/${p}` : `/${p}`;
}

type Phase = "hidden" | "enter" | "exit";

const ENTER_CLASS = "animate__fadeInUpBig";
const EXIT_CLASS = "animate__fadeOutRightBig";

export default function About() {
  const [cms, setCms] = useState<AboutCms>(DEFAULT);

  const sectionRef = useRef<HTMLElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<HTMLDivElement | null>(null);

  const [phase, setPhase] = useState<Phase>("hidden");
  const [reduceMotion, setReduceMotion] = useState(false);
  const hasEnteredOnce = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(!!mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  useEffect(() => {
    const siteKey = "purple-crunch-publishing";
    const key = "home.about";
    const url = buildUrl(
      `/api/cms?siteKey=${encodeURIComponent(siteKey)}&key=${encodeURIComponent(key)}&ts=${Date.now()}`
    );

    fetch(url)
      .then(async (r) => {
        if (r.status === 404) return null;
        if (!r.ok) return null;
        try {
          return await r.json();
        } catch {
          return null;
        }
      })
      .then((wrapper) => {
        if (!wrapper?.json) return;
        try {
          const data = JSON.parse(wrapper.json);
          const list = Array.isArray(data?.paragraphs) ? data.paragraphs : null;
          const p0 = list?.[0] ?? data?.text ?? DEFAULT.paragraphs[0];
          setCms({ paragraphs: [String(p0 || "").trim()] });
        } catch {}
      })
      .catch(() => {});
  }, []);

  // Parallax (ostaje kao ranije)
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 992px)");

    if (reduce.matches) {
      el.style.setProperty("--about-bg-y", "0px");
      el.style.setProperty("--about-orb-y", "0px");
      el.style.setProperty("--about-text-y", "0px");
      return;
    }

    let raf = 0;

    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;

      const progress = (vh - rect.top) / (vh + rect.height);
      const t = Math.max(0, Math.min(1, progress));

      const ease = (x: number) => 1 - Math.pow(1 - x, 3);
      const e = ease(t);

      const bgY = (e - 0.5) * 2 * 120;
      const orbY = (e - 0.5) * 2 * 170;
      const textY = (e - 0.5) * 2 * -40;

      el.style.setProperty("--about-bg-y", `${bgY}px`);
      el.style.setProperty("--about-orb-y", `${orbY}px`);
      el.style.setProperty("--about-text-y", `${textY}px`);
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    const mqHandler = () => {
      if (mobile.matches) {
        el.style.setProperty("--about-bg-y", "0px");
        el.style.setProperty("--about-orb-y", "0px");
        el.style.setProperty("--about-text-y", "0px");
      }
    };
    mobile.addEventListener?.("change", mqHandler);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      mobile.removeEventListener?.("change", mqHandler);
    };
  }, []);

  // Observer: gleda sentinel (centar About sekcije), ne ceo section
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || reduceMotion) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        const isInBand = entry.isIntersecting;

        if (isInBand) {
          hasEnteredOnce.current = true;
          setPhase("enter");
        } else {
          if (hasEnteredOnce.current) setPhase("exit");
        }
      },
      {
        threshold: 0,
        rootMargin: "-35% 0px -35% 0px", // centralna zona ekrana
      }
    );

    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [reduceMotion]);

  // Replay animacije (kao Hero)
  useEffect(() => {
    const el = animRef.current;
    if (!el) return;

    if (reduceMotion) {
      el.classList.remove("animate__animated", ENTER_CLASS, EXIT_CLASS);
      el.style.opacity = "1";
      el.style.transform = "none";
      return;
    }

    if (phase === "hidden") {
      el.classList.remove("animate__animated", ENTER_CLASS, EXIT_CLASS);
      el.style.opacity = "0";
      el.style.transform = "translate3d(0,18px,0)";
      return;
    }

    const cls = phase === "enter" ? ENTER_CLASS : EXIT_CLASS;
    const dur = phase === "enter" ? "980ms" : "1150ms";
    el.style.setProperty("--animate-duration", dur);

    el.classList.remove(ENTER_CLASS, EXIT_CLASS);
    void el.offsetWidth;
    el.classList.add("animate__animated", cls);
  }, [phase, reduceMotion]);

  const aboutText = useMemo(() => {
    return (cms.paragraphs?.[0] || DEFAULT.paragraphs[0] || "")
      .replace(/\r\n/g, "\n")
      .trim();
  }, [cms.paragraphs]);

  return (
    <section id="about" ref={sectionRef as any} className="about-section">
      {/* sentinel u centru sekcije */}
      <div
        ref={sentinelRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          height: 1,
          pointerEvents: "none",
        }}
      />

      <div className="about-orb" aria-hidden="true" />

      <div className="about-content">
        <Container>
          <Row className="justify-content-center">
            <Col xs={12} md={11} lg={9} className="about-inner">
              <div ref={animRef}>
                <h2 className="about-title about-title-centered">
                  ABOUT <span className="about-us-animated">US</span>
                </h2>

                <p className="about-text">{aboutText}</p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </section>
  );
}
