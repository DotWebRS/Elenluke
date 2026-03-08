import { useEffect, useMemo, useState } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { ThreeLogo } from "./ThreeLogo";
import { API_BASE } from "../config/apiBase";
import FadeSection from "./FadeSection";
import Snow from "./Snow";

type HeroCms = {
  prefixes: string[];
  typeWords: string[];
  subtext: string;
};

function buildUrl(path: string) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return base ? `${base}/${p}` : `/${p}`;
}

function normalizeHeroCms(data: any): HeroCms {
  const prefixes = Array.isArray(data?.prefixes)
    ? data.prefixes.map((item: unknown) => String(item ?? "").trim()).slice(0, 3)
    : [];

  const typeWords = Array.isArray(data?.typeWords)
    ? data.typeWords.map((item: unknown) => String(item ?? "").trim()).slice(0, 3)
    : [];

  while (prefixes.length < 3) prefixes.push("");
  while (typeWords.length < 3) typeWords.push("");

  return {
    prefixes,
    typeWords,
    subtext: typeof data?.subtext === "string" ? data.subtext.trim() : "",
  };
}

function useParallelTypeOnce({
  words,
  speed = 85,
  enabled,
}: {
  words: string[];
  speed?: number;
  enabled: boolean;
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
    setTyped(enabled ? ["", "", ""] : safeWords);
    setIdx(0);
    setDone(!enabled);
  }, [safeWords, enabled]);

  useEffect(() => {
    if (!enabled || done) return;

    const longest = Math.max(0, ...safeWords.map((w) => w.length));

    if (idx >= longest) {
      setDone(true);
      return;
    }

    const timeout = window.setTimeout(() => {
      setTyped([
        safeWords[0].slice(0, idx + 1),
        safeWords[1].slice(0, idx + 1),
        safeWords[2].slice(0, idx + 1),
      ]);
      setIdx((prev) => prev + 1);
    }, speed);

    return () => window.clearTimeout(timeout);
  }, [idx, safeWords, speed, done, enabled]);

  return { typed, safeWords };
}

const Hero = () => {
  const [cms, setCms] = useState<HeroCms | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadHero = async () => {
      try {
        const siteKey = "purple-crunch-publishing";
        const key = "home.hero";

        const url = buildUrl(
          `/api/cms?siteKey=${encodeURIComponent(siteKey)}&key=${encodeURIComponent(key)}&ts=${Date.now()}`
        );

        const response = await fetch(url, {
          method: "GET",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          setCms({
            prefixes: ["", "", ""],
            typeWords: ["", "", ""],
            subtext: "",
          });
          return;
        }

        const wrapper = await response.json();

        if (!wrapper?.json) {
          setCms({
            prefixes: ["", "", ""],
            typeWords: ["", "", ""],
            subtext: "",
          });
          return;
        }

        const parsed = JSON.parse(wrapper.json);
        setCms(normalizeHeroCms(parsed));
      } catch (error: any) {
        if (error?.name === "AbortError") return;

        setCms({
          prefixes: ["", "", ""],
          typeWords: ["", "", ""],
          subtext: "",
        });
      }
    };

    loadHero();

    return () => controller.abort();
  }, []);

  const prefixes = useMemo(() => {
    if (!cms) return ["", "", ""];
    const arr = [...cms.prefixes];
    while (arr.length < 3) arr.push("");
    return arr.slice(0, 3);
  }, [cms]);

  const typeWords = useMemo(() => {
    if (!cms) return ["", "", ""];
    const arr = [...cms.typeWords];
    while (arr.length < 3) arr.push("");
    return arr.slice(0, 3);
  }, [cms]);

  const { typed, safeWords } = useParallelTypeOnce({
    words: typeWords,
    speed: 85,
    enabled: !!cms,
  });

  return (
    <FadeSection id="hero" className="hero-section">
      <Snow className="hero-snow" />
      <div className="logo-scroll-wrapper" aria-hidden="true">
        <ThreeLogo />
      </div>

      <Container fluid className="hero-inner">
        <Row className="justify-content-center">
          <Col xs={12} md={10} lg={8} className="hero-content">
            <h1 className="hero-headline">
              {[0, 1, 2].map((i) => {
                const full = safeWords[i] || "";
                const current = typed[i] || "";
                const rest = full.slice(current.length);

                return (
                  <span className="hero-line" key={i}>
                    <span className="hero-line-inner">
                      <span className="hero-prefix">{prefixes[i]}</span>
                      <span className="type-gradient typeword">
                        <span className="type-typed">{current}</span>
                        <span className="type-ghost">{rest}</span>
                      </span>
                    </span>
                  </span>
                );
              })}
            </h1>

            {cms?.subtext && <p className="hero-subtext">{cms.subtext}</p>}
          </Col>
        </Row>
      </Container>
    </FadeSection>
  );
};

export default Hero;