// src/pages/Sync.tsx
import React, { useEffect, useMemo, useState } from "react";
import Container from "react-bootstrap/Container";

type Props = { isActive?: boolean };

type CmsSyncPayload = {
  h1: string;
  t1: string;
  h2: string;
  t2: string;
  h3: string;
  t3: string;
};

const DEFAULT_SYNC: CmsSyncPayload = {
  h1: "Sync Made Simple. Music Made Powerful.",
  t1: "We connect your music to film, TV, ads, games, and digital content with smooth clearance and transparent licensing.",
  h2: "Where Music meets Global impact.",
  t2: "Worldwide rights administration and strategic placements that grow your catalog and revenue.",
  h3: "Where premium sound meets viral energy.",
  t3: "From trending digital sounds to bespoke compositions—built for your audience and your brief.",
};

const REMOTE_API_BASE = "https://cms.purplemusicgroup.com";
const REMOTE_SITE_KEY = "purple-crunch-publishing";
const CMS_KEY = "home.syncText";

function safeParseJson<T>(raw: any, fallback: T): T {
  try {
    if (raw == null) return fallback;
    if (typeof raw === "string") return JSON.parse(raw) as T;
    return raw as T;
  } catch {
    return fallback;
  }
}

function buildUrl(baseUrl: string, path: string) {
  const base = String(baseUrl || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return base ? `${base}/${p}` : `/${p}`;
}

async function cmsGet(apiBase: string, siteKey: string, key: string, signal: AbortSignal) {
  const ts = Date.now();
  const url = buildUrl(
    apiBase,
    `/api/cms?siteKey=${encodeURIComponent(siteKey)}&key=${encodeURIComponent(key)}&ts=${ts}`
  );

  return fetch(url, {
    signal,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
    },
  });
}

function txt(v: any) {
  return String(v ?? "").trim();
}

type MobileKey = "card1" | "card2" | "card3";

export default function Sync({ isActive = true }: Props) {
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [syncText, setSyncText] = useState<CmsSyncPayload>(DEFAULT_SYNC);

  const [openMobile, setOpenMobile] = useState<MobileKey>("card1");

  useEffect(() => {
    setPhase(isActive ? "in" : "out");
  }, [isActive]);

  // reset accordion when page becomes active (optional, but feels good)
  useEffect(() => {
    if (isActive) setOpenMobile("card1");
  }, [isActive]);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await cmsGet(REMOTE_API_BASE, REMOTE_SITE_KEY, CMS_KEY, controller.signal);
        if (!alive) return;

        if (res.status === 404 || !res.ok) {
          setSyncText(DEFAULT_SYNC);
          return;
        }

        const payload = await res.json().catch(() => null as any);
        const parsed = safeParseJson<CmsSyncPayload>(payload?.json, DEFAULT_SYNC);

        const next: CmsSyncPayload = {
          h1: txt(parsed?.h1) || DEFAULT_SYNC.h1,
          t1: txt(parsed?.t1) || DEFAULT_SYNC.t1,
          h2: txt(parsed?.h2) || DEFAULT_SYNC.h2,
          t2: txt(parsed?.t2) || DEFAULT_SYNC.t2,
          h3: txt(parsed?.h3) || DEFAULT_SYNC.h3,
          t3: txt(parsed?.t3) || DEFAULT_SYNC.t3,
        };

        if (!alive) return;
        setSyncText(next);
      } catch {
        if (!alive) return;
        setSyncText(DEFAULT_SYNC);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  const cls =
    "page " +
    (phase === "in"
      ? "animate__animated animate__slideInRight"
      : "animate__animated animate__slideOutLeft");

  const card1Paras = useMemo(() => {
    // u prvoj kartici hoces 3 pasusa: t1, t2, t3
    return [syncText.t1, syncText.t2, syncText.t3].map((s) => txt(s)).filter(Boolean);
  }, [syncText.t1, syncText.t2, syncText.t3]);

  const toggleMobile = (k: MobileKey) => {
    setOpenMobile((cur) => (cur === k ? cur : k)); // "zatvorene" = uvek jedna otvorena
  };

  const renderMobileCard = (k: MobileKey, title: React.ReactNode, body: React.ReactNode) => {
    const isOpen = openMobile === k;
    return (
      <article className={`syncMCard ${isOpen ? "is-open" : ""}`}>
        <button
          type="button"
          className="syncMHead"
          onClick={() => toggleMobile(k)}
          aria-expanded={isOpen}
        >
          <div className="syncMTitle">{title}</div>
          <span className={`syncMPlus ${isOpen ? "is-open" : ""}`} aria-hidden="true">
            <span />
            <span />
          </span>
        </button>

        <div className="syncMBodyWrap" style={{ maxHeight: isOpen ? 560 : 0 }}>
          <div className="syncMBody">{body}</div>
        </div>
      </article>
    );
  };

  return (
    <section className={cls} style={{ animationDuration: "650ms" }} id="sync">
      <div className="about-bg" aria-hidden="true" />

      <div className="about-content syncPage">
        <Container className="syncFluid">
          <div className="syncHead">
            <h2 className="about-title about-title-centered syncTitle">
              <span className="syncTitleWhite">SYNC</span>{" "}
              <span className="about-us-animated">LICENCING</span>
            </h2>
          </div>

          {/* DESKTOP / TABLET */}
          <div className="syncSplit">
            <div className="syncLeftCol">
              <article className="syncCard syncCardLeftTall">
                <h3 className="syncCardTitle">{syncText.h1}</h3>
                <div className="syncCardBody">
                  {card1Paras.map((p, i) => (
                    <p className={`syncCardText ${i === card1Paras.length - 1 ? "syncCardTextLast" : ""}`} key={i}>
                      {p}
                    </p>
                  ))}
                </div>
              </article>
            </div>

            <div className="syncRightCol">
              <article className="syncCard syncRightTop">
                <h3 className="syncCardTitle">{syncText.h2}</h3>
                <p className="syncCardText syncCardTextLast">{syncText.t2}</p>
              </article>

              <article className="syncCard syncRightBottom">
                <p className="syncKicker">Commercial Music Licensing</p>
                <h3 className="syncCardTitle">{syncText.h3}</h3>
                <p className="syncCardText syncCardTextLast syncClamp">{syncText.t3}</p>
              </article>
            </div>
          </div>

          {/* MOBILE (100vh, accordion) */}
          <div className="syncMobile">
            {renderMobileCard(
              "card1",
              <h3 className="syncCardTitle syncCardTitle--mobile">{syncText.h1}</h3>,
              <>
                {card1Paras.map((p, i) => (
                  <p className="syncCardText" key={i} style={{ marginBottom: i === card1Paras.length - 1 ? 0 : 10 }}>
                    {p}
                  </p>
                ))}
              </>
            )}

            {renderMobileCard(
              "card2",
              <h3 className="syncCardTitle syncCardTitle--mobile">{syncText.h2}</h3>,
              <p className="syncCardText" style={{ marginBottom: 0 }}>
                {syncText.t2}
              </p>
            )}

            {renderMobileCard(
              "card3",
              <>
                <p className="syncKicker" style={{ marginBottom: 8 }}>
                  Commercial Music Licensing
                </p>
                <h3 className="syncCardTitle syncCardTitle--mobile" style={{ marginBottom: 0 }}>
                  {syncText.h3}
                </h3>
              </>,
              <p className="syncCardText" style={{ marginBottom: 0 }}>
                {syncText.t3}
              </p>
            )}
          </div>
        </Container>
      </div>
    </section>
  );
}
