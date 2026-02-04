import { useEffect, useMemo, useRef, useState } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { ThreeLogo } from "./ThreeLogo";
import { API_BASE } from "../config/apiBase";

type HeroCms = {
  prefixes: string[];
  typeWords: string[];
  subtext: string;
};

const DEFAULT: HeroCms = {
  prefixes: ["BUILT FOR", "EMPOWERING", "ELEVATING"],
  typeWords: ["SONGWRITERS.", "CREATORS.", "TALENT."],
  subtext:
    "Your trusted partner in music publishing, global rights administration, and creative career growth.",
};

function buildUrl(path: string) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return base ? `${base}/${p}` : `/${p}`;
}

function useParallelTypeOnce({ words, speed = 85 }: { words: string[]; speed?: number }) {
  const safeWords = useMemo(() => {
    const w = [...(words || [])];
    while (w.length < 3) w.push("");
    return w.slice(0, 3);
  }, [words]);

  const [typed, setTyped] = useState<string[]>(["", "", ""]);
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setTyped(["", "", ""]);
    setIdx(0);
    setDone(false);
  }, [safeWords.join("|")]);

  useEffect(() => {
    if (done) return;

    const longest = Math.max(0, ...safeWords.map((w) => w.length));
    if (idx >= longest) {
      setDone(true);
      return;
    }

    const t = window.setTimeout(() => {
      setTyped([
        safeWords[0].slice(0, idx + 1),
        safeWords[1].slice(0, idx + 1),
        safeWords[2].slice(0, idx + 1),
      ]);
      setIdx((p) => p + 1);
    }, speed);

    return () => window.clearTimeout(t);
  }, [idx, safeWords, speed, done]);

  return { typed, safeWords, done };
}

type Phase = "enter" | "exit";

const ENTER_CLASS = "animate__fadeInUpBig";
const EXIT_CLASS = "animate__fadeOutRightBig";

const Hero = () => {
  const [cms, setCms] = useState<HeroCms>(DEFAULT);

  const heroRef = useRef<HTMLElement | null>(null);
  const animRef = useRef<HTMLDivElement | null>(null);

  const [phase, setPhase] = useState<Phase>("enter");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const siteKey = "purple-crunch-publishing";
    const key = "home.hero";
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

        let data: any = null;
        try {
          data = JSON.parse(wrapper.json);
        } catch {
          return;
        }

        setCms({
          prefixes: Array.isArray(data?.prefixes) ? data.prefixes : DEFAULT.prefixes,
          typeWords: Array.isArray(data?.typeWords) ? data.typeWords : DEFAULT.typeWords,
          subtext: typeof data?.subtext === "string" ? data.subtext : DEFAULT.subtext,
        });
      })
      .catch(() => {});
  }, []);

  // 1) Na load: okini enter animaciju (garantovano)
  useEffect(() => {
    const el = animRef.current;
    if (!el) return;

    // čekaj 1 frame da browser “vidi” initial state, pa tek onda dodaj animaciju
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // 2) Scroll: kad hero uđe/izađe iz viewport-a menjaj phase
  useEffect(() => {
    const section = heroRef.current;
    if (!section) return;

    let hasBeenInView = false;

    const obs = new IntersectionObserver(
      ([entry]) => {
        const isIn = entry.isIntersecting;

        if (isIn) {
          hasBeenInView = true;
          setPhase("enter");
        } else {
          // ne puštaj exit dok ga bar jednom nisi video (safety)
          if (hasBeenInView) setPhase("exit");
        }
      },
      {
        threshold: 0.35,
        rootMargin: "0px 0px -12% 0px",
      }
    );

    obs.observe(section);
    return () => obs.disconnect();
  }, []);

  // 3) Prava “replay” animacije: remove → reflow → add
  useEffect(() => {
    const el = animRef.current;
    if (!el || !ready) return;

    const cls = phase === "enter" ? ENTER_CLASS : EXIT_CLASS;
    const dur = phase === "enter" ? "950ms" : "1100ms";

    el.style.setProperty("--animate-duration", dur);

    // reset
    el.classList.remove(ENTER_CLASS, EXIT_CLASS);
    // reflow = restart animacije
    void el.offsetWidth;
    // play
    el.classList.add("animate__animated", cls);
  }, [phase, ready]);

  const safePrefixes = useMemo(() => {
    const a = [...(cms.prefixes || [])];
    while (a.length < 3) a.push("");
    return a.slice(0, 3);
  }, [cms.prefixes]);

  const { typed, safeWords } = useParallelTypeOnce({ words: cms.typeWords, speed: 85 });

  return (
    <section className="hero-section" id="hero" ref={heroRef as any}>
      <div className="logo-scroll-wrapper" aria-hidden="true">
        <ThreeLogo />
      </div>

      <Container fluid className="hero-inner">
        <Row className="justify-content-center">
          <Col xs={12} md={10} lg={8} className="hero-content hero-content--no-css-anim">
            {/* Animiramo OVAJ unutrašnji sloj, ne .hero-content */}
            <div ref={animRef}>
              <h1 className="hero-headline">
                {[0, 1, 2].map((i) => {
                  const full = safeWords[i] || "";
                  const t = typed[i] || "";
                  const rest = full.slice(t.length);

                  return (
                    <span className="hero-line" key={i}>
                      <span className="hero-line-inner">
                        <span className="hero-prefix">{safePrefixes[i]}</span>
                        <span className="type-gradient typeword">
                          <span className="type-typed">{t}</span>
                          <span className="type-ghost">{rest}</span>
                        </span>
                      </span>
                    </span>
                  );
                })}
              </h1>

              <p className="hero-subtext">{cms.subtext}</p>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Hero;
