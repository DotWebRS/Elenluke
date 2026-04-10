import { useEffect, useMemo, useState } from "react";
import FadeSection from "../components/FadeSection";
import Snow from "../components/Snow";
import { ThreeLogo } from "../components/ThreeLogo";
import { buildApiUrl } from "../config/apiBase";
import { Link } from "react-router-dom";

type HeroCms = {
  rotateWords?: string[];
  subLines?: string[];
  subText?: string;
  buttons?: {
    primaryLabel?: string;
    primaryHref?: string;
    secondaryLabel?: string;
    secondaryScrollTo?: string;
  };
};

const CMS_SITE_KEY = "purple-crunch-records";
const CMS_KEY_HERO = "pcr.home.hero";

const DEFAULT_HERO: Required<HeroCms> = {
  rotateWords: ["YOUR SOUND.", "YOUR VISION.", "AMPLIFIED."],
  subLines: ["MUSIC THAT DEFINES THE DIGITAL GENERATION"],
  subText: "",
  buttons: {
    primaryLabel: "SUBMIT DEMO",
    primaryHref: "/demo-upload",
    secondaryLabel: "",
    secondaryScrollTo: "",
  },
};

function safeJsonParse<T>(value: unknown, fallback: T): T {
  try {
    if (!value) return fallback;
    if (typeof value === "string") return JSON.parse(value) as T;
    return value as T;
  } catch {
    return fallback;
  }
}

function normalizeHero(raw: HeroCms): Required<HeroCms> {
  const rotateWords =
    Array.isArray(raw?.rotateWords) && raw.rotateWords.length
      ? raw.rotateWords.map((w) => String(w ?? "").trim()).filter(Boolean)
      : DEFAULT_HERO.rotateWords;

  let subLines =
    Array.isArray(raw?.subLines) && raw.subLines.length
      ? raw.subLines.map((line) => String(line ?? "").trim()).filter(Boolean)
      : [];

  if (!subLines.length) {
    const fallbackSubText = String(raw?.subText ?? "").trim();
    if (fallbackSubText) {
      subLines = fallbackSubText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    }
  }

  if (!subLines.length) {
    subLines = DEFAULT_HERO.subLines;
  }

  const buttons = {
    primaryLabel:
      String(raw?.buttons?.primaryLabel ?? DEFAULT_HERO.buttons.primaryLabel).trim() ||
      DEFAULT_HERO.buttons.primaryLabel,
    primaryHref:
      String(raw?.buttons?.primaryHref ?? DEFAULT_HERO.buttons.primaryHref).trim() ||
      DEFAULT_HERO.buttons.primaryHref,
    secondaryLabel:
      String(raw?.buttons?.secondaryLabel ?? DEFAULT_HERO.buttons.secondaryLabel).trim(),
    secondaryScrollTo:
      String(raw?.buttons?.secondaryScrollTo ?? DEFAULT_HERO.buttons.secondaryScrollTo).trim(),
  };

  return {
    rotateWords: rotateWords.length ? rotateWords : DEFAULT_HERO.rotateWords,
    subLines,
    subText: "",
    buttons,
  };
}

function useTypeRotate(
  words: string[],
  speed = 70,
  holdMs = 1000,
  eraseMs = 24
) {
  const list = useMemo(
    () => (words?.length ? words : DEFAULT_HERO.rotateWords),
    [words]
  );

  const [wordIndex, setWordIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [mode, setMode] = useState<"typing" | "holding" | "erasing">("typing");

  useEffect(() => {
    setWordIndex(0);
    setTyped("");
    setMode("typing");
  }, [list.join("|")]);

  useEffect(() => {
    const full = list[wordIndex] || "";
    let t: number | undefined;

    if (mode === "typing") {
      if (typed.length < full.length) {
        t = window.setTimeout(() => {
          setTyped(full.slice(0, typed.length + 1));
        }, speed);
      } else {
        setMode("holding");
      }
    } else if (mode === "holding") {
      t = window.setTimeout(() => setMode("erasing"), holdMs);
    } else {
      if (typed.length > 0) {
        t = window.setTimeout(() => {
          setTyped(full.slice(0, typed.length - 1));
        }, eraseMs);
      } else {
        setMode("typing");
        setWordIndex((prev) => (prev + 1) % list.length);
      }
    }

    return () => {
      if (t) window.clearTimeout(t);
    };
  }, [typed, mode, wordIndex, list, speed, holdMs, eraseMs]);

  return typed;
}

export default function Hero() {
  const [hero, setHero] = useState<Required<HeroCms>>(DEFAULT_HERO);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const url = buildApiUrl(
          `/api/cms?siteKey=${encodeURIComponent(
            CMS_SITE_KEY
          )}&key=${encodeURIComponent(CMS_KEY_HERO)}&ts=${Date.now()}`
        );

        const res = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) return;

        const text = await res.text().catch(() => "");
        const dto = safeJsonParse<{ json?: unknown }>(text, {});
        const payload = safeJsonParse<HeroCms>(dto?.json, DEFAULT_HERO);
        const normalized = normalizeHero(payload);

        if (alive) setHero(normalized);
      } catch {
        //
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const typed = useTypeRotate(hero.rotateWords, 70, 1000, 24);

  const maxLen = useMemo(() => {
    const arr = hero.rotateWords?.length
      ? hero.rotateWords
      : DEFAULT_HERO.rotateWords;
    return Math.max(...arr.map((w) => String(w || "").length), 1);
  }, [hero.rotateWords]);

  const displayTyped = typed.length ? typed : "\u00A0";

  return (
    <FadeSection id="home" className="hero-section">
      <Snow className="hero-snow" />

      <div className="logo-scroll-wrapper" aria-hidden="true">
        <ThreeLogo />
      </div>

      <div className="hero-inner">
        <div className="hero-content">
          <div className="heroTitle heroTitle--center">
            <h1 className="hero-headline hero-headline--recordsOnly">
              <span
                className="type-gradient typeword heroTitle__typed heroTitle__typed--solo"
                style={{ ["--typedW" as any]: `${maxLen}ch` }}
                aria-label={typed.length ? typed : hero.rotateWords[0]}
              >
                <span className="type-typed">{displayTyped}</span>
              </span>
            </h1>

            {!!hero.subLines?.length && (
              <div className="hero-subtext-wrap hero-subtext-wrap--center">
                {hero.subLines.map((line, index) => (
                  <p
                    key={`${line}-${index}`}
                    className="hero-subtext hero-subtext--center"
                  >
                    {line}
                  </p>
                ))}
              </div>
            )}

            {!!hero.buttons?.primaryLabel && (
              <div className="hero-cta-wrap hero-cta-wrap--center">
                <Link
                  to="/contact?type=demo"
                  className="hero-cta hero-cta--primary"
                >
                  {hero.buttons.primaryLabel}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </FadeSection>
  );
}