import { useEffect, useRef, useState } from "react";
import Container from "react-bootstrap/Container";
import { useNavigate } from "react-router-dom";
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
  t3: "From trending digital sounds to bespoke compositions—built for your audience and your brief.",
};

function useInViewOnce<T extends HTMLElement>(rootMargin = "-12% 0px -12% 0px") {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}

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

async function cmsGet(siteKey: string, key: string, signal: AbortSignal) {
  const ts = Date.now();
  const url = `${API_BASE}/api/cms?siteKey=${encodeURIComponent(siteKey)}&key=${encodeURIComponent(
    key
  )}&ts=${ts}`;

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

const SyncSection = () => {
  const { ref, inView } = useInViewOnce<HTMLElement>();
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
      } catch {
        //
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  const goSyncLicensingTop = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/sync-licensing");
    // mali timeout da router stigne da renderuje stranicu pre scroll-a
    window.setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }), 0);
  };

  return (
    <section ref={ref as any} className="sync-section" id="sync">
      <Container className="site-container">
        <div className="artists-head">
          <h2 className="about-title about-title-centered">
            SYNC <span className="about-us-animated">LICENCING</span>
          </h2>

          <a className="artists-link" href="/sync-licensing" onClick={goSyncLicensingTop}>
            Learn more <span className="artists-arrow">→</span>
          </a>
        </div>

        <div className={`sync-layout reveal delay-1 ${inView ? "is-in" : ""}`}>
          {/* MAIN */}
          <article className="sync-card sync-main">
            <h3 className="sync-subtitle sync-purple">{syncText.h1}</h3>

            <div className="sync-body">
              <p>{syncText.t1}</p>
              <p className="sync-strong">{syncText.t2}</p>
            </div>

            <div className="sync-main-spacer" aria-hidden="true" />
          </article>

          {/* SIDE */}
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
      </Container>
    </section>
  );
};

export default SyncSection;
