import { useEffect, useMemo, useState } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { ThreeLogo } from "./ThreeLogo";


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

function useParallelTypeOnce({
  words,
  speed = 55,
}: {
  words: string[];
  speed?: number;
}) {
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

  return { typed, done, safeWords };
}

const Hero = () => {
  const [cms, setCms] = useState<HeroCms>(DEFAULT);

  useEffect(() => {
    const siteKey = "purple-crunch-publishing";
    const key = "home.hero";
    const API_BASE =
      (import.meta as any).env?.VITE_API_BASE || "http://localhost:5284";

    fetch(
      `${API_BASE}/api/cms?siteKey=${encodeURIComponent(
        siteKey
      )}&key=${encodeURIComponent(key)}`
    )
      .then((r) => {
        if (r.status === 404) return null;
        return r.ok ? r.json() : null;
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

  const safePrefixes = useMemo(() => {
    const a = [...(cms.prefixes || [])];
    while (a.length < 3) a.push("");
    return a.slice(0, 3);
  }, [cms.prefixes]);

  const { typed, done, safeWords } = useParallelTypeOnce({
    words: cms.typeWords,
    speed: 85,
  });

  return (
    <section className="hero-section" id="hero">
      <div className="logo-scroll-wrapper" aria-hidden="true">
        <ThreeLogo />
      </div>

      <Container fluid className="hero-inner">
        <Row className="justify-content-center">
          <Col xs={12} md={10} lg={8} className="text-center hero-content">
            <h1 className="hero-headline ">
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
                        <span className={`type-caret ${done ? "is-off" : "is-on"}`}>|</span>
                        <span className="type-ghost">{rest}</span>
                      </span>
                    </span>
                  </span>
                );
              })}
            </h1>

            <p className="hero-subtext animate__animated animate__fadeInUp">{cms.subtext}</p>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Hero;
