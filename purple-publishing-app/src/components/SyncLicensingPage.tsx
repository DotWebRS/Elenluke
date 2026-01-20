import { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import BottomNav from "./BottomNav";
import Footer from "./Footer";
import type { AdminSiteKey } from "../components/admin/adminSites";

const API_BASE = (import.meta as any).env?.VITE_API_URL || "http://localhost:5284";


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
  t3: "From trending digital sounds to bespoke compositions—built for your audience and your brief."
};

const CMS_KEY = "home.syncText";


const DEALS = [
  { name: "Roblox", src: "./branding/PNG/roblox.png", alt: "Roblox" },
  { name: "Fortnite", src: "./branding/PNG/fortnite.webp", alt: "Fortnite" },
  { name: "Amanotes", src: "../branding/PNG/amanotes.avif", alt: "Amanotes" }
];

function safeParseJson<T>(raw: any, fallback: T): T {
  try {
    if (!raw) return fallback;
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

async function cmsGet(siteKey: string, key: string, signal: AbortSignal) {
  const ts = Date.now(); // cache-bust
  const url = `${API_BASE}/api/cms?siteKey=${encodeURIComponent(siteKey)}&key=${encodeURIComponent(key)}&ts=${ts}`;

  const res = await fetch(url, {
    signal,
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache"
    }
  });

  return res;
}

const SyncLicensingPage = () => {
  const [syncText, setSyncText] = useState<CmsSyncPayload>(DEFAULT_SYNC);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      const host = window.location.hostname.toLowerCase().replace(/^www\./, "");
      const siteKey = hostnameToSiteKey(host);

      try {
        const res = await cmsGet(siteKey, CMS_KEY, controller.signal);

        if (res.status === 404) return; // nema entry -> default
        if (!res.ok) return; // server error -> default

        const payload = await res.json().catch(() => null as any);
        const parsed = safeParseJson<CmsSyncPayload>(payload?.json, DEFAULT_SYNC);

        const next: CmsSyncPayload = {
          h1: parsed?.h1 ?? DEFAULT_SYNC.h1,
          t1: parsed?.t1 ?? DEFAULT_SYNC.t1,
          h2: parsed?.h2 ?? DEFAULT_SYNC.h2,
          t2: parsed?.t2 ?? DEFAULT_SYNC.t2,
          h3: parsed?.h3 ?? DEFAULT_SYNC.h3,
          t3: parsed?.t3 ?? DEFAULT_SYNC.t3
        };

        if (!alive) return;
        setSyncText(next);
      } catch {
        // ignore -> default
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  return (
    <section className="sync-section sync-page" id="sync-licensing">
      <BottomNav />
      <Container className="site-container">
        <div className="sync-page-head">
          <h2 className="about-title about-title-centered">
            SYNC <span className="about-us-animated">LICENSING</span>
          </h2>
        </div>

        <div className="sync-layout">
          <article className="sync-card sync-main">
            <h3 className="sync-subtitle sync-purple">{syncText.h1}</h3>

            <div className="sync-body">
              <p>{syncText.t1}</p>
              <p>{syncText.t2}</p>
              <p className="sync-strong">{syncText.t3}</p>
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
              <p className="sync-side-text">Commercial Music Licensing</p>
              <h3 className="sync-subtitle sync-purple">{syncText.h3}</h3>
              <p className="sync-side-text">{syncText.t3}</p>
              <div className="sync-side-grow" aria-hidden="true" />
            </section>
          </aside>
        </div>

        <div className="sync-deals">
          <div className="sync-page-head">
            <h2 className="about-title about-title-centered">
              EXISTING <span className="about-us-animated">DEALS</span>
            </h2>
          </div>

          <div className="sync-deals-grid">
            {DEALS.map((d) => (
              <div key={d.name} className="sync-deal">
                <img className="sync-deal-img" src={d.src} alt={d.alt || d.name} />
              </div>
            ))}
          </div>
        </div>
      </Container>
      <Footer />
    </section>
  );
};

export default SyncLicensingPage;
