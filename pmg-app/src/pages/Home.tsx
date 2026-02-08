// src/pages/Home.tsx
import { useEffect, useRef, useState } from "react";
import BrandCarousel from "../components/BrandCarousel";
import Snow from "../components/Snow";
import { PMG_COPY } from "../content/copy";
import { buildApiUrl } from "../config/apiBase";
import "../styles/Hero.css";

type HeroCmsPayload = {
  title: string;        // ide u bazu, ali se NE prikazuje korisnicima
  lines: string[];      // pasusi po redovima
  locations: string;    // gradovi / lokacije
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

function cleanLines(lines: string[]) {
  return (lines || []).map((l) => (l ?? "").trim()).filter(Boolean);
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
          `/api/cms?siteKey=${encodeURIComponent(CMS_SITE_KEY)}&key=${encodeURIComponent(
            CMS_KEY_HERO
          )}&ts=${Date.now()}`
        );

        const res = await fetch(url);

        if (res.status === 404) return;
        if (!res.ok) return;

        const raw: any = await res.json().catch(() => null);
        const payload = safeJsonParse<HeroCmsPayload>(raw?.json, {
          title: "",
          lines: [],
          locations: "",
        });

        if (!alive) return;

        if (payload && (payload.title || payload.lines?.length || payload.locations)) {
          setHeroCms(payload);
        }
      } catch {
        if (!alive) return;
      }
    }

    loadHero();
    return () => {
      alive = false;
    };
  }, []);

  // CMS ili default (TITLE postoji ali ga NE prikazujemo)
  const heroLinesRaw = heroCms?.lines?.length ? heroCms.lines : PMG_COPY.heroLines || [];
  const heroLocations = heroCms?.locations || PMG_COPY.locations;

  const lines = cleanLines(heroLinesRaw);

  // layout: logo -> 2 recenice -> razmak -> sve osim zadnje -> razmak -> zadnja -> gradovi
  const topTwo = lines.slice(0, 2);
  const last = lines.length ? lines[lines.length - 1] : "";
  const middle = lines.slice(2, Math.max(2, lines.length - 1));

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

          <div className="hero__text">
            {/* NASLOV (H1) se ne prikazuje */}
            <br/>
            <div className="hero__lines animate__animated animate__fadeInUpBig" style={{ animationDelay: "220ms" }}>
              {/* 2 recenice */}
              {topTwo.length ? (
                <div className="hero__group hero__group--tight">
                  {topTwo.map((line, i) => (
                    <p key={`t2-${i}`} className="hero__p">
                      {line}
                    </p>
                  ))}
                </div>
              ) : null}

              {/* razmak */}
              {topTwo.length && middle.length ? <div className="hero__spacer" /> : null}

              {/* sve osim zadnje (posle prve 2) */}
              {middle.length ? (
                <div className="hero__group hero__group--block">
                  {middle.map((line, i) => (
                    <p key={`mid-${i}`} className="hero__p">
                      {line}
                    </p>
                  ))}
                </div>
              ) : null}

              {/* razmak */}
              {middle.length && last ? <div className="hero__spacer" /> : null}

              {/* zadnja */}
              {last ? <p className="hero__p hero__p--oneLine">{last}</p> : null}

              {/* gradovi odvojeno */}
              {heroLocations ? <p className="hero__p hero__p--dim">{heroLocations}</p> : null}
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
