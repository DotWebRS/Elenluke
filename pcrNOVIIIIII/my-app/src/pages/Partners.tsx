// src/pages/Partners.tsx
import  { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import "../style/Partners.css";

type Partner = { src: string; name: string; href: string };
type CmsPartnersPayload = {
  items: Array<{ id?: string; src: string; name: string; href: string }>;
};

type Props = { isActive?: boolean };

// ako ti je key drugačiji, promeni ovde:
const CMS_KEY = "home.partners";

// ako ti partneri dolaze sa drugog CMS-a, promeni samo ove 2 konstante:
const REMOTE_API_BASE = "https://cms.purplemusicgroup.com";
const REMOTE_SITE_KEY = "purple-crunch-publishing";

function safeParseJson<T>(raw: any, fallback: T): T {
  try {
    if (!raw) return fallback;
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

function absolutizeSrc(apiBase: string, src: string) {
  const s = (src || "").trim();
  if (!s) return "";
  if (s.startsWith("data:")) return s;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/uploads/")) return buildUrl(apiBase, s);
  if (s.startsWith("/")) return s;
  return `/${s}`;
}

async function cmsGet(apiBase: string, siteKey: string, key: string, signal: AbortSignal) {
  const url = buildUrl(
    apiBase,
    `/api/cms?siteKey=${encodeURIComponent(siteKey)}&key=${encodeURIComponent(key)}&ts=${Date.now()}`
  );

  return fetch(url, {
    signal,
    cache: "no-store",
    headers: {
      Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
    },
  });
}

function normalizePartners(apiBase: string, payload: any): Partner[] {
  const parsed = safeParseJson<CmsPartnersPayload>(payload?.json, { items: [] });
  const items = Array.isArray(parsed?.items) ? parsed.items : [];

  return items
    .map((x: any) => ({
      src: absolutizeSrc(apiBase, String(x?.src ?? "")),
      name: String(x?.name ?? "").trim(),
      href: String(x?.href ?? "").trim(),
    }))
    .filter((x) => x.src && x.name && x.href);
}

function repeatToMinCount<T>(arr: T[], minCount: number): T[] {
  if (arr.length === 0) return [];
  if (arr.length >= minCount) return arr;
  const out: T[] = [];
  while (out.length < minCount) out.push(...arr);
  return out.slice(0, Math.max(minCount, arr.length));
}

export default function Partners({ isActive = true }: Props) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);

  const [partners, setPartners] = useState<Partner[]>([]);
  const base = useMemo(() => partners, [partners]);
  const [display, setDisplay] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      try {
        // Ako želiš da vučeš sa svog API-ja umesto remote CMS-a:
        // const res = await fetch(buildApiUrl(`/api/cms?siteKey=${CMS_SITE_KEY}&key=${CMS_KEY}&ts=${Date.now()}`), { signal: controller.signal });
        const res = await cmsGet(REMOTE_API_BASE, REMOTE_SITE_KEY, CMS_KEY, controller.signal);

        if (!alive) return;

        if (res.status === 404 || !res.ok) {
          setPartners([]);
          return;
        }

        const payload = await res.json().catch(() => null as any);
        setPartners(normalizePartners(REMOTE_API_BASE, payload));
      } catch {
        if (!alive) return;
        setPartners([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (base.length === 0) {
      setDisplay([]);
      return;
    }
    setDisplay(repeatToMinCount(base, Math.max(14, base.length)));
  }, [base]);

  // Dinamički duration po realnoj širini track-a
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const measure = measureRef.current;
    if (!viewport || !measure) return;
    if (base.length === 0) return;

    let alive = true;

    const recompute = async () => {
      const imgs = Array.from(measure.querySelectorAll("img"));

      await Promise.all(
        imgs.map(
          (img) =>
            img.complete ||
            new Promise<void>((res) => {
              img.addEventListener("load", () => res(), { once: true });
              img.addEventListener("error", () => res(), { once: true });
            })
        )
      );

      if (!alive) return;

      const vw = Math.max(1, viewport.clientWidth);
      const setW = Math.max(1, measure.scrollWidth);

      // napravi dovoljno elemenata da pokrije 2+ viewporta
      const targetW = vw * 2.2;
      const reps = Math.ceil(targetW / setW);
      const neededCount = Math.max(base.length, base.length * Math.max(1, reps));
      setDisplay((prev) => {
        const next = repeatToMinCount(base, neededCount);
        return prev.length === next.length ? prev : next;
      });

      // brzina: px/sec => duration = width / speed
      const pxPerSec = 140; // veće = brže
      const duration = Math.max(10, Math.round((setW / pxPerSec) * 10) / 10);
      viewport.style.setProperty("--pcPartnersDur", `${duration}s`);
    };

    recompute();
    window.addEventListener("resize", recompute);
    return () => {
      alive = false;
      window.removeEventListener("resize", recompute);
    };
  }, [base]);

  return (
    <section id="partners" aria-hidden={!isActive}>
      <div className="pcPartners-wrap">
        <h2 className="pcPartners-title">
          <span className="pcPartners-titleLight">OUR</span>{" "}
          <span className="pcPartners-titleGrad type-gradient">PARTNERS</span>
        </h2>

        <div className="pcPartners-viewport" ref={viewportRef} data-loading={loading ? "1" : "0"}>
          <div className="pcPartners-fade pcPartners-fade--left" aria-hidden="true" />
          <div className="pcPartners-fade pcPartners-fade--right" aria-hidden="true" />

          <div className="pcPartners-stage">
            {!display.length ? (
              <div className="pcPartners-skeleton" aria-hidden="true">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div className="pcPartners-skelLogo" key={i} />
                ))}
              </div>
            ) : (
              <div className={["pcPartners-move", loading ? "is-loading" : ""].join(" ")} aria-label="Partners marquee">
                <div className="pcPartners-track" ref={measureRef}>
                  {display.map((p, i) => (
                    <a
                      className="pcPartners-logo"
                      key={`a-${p.src}-${i}`}
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

                <div className="pcPartners-track" aria-hidden="true">
                  {display.map((p, i) => (
                    <a
                      className="pcPartners-logo"
                      key={`b-${p.src}-${i}`}
                      href={p.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      tabIndex={-1}
                    >
                      <img src={p.src} alt="" loading="lazy" decoding="async" draggable={false} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
