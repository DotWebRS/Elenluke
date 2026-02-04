import { useEffect, useMemo, useRef, useState } from "react";
import Container from "react-bootstrap/Container";
import type { AdminSiteKey } from "../components/admin/adminSites";
import { API_BASE } from "../config/apiBase";

type Partner = {
  src: string;
  name: string;
  href: string;
};

type CmsPartnersPayload = {
  items: Array<{ id?: string; src: string; name: string; href: string }>;
};

const CMS_KEY = "home.partners";

function safeParseJson<T>(raw: any, fallback: T): T {
  try {
    if (!raw) return fallback;
    if (typeof raw === "string") return JSON.parse(raw) as T;
    return raw as T;
  } catch {
    return fallback;
  }
}

function absolutizeSrc(src: string) {
  const s = (src || "").trim();
  if (!s) return "";

  if (s.startsWith("data:")) return s;
  if (/^https?:\/\//i.test(s)) return s;

  if (s.startsWith("/uploads/")) return buildUrl(s);


  return s;
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

  return fetch(url, {
    signal,
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
    },
  });
}

function normalizePartnersPayload(payload: any): Partner[] {
  const parsed = safeParseJson<CmsPartnersPayload>(payload?.json, { items: [] });
  const items = Array.isArray(parsed?.items) ? parsed.items : [];

  const cleaned = items
    .map((x: any) => ({
      src: absolutizeSrc(String(x?.src ?? "")),
      name: String(x?.name ?? "").trim(),
      href: String(x?.href ?? "").trim(),
    }))
    .filter((x) => x.src && x.name);

  return cleaned;
}


export default function Partners() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  // NEMA DEFAULT-a: kreće prazno dok ne učita iz CMS-a
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      const host = window.location.hostname.toLowerCase().replace(/^www\./, "");
      const siteKey = hostnameToSiteKey(host);

      try {
        const res = await cmsGet(siteKey, CMS_KEY, controller.signal);

        if (res.status === 404) {
          if (!alive) return;
          setPartners([]);
          return;
        }

        if (!res.ok) {
          if (!alive) return;
          setPartners([]);
          return;
        }

        const payload = await res.json().catch(() => null as any);
        const next = normalizePartnersPayload(payload);

        if (!alive) return;
        setPartners(next);
      } catch {
        if (!alive) return;
        setPartners([]);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  const strip = useMemo(() => {
    if (partners.length === 0) return [];
    if (partners.length < 4) return partners;
    return [...partners, ...partners];
  }, [partners]);

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

  // ako nema ništa iz CMS-a, ne prikazuj sekciju
  if (partners.length === 0) return null;

  return (
    <section ref={sectionRef} className="partners-section" id="partners">
      <Container>
        <div className="services-head services-head--center">
          <h2 className="about-title about-title-centered">
            OUR <span className="about-us-animated">PARTNERS</span>
          </h2>
        </div>
      </Container>

      <div
        className={`partners-marquee ${inView ? "is-running" : "is-paused"}`}
        aria-label="Partners carousel"
      >
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
              <img
                src={p.src}
                alt={p.name}
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            </a>
          ))}
        </div>

        {partners.length >= 4 && (
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
        )}
      </div>
    </section>
  );
}
