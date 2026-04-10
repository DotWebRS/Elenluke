import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Container from "react-bootstrap/Container";
import { API_BASE } from "../config/apiBase";
import FadeSection from "../components/FadeSection";

type Partner = {
  src: string;
  name: string;
  href: string;
};

type CmsPartnersPayload = {
  items: Array<{ id?: string; src: string; name: string; href: string }>;
};

const SITE_KEY = "purple-crunch-publishing";
const CMS_KEYS_TO_TRY = ["home.partners", "pcr.partners.items"];

function safeParseJson<T>(raw: any, fallback: T): T {
  try {
    if (!raw) return fallback;
    if (typeof raw === "string") return JSON.parse(raw) as T;
    return raw as T;
  } catch {
    return fallback;
  }
}

function buildUrl(path: string) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return base ? `${base}/${p}` : `/${p}`;
}

function absolutizeSrc(src: string) {
  const s = (src || "").trim();
  if (!s) return "";
  if (s.startsWith("data:")) return s;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/uploads/")) return buildUrl(s);
  return s.startsWith("/") ? buildUrl(s) : buildUrl(`/${s}`);
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
      Accept: "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
    },
  });
}

function normalizePartnersPayload(payload: any): Partner[] {
  const parsed = safeParseJson<CmsPartnersPayload>(payload?.json, { items: [] });
  const items = Array.isArray(parsed?.items) ? parsed.items : [];

  return items
    .map((x: any) => ({
      src: absolutizeSrc(String(x?.src ?? "")),
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

export default function Partners() {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);

  const [partners, setPartners] = useState<Partner[]>([]);
  const [display, setDisplay] = useState<Partner[]>([]);

  const base = useMemo(() => partners, [partners]);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      try {
        let foundPartners: Partner[] = [];

        for (const cmsKey of CMS_KEYS_TO_TRY) {
          const res = await cmsGet(SITE_KEY, cmsKey, controller.signal);
          if (!alive) return;

          if (res.status === 404 || !res.ok) continue;

          const payload = await res.json().catch(() => null as any);
          const next = normalizePartnersPayload(payload);

          if (next.length > 0) {
            foundPartners = next;
            break;
          }
        }

        if (!alive) return;
        setPartners(foundPartners);
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

  useEffect(() => {
    if (base.length === 0) {
      setDisplay([]);
      return;
    }

    setDisplay(repeatToMinCount(base, Math.max(12, base.length)));
  }, [base]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const measure = measureRef.current;
    if (!viewport || !measure || base.length === 0) return;

    let alive = true;

    const recompute = async () => {
      const imgs = Array.from(measure.querySelectorAll("img"));

      await Promise.all(
        imgs.map(
          (img) =>
            img.complete ||
            new Promise<void>((resolve) => {
              img.addEventListener("load", () => resolve(), { once: true });
              img.addEventListener("error", () => resolve(), { once: true });
            })
        )
      );

      if (!alive) return;

      const vw = Math.max(1, viewport.clientWidth);
      const setW = Math.max(1, measure.scrollWidth);

      const targetW = vw * 2.2;
      const reps = Math.ceil(targetW / setW);
      const neededCount = Math.max(base.length, base.length * Math.max(1, reps));

      setDisplay((prev) => {
        const next = repeatToMinCount(base, neededCount);
        return prev.length === next.length ? prev : next;
      });

      const pxPerSec = 120;
      const duration = Math.max(14, Math.round((setW / pxPerSec) * 10) / 10);
      viewport.style.setProperty("--pmPartnersDur", `${duration}s`);
    };

    recompute();

    const ro = new ResizeObserver(() => {
      if (!alive) return;
      recompute();
    });

    ro.observe(viewport);
    window.addEventListener("resize", recompute);

    return () => {
      alive = false;
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [base]);

  if (base.length === 0) return null;

  return (
    <FadeSection id="partners" className="pmPartners-section">
      <Container>
        <div className="pmPartners-head">
          <h2 className="pmPartners-title">
            <span className="pmPartners-title-light">OUR</span>
            <span className="pmPartners-title-grad">PARTNERS</span>
          </h2>
        </div>
      </Container>

      <div className="pmPartners-rail">
        <div className="pmPartners-viewport" ref={viewportRef}>
          <div className="pmPartners-fade pmPartners-fade--left" aria-hidden="true" />
          <div className="pmPartners-fade pmPartners-fade--right" aria-hidden="true" />

          <div className="pmPartners-move" aria-label="Partners marquee">
            <div className="pmPartners-track" ref={measureRef}>
              {display.map((p, i) => (
                <a
                  className="pmPartners-logo"
                  key={`a-${p.src}-${i}`}
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={p.name}
                  title={p.name}
                >
                  <span className="pmPartners-logoBox">
                    <img
                      src={p.src}
                      alt={p.name}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />
                  </span>
                </a>
              ))}
            </div>

            <div className="pmPartners-track" aria-hidden="true">
              {display.map((p, i) => (
                <a
                  className="pmPartners-logo"
                  key={`b-${p.src}-${i}`}
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={-1}
                >
                  <span className="pmPartners-logoBox">
                    <img
                      src={p.src}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </FadeSection>
  );
}
