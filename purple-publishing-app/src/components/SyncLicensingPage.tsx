import { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import { useNavigate } from "react-router-dom";
import type { AdminSiteKey } from "../components/admin/adminSites";

import { API_BASE } from "../config/apiBase";
import FadeSection from "./FadeSection";
import Footer from "./Footer";

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

const PARTNERS = [
  {
    name: "Roblox",
    src: "/branding/PNG/roblox.png",
    alt: "Roblox",
    href: "https://www.roblox.com/",
  },
  {
    name: "Amanotes",
    src: "/branding/PNG/amanotes.avif",
    alt: "Amanotes",
    href: "https://amanotes.com/",
  },
  {
    name: "Fortnite",
    src: "/branding/PNG/fortnite.png",
    alt: "Fortnite",
    href: "https://www.fortnite.com/",
  },
];

function safeParseJson<T>(raw: any, fallback: T): T {
  try {
    if (raw == null) return fallback;
    if (typeof raw === "string") return JSON.parse(raw) as T;
    return raw as T;
  } catch {
    return fallback;
  }
}

function hostnameToSiteKey(hostname: string): AdminSiteKey {
  const h = (hostname || "").toLowerCase().replace(/^www\./, "");

  if (h.includes("publishing")) return "purple-crunch-publishing";
  if (h.includes("records")) return "purple-crunch-records";
  if (h.includes("music-group")) return "purple-music-group";

  return "purple-crunch-publishing";
}

function buildUrl(path: string) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return base ? `${base}/${p}` : `/${p}`;
}

async function cmsGet(siteKey: string, key: string, signal: AbortSignal) {
  const ts = Date.now();
  const url = buildUrl(
    `/api/cms?siteKey=${encodeURIComponent(siteKey)}&key=${encodeURIComponent(key)}&ts=${ts}`
  );

  const res = await fetch(url, {
    signal,
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
    },
  });

  return res;
}

const SyncLicensingPage = () => {
  const navigate = useNavigate();
  const [syncText, setSyncText] = useState<CmsSyncPayload>(DEFAULT_SYNC);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      const host = window.location.hostname.toLowerCase().replace(/^www\./, "");
      const siteKey = hostnameToSiteKey(host);
      const key = "home.syncText";

      try {
        const res = await cmsGet(siteKey, key, controller.signal);

        if (res.status === 404) return;
        if (!res.ok) return;

        const payload = await res.json().catch(() => null as any);
        const parsed = safeParseJson<CmsSyncPayload>(payload?.json, DEFAULT_SYNC);

        const next: CmsSyncPayload = {
          h1: parsed?.h1 ?? DEFAULT_SYNC.h1,
          t1: parsed?.t1 ?? DEFAULT_SYNC.t1,
          h2: parsed?.h2 ?? DEFAULT_SYNC.h2,
          t2: parsed?.t2 ?? DEFAULT_SYNC.t2,
          h3: parsed?.h3 ?? DEFAULT_SYNC.h3,
          t3: parsed?.t3 ?? DEFAULT_SYNC.t3,
        };

        if (!alive) return;
        setSyncText(next);
      } catch {}
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  return (
    <>
      <FadeSection id="sync-licensing-page" className="sync-section">
        <Container className="site-container">
          <div className="sync-head sync-head--center">
            <h2 className="about-title about-title-centered">
              SYNC <span className="about-us-animated">LICENSING</span>
            </h2>

            <button
              type="button"
              className="artists-link artists-link--back sync-link-btn"
              onClick={() => {
                window.location.href = "/#sync";
              }}
            >
              BACK
            </button>
          </div>

          <div className="sync-layout">
            <article className="sync-card sync-main">
              <h3 className="sync-subtitle sync-purple">{syncText.h1}</h3>

              <div className="sync-body">
                <p>{syncText.t1}</p>
                <p className="sync-strong">{syncText.t2}</p>
              </div>

              <div className="sync-main-spacer" aria-hidden="true" />
            </article>

            <aside className="sync-side">
              <section className="sync-card sync-side-card">
                <h3 className="sync-subtitle sync-purple">{syncText.h2}</h3>
                <p className="sync-side-text">{syncText.t2}</p>
                <div className="sync-side-grow" aria-hidden="true" />
              </section>

              <section className="sync-card sync-side-card">
                <p className="sync-kickerline">Commercial Music Licensing</p>
                <h3 className="sync-subtitle sync-purple">{syncText.h3}</h3>
                <p className="sync-side-text">{syncText.t3}</p>
                <div className="sync-side-grow" aria-hidden="true" />
              </section>
            </aside>
          </div>

          <div className="sync-partners-block">
            <div className="sync-head sync-head--center">
              <h2 className="about-title about-title-centered">
                OUR <span className="about-us-animated">PARTNERS</span>
              </h2>
            </div>

            <div className="sync-partners-row">
              {PARTNERS.map((partner) => (
                <a
                  key={partner.name}
                  className="sync-partner-logo"
                  href={partner.href}
                  target="_blank"
                  rel="noreferrer"
                  title={partner.name}
                  aria-label={partner.name}
                >
                  <img
                    src={partner.src}
                    alt={partner.alt}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                </a>
              ))}
            </div>
          </div>
        </Container>
      </FadeSection>

      <Footer />
    </>
  );
};

export default SyncLicensingPage;