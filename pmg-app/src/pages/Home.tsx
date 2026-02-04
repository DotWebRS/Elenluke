import { useEffect, useRef, useState } from "react";
import BrandCarousel from "../components/BrandCarousel";
import Snow from "../components/Snow";
import { PMG_COPY } from "../content/copy";
import { API_BASE, buildApiUrl } from "../config/apiBase";
import "../styles/Hero.css";

console.log("[DBG] API_BASE =", API_BASE);

type HeroCmsPayload = {
  title: string;
  lines: string[];
  locations: string;
};

const CMS_SITE_KEY = "purple-music-group";
const CMS_KEY_HERO = "home.hero";

function safeJsonParse<T>(value: any, fallback: T): T {
  try {
    if (!value) return fallback;
    if (typeof value === "string") return JSON.parse(value) as T;
    return value as T;
  } catch {
    return fallback;
  }
}

export default function Home() {
  const brandsRef = useRef<HTMLElement>(null);
  const [heroOut, setHeroOut] = useState(false);
  const [heroCms, setHeroCms] = useState<HeroCmsPayload | null>(null);

  useEffect(() => {
    const el = brandsRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        setHeroOut(e.isIntersecting);
      },
      { threshold: 0.18, rootMargin: "-25% 0px -25% 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  
  useEffect(() => {
    let alive = true;

    async function loadHero() {
      try {
        const url = buildApiUrl(
          `/api/cms?siteKey=${encodeURIComponent(
            CMS_SITE_KEY
          )}&key=${encodeURIComponent(CMS_KEY_HERO)}&ts=${Date.now()}`
        );

        console.log("[PMG hero] GET", url);

        const res = await fetch(url);
        console.log("[PMG hero] status", res.status);

        if (res.status === 404) {
          console.log("[PMG hero] 404 – nema CMS unosa, ostaje default");
          return;
        }

        if (!res.ok) {
          console.log("[PMG hero] !res.ok");
          return;
        }

        const raw: any = await res.json().catch(() => null);
        console.log("[PMG hero] raw response", raw);

        const payload = safeJsonParse<HeroCmsPayload>(raw?.json, {
          title: "",
          lines: [],
          locations: "",
        });

        console.log("[PMG hero] parsed payload", payload);

        if (!alive) return;

        if (payload && (payload.title || payload.lines?.length || payload.locations)) {
          setHeroCms(payload);
        }
      } catch (err) {
        console.error("[PMG hero] error", err);
        if (!alive) return;
      }
    }

    loadHero();

    return () => {
      alive = false;
    };
  }, []);

  // CMS ili default
  const heroTitle = heroCms?.title || PMG_COPY.heroTitle;
  const heroLines =
    heroCms?.lines?.length ? heroCms.lines : PMG_COPY.heroLines || [];
  const heroLocations = heroCms?.locations || PMG_COPY.locations;

  const firstTwo = heroLines.slice(0, 2);
  const blockThreeToFive = heroLines.slice(2, 5);
  const lastLine = heroLines.length ? heroLines[heroLines.length - 1] : "";

  return (
    <main className="page">
      <section className="hero">
        <div className="hero__bg">
          <div className="hero__bgInner" />
        </div>

        <Snow className="snowHero" />

        <div
          className={[
            "hero__content",
            "animate__animated",
            heroOut ? "animate__fadeOutUp" : "animate__fadeInUpBig",
          ].join(" ")}
        >
          <img
            className="hero__logo animate__animated animate__fadeInUpBig"
            style={{ animationDelay: "0ms" }}
            src="/pmg1.png"
            alt="Purple Music Group logo"
          />
          <br />
          <div className="hero__text">
            <h1
              className="hero__title animate__animated animate__fadeInUpBig"
              style={{ animationDelay: "120ms" }}
            >
              {heroTitle}
            </h1>

            <div
              className="hero__lines animate__animated animate__fadeInUpBig"
              style={{ animationDelay: "220ms" }}
            >
              <div className="hero__group hero__group--tight">
                {firstTwo.map((line, i) => (
                  <p key={`l12-${i}`} className="hero__p">
                    {line}
                  </p>
                ))}
              </div>

              <div className="hero__group hero__group--block">
                {blockThreeToFive.map((line, i) => (
                  <p key={`l35-${i}`} className="hero__p">
                    {line}
                  </p>
                ))}
              </div>

              {lastLine ? (
                <p className="hero__p hero__p--oneLine">{lastLine}</p>
              ) : null}

              <br />
              <p className="hero__p hero__p--dim">{heroLocations}</p>
            </div>
          </div>
        </div>

        <div className="hero__fadeBottom" aria-hidden="true" />
      </section>

      <section ref={brandsRef} className="brandsWrap">
        <BrandCarousel />
      </section>
    </main>
  );
}
