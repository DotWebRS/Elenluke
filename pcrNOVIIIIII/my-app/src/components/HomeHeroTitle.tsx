import { useEffect, useMemo, useState } from "react";
import { buildApiUrl } from "../config/apiBase";

type HeroCms = {
  titleLight?: string;
  rotateWords?: string[];
  subText?: string;
};

const CMS_SITE_KEY = "purple-crunch-records";
const CMS_KEY_HERO = "pcr.home.hero";

const DEFAULT_HERO: Required<HeroCms> = {
  titleLight: "LET'S BE",
  rotateWords: ["TIMELESS", "UNIGNORABLE"],
  subText: "YOUR SOUND. YOUR VISION. AMPLIFIED.",
};

function safeJsonParse<T>(value: any, fallback: T): T {
  try {
    if (!value) return fallback;
    if (typeof value === "string") return JSON.parse(value) as T;
    return value as T;
  } catch {
    return fallback;
  }
}

function normalizeHero(raw: HeroCms): Required<HeroCms> {
  return {
    titleLight: String(raw?.titleLight ?? DEFAULT_HERO.titleLight),
    rotateWords:
      Array.isArray(raw?.rotateWords) && raw.rotateWords.length ? raw.rotateWords : DEFAULT_HERO.rotateWords,
    subText: String(raw?.subText ?? DEFAULT_HERO.subText),
  };
}

function useTypeRotate(words: string[], speed = 70, holdMs = 1000, eraseMs = 24) {
  const list = useMemo(() => (words?.length ? words : ["TIMELESS"]), [words]);
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
      if (typed.length < full.length) t = window.setTimeout(() => setTyped(full.slice(0, typed.length + 1)), speed);
      else setMode("holding");
    } else if (mode === "holding") {
      t = window.setTimeout(() => setMode("erasing"), holdMs);
    } else {
      if (typed.length > 0) t = window.setTimeout(() => setTyped(full.slice(0, typed.length - 1)), eraseMs);
      else {
        setMode("typing");
        setWordIndex((p) => (p + 1) % list.length);
      }
    }

    return () => {
      if (t) window.clearTimeout(t);
    };
  }, [typed, mode, wordIndex, list, speed, holdMs, eraseMs]);

  return typed;
}

export default function HomeHeroTitle() {
  const [hero, setHero] = useState<Required<HeroCms>>(DEFAULT_HERO);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const url = buildApiUrl(
          `/api/cms?siteKey=${encodeURIComponent(CMS_SITE_KEY)}&key=${encodeURIComponent(CMS_KEY_HERO)}&ts=${Date.now()}`
        );

        const res = await fetch(url);
        if (!res.ok) return;

        const text = await res.text().catch(() => "");
        const dto = safeJsonParse<{ json?: any }>(text, {} as any);

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
    const arr = hero.rotateWords?.length ? hero.rotateWords : DEFAULT_HERO.rotateWords;
    return Math.max(...arr.map((w) => String(w || "").length), 1);
  }, [hero.rotateWords]);

  const displayTyped = typed.length ? typed : "\u00A0";

  return (
    <div className="heroTitle">
      <h1 className="heroTitle__h1">
        <span className="heroTitle__light">{hero.titleLight}</span>
        <span
          className="heroTitle__typed type-gradient"
          style={{ ["--typedW" as any]: `${maxLen}ch` }}
          aria-label={typed.length ? typed : hero.rotateWords[0]}
        >
          {displayTyped}
        </span>
      </h1>

      <p className="heroTitle__sub">{hero.subText}</p>
    </div>
  );
}
