import { useEffect, useMemo, useRef, useState } from "react";
import Container from "react-bootstrap/Container";
import type { AdminSiteKey } from "../components/admin/adminSites";

const API_BASE = (import.meta as any).env?.VITE_API_URL || "http://localhost:5284";

type Partner = {
  src: string;
  name: string;
  href: string;
};

type CmsPartnersPayload = {
  items: Array<{ id?: string; src: string; name: string; href: string }>;
};

const CMS_KEY = "home.partners";

// fallback ako CMS nema ništa
const DEFAULT_PARTNERS: Partner[] = [
  { src: "/branding/partners/idtmM7C19q_logos.png", name: "Partner", href: "https://example.com" },
  { src: "/branding/partners/Antidote.png", name: "Antidote", href: "https://example.com" },
  { src: "/branding/partners/black17-logo.png", name: "Black 17", href: "https://example.com" },
  { src: "/branding/partners/epic-games-logo-png-transparent.png", name: "Epic Games", href: "https://www.epicgames.com" },
  { src: "/branding/partners/Epidemic-Sound-Secondary-Logo-white-RGB.png", name: "Epidemic Sound", href: "https://www.epidemicsound.com" },
  { src: "/branding/partners/Launch13.png", name: "Launch13", href: "https://example.com" },
  { src: "/branding/partners/Rogue@white.png", name: "Rogue", href: "https://example.com" },
  { src: "/branding/partners/Sonymusic.png", name: "Sony Music", href: "https://www.sonymusic.com" },
  { src: "/branding/partners/SoundOn.png", name: "SoundOn", href: "https://soundon.tiktok.com" },
  { src: "/branding/partners/Tiktok2.png", name: "TikTok", href: "https://www.tiktok.com" },
  { src: "/branding/partners/BIGBITE.png", name: "bigbite", href: "https://www.BIGBITE.com" }
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
  const ts = Date.now();
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

function normalizePartnersPayload(payload: any): Partner[] {
  const parsed = safeParseJson<CmsPartnersPayload>(payload?.json, { items: [] });

  const items = Array.isArray(parsed?.items) ? parsed.items : [];

  const cleaned: Partner[] = items
    .map((x: any) => ({
      src: String(x?.src ?? "").trim(),
      name: String(x?.name ?? "").trim(),
      href: String(x?.href ?? "").trim()
    }))
    .filter((x) => x.src && x.name && x.href);

  return cleaned.length ? cleaned : DEFAULT_PARTNERS;
}

export default function Partners() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  const [partners, setPartners] = useState<Partner[]>(DEFAULT_PARTNERS);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      const host = window.location.hostname.toLowerCase().replace(/^www\./, "");
      const siteKey = hostnameToSiteKey(host);

      try {
        const res = await cmsGet(siteKey, CMS_KEY, controller.signal);
        if (res.status === 404) return; // nema u bazi -> default
        if (!res.ok) return;

        const payload = await res.json().catch(() => null as any);
        const next = normalizePartnersPayload(payload);

        if (!alive) return;
        setPartners(next);
      } catch {
        // ignore -> default
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  const strip = useMemo(() => [...partners, ...partners], [partners]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => setInView(!!entries[0]?.isIntersecting),
      { rootMargin: "-15% 0px -15% 0px" }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="partners-section" id="partners">
      <Container>
        <div className={`partners-head ${inView ? "is-in" : ""}`}>
          <h2 className="about-title about-title-centered">
            OUR <span className="about-us-animated">PARTNERS</span>
          </h2>
        </div>
      </Container>

      {/* EDGE-TO-EDGE STRIP */}
      <div className={`partners-marquee ${inView ? "is-running" : "is-paused"}`} aria-label="Partners carousel">
        <div className="partners-track">
          {strip.map((p, i) => (
            <a
              className="partner-logo"
              key={`${p.src}-${i}`}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={p.name}
              title={p.name}
            >
              <img src={p.src} alt={p.name} loading="lazy" decoding="async" draggable={false} />
            </a>
          ))}
        </div>

        <div className="partners-track partners-track--clone" aria-hidden="true">
          {strip.map((p, i) => (
            <a
              className="partner-logo"
              key={`${p.src}-clone-${i}`}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={p.name}
              title={p.name}
              tabIndex={-1}
            >
              <img src={p.src} alt="" loading="lazy" decoding="async" draggable={false} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
