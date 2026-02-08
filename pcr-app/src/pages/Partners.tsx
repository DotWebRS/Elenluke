import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Container from "react-bootstrap/Container";

type Partner = { src: string; name: string; href: string };
type CmsPartnersPayload = {
  items: Array<{ id?: string; src: string; name: string; href: string }>;
};

type Props = { isActive?: boolean };

const CMS_KEY = "home.partners";
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

  const [phase, setPhase] = useState<"in" | "out">("in");
  const [partners, setPartners] = useState<Partner[]>([]);
  const base = useMemo(() => partners, [partners]);
  const [display, setDisplay] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPhase(isActive ? "in" : "out");
  }, [isActive]);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      try {
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
    setDisplay(repeatToMinCount(base, Math.max(12, base.length)));
  }, [base]);

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

      const targetW = vw * 2.1;
      const reps = Math.ceil(targetW / setW);
      const neededCount = Math.max(base.length, base.length * Math.max(1, reps));

      setDisplay((prev) => {
        const next = repeatToMinCount(base, neededCount);
        return prev.length === next.length ? prev : next;
      });

      const pxPerSec = 120;
      const duration = Math.max(12, Math.round((setW / pxPerSec) * 10) / 10);
      viewport.style.setProperty("--pmPartnersDur", `${duration}s`);
    };

    recompute();
    window.addEventListener("resize", recompute);
    return () => {
      alive = false;
      window.removeEventListener("resize", recompute);
    };
  }, [base]);

  const cls =
    "page " +
    (phase === "in"
      ? "animate__animated animate__slideInRight"
      : "animate__animated animate__slideOutLeft");

  const hasData = base.length > 0;

  return (
    <section className={cls} style={{ animationDuration: "650ms" }} id="partners">
      <div className="about-bg" aria-hidden="true" />

      <div className="about-content" style={{ width: "100vw" }}>
        <Container>
          <div className="services-head services-head--center">
            <h2 className="about-title about-title-centered">
              <span className="pmPartners-our">OUR</span>{" "}
              <span className="about-title-grad">PARTNERS</span>
            </h2>
          </div>
        </Container>

        <div className="pmPartners-viewport" ref={viewportRef} data-loading={loading ? "1" : "0"}>
          <div className="pmPartners-fade pmPartners-fade--left" aria-hidden="true" />
          <div className="pmPartners-fade pmPartners-fade--right" aria-hidden="true" />

          {!hasData ? (
            <div className="pmPartners-skeleton" aria-hidden="true">
              {Array.from({ length: 10 }).map((_, i) => (
                <div className="pmPartners-skelLogo" key={i} />
              ))}
            </div>
          ) : (
            <div
              className={["pmPartners-move", loading ? "is-loading" : ""].join(" ")}
              aria-label="Partners marquee"
            >
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
                    <img src={p.src} alt={p.name} loading="lazy" decoding="async" draggable={false} />
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
                    <img src={p.src} alt="" loading="lazy" decoding="async" draggable={false} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
