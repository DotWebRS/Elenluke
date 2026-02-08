import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  return s;
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

  return items
    .map((x: any) => ({
      src: absolutizeSrc(String(x?.src ?? "")),
      name: String(x?.name ?? "").trim(),
      href: String(x?.href ?? "").trim(),
    }))
    .filter((x) => x.src && x.name && x.href);
}

/** ponovi listu dok ne dobiješ dovoljno elemenata da traka bude "puna" */
function repeatToMinCount<T>(arr: T[], minCount: number): T[] {
  if (arr.length === 0) return [];
  if (arr.length >= minCount) return arr;
  const out: T[] = [];
  while (out.length < minCount) out.push(...arr);
  return out.slice(0, Math.max(minCount, arr.length));
}

export default function Partners() {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null); // merenje širine 1 seta
  const [partners, setPartners] = useState<Partner[]>([]);

  // bazni set iz CMS-a (koliko god da ih ima)
  const base = useMemo(() => partners, [partners]);

  // display set (može biti ponovljen da popuni ekran)
  const [display, setDisplay] = useState<Partner[]>([]);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      const host = window.location.hostname.toLowerCase().replace(/^www\./, "");
      const siteKey = hostnameToSiteKey(host);

      try {
        const res = await cmsGet(siteKey, CMS_KEY, controller.signal);
        if (!alive) return;

        if (res.status === 404 || !res.ok) {
          setPartners([]);
          return;
        }

        const payload = await res.json().catch(() => null as any);
        setPartners(normalizePartnersPayload(payload));
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

  // 1) postavi neki inicijalni display da se odmah renderuje
  useEffect(() => {
    if (base.length === 0) {
      setDisplay([]);
      return;
    }
    // minimum 12 je ok polazno, posle layout efekat fino podešava
    setDisplay(repeatToMinCount(base, Math.max(12, base.length)));
  }, [base]);

  // 2) posle rendera izmeri i po potrebi još ponovi da popuni 2x viewport
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const measure = measureRef.current;
    if (!viewport || !measure) return;
    if (base.length === 0) return;

    const recompute = async () => {
      // sačekaj slike da se učitaju da bi scrollWidth bio tačan
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

      const vw = Math.max(1, viewport.clientWidth);
      const setW = Math.max(1, measure.scrollWidth);

      // cilj: jedan set (pre dupliranja) da bude bar ~2 širine viewport-a
      const targetW = vw * 2.1;

      // procena koliko ponavljanja treba
      const reps = Math.ceil(targetW / setW);
      const neededCount = Math.max(base.length, base.length * Math.max(1, reps));

      // update samo ako stvarno treba više
      setDisplay((prev) => {
        const next = repeatToMinCount(base, neededCount);
        if (prev.length === next.length) return prev;
        return next;
      });

      // set CSS var za brzinu prema širini (glatko i bez “jurcanja”)
      // 120px/s je prirodno, prilagodi po želji
      const pxPerSec = 120;
      const duration = Math.max(12, Math.round((setW / pxPerSec) * 10) / 10);
      viewport.style.setProperty("--pmPartnersDur", `${duration}s`);
    };

    let alive = true;
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

  // dve identične trake jedna za drugom (bez seckanja):
  // animiramo wrapper za -50% (što je tačno širina prve trake)
  return (
    <section className="pmPartners" id="partners">
      <Container>
        <div className="services-head services-head--center">
          <h2 className="about-title about-title-centered">
            OUR <span className="about-us-animated">PARTNERS</span>
          </h2>
        </div>
      </Container>

      <div className="pmPartners-viewport" ref={viewportRef}>
        <div className="pmPartners-fade pmPartners-fade--left" aria-hidden="true" />
        <div className="pmPartners-fade pmPartners-fade--right" aria-hidden="true" />

        <div className="pmPartners-move" aria-label="Partners marquee">
          {/* SET A (merenje) */}
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

          {/* SET B (kopija) */}
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
      </div>
    </section>
  );
}
