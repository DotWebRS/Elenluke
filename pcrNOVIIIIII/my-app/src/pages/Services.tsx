import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = { isActive?: boolean };

type CmsServiceItem = {
  id?: string;
  title?: string;
  text?: string;
};

type CmsServicesPayload = {
  items?: CmsServiceItem[];
};

type NormalizedService = {
  id: string;
  title: string;
  text: string;
};

const REMOTE_API_BASE = "https://cms.purplemusicgroup.com";
const REMOTE_SITE_KEY = "purple-crunch-records";
const CMS_KEY = "pcr.services";

function safeJsonParse<T>(raw: unknown, fallback: T): T {
  if (!raw) return fallback;

  try {
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

function normalizeTitle(title: string) {
  return String(title || "").trim();
}

const PrivacyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 2l7 3.5V11c0 5.15-3.35 9.53-7 11-3.65-1.47-7-5.85-7-11V5.5L12 2z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M8.8 12.1c.9-1.55 2.02-2.32 3.2-2.32s2.3.77 3.2 2.32c-.9 1.55-2.02 2.32-3.2 2.32s-2.3-.77-3.2-2.32z"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12.1" r="0.9" fill="currentColor" />
  </svg>
);

const SovereigntyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M5 18h14M7 18V9.5l3-2.3 2 1.5 2-1.5 3 2.3V18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 9l2-3 3 2 3-2 2 3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="11.2" r="1.2" fill="currentColor" />
  </svg>
);

const PrecisionIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
    <path
      d="M12 2v3.2M12 18.8V22M2 12h3.2M18.8 12H22"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path d="M17 7l-1.8 1.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

function iconForService(title: string, index: number) {
  const t = title.toLowerCase();

  if (t.includes("privacy")) return <PrivacyIcon />;
  if (t.includes("sovereignty")) return <SovereigntyIcon />;
  if (t.includes("precision") || t.includes("precesion") || t.includes("strike")) {
    return <PrecisionIcon />;
  }

  if (index === 0) return <PrivacyIcon />;
  if (index === 1) return <SovereigntyIcon />;
  return <PrecisionIcon />;
}

export default function Services({ isActive = true }: Props) {
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [cmsItems, setCmsItems] = useState<NormalizedService[]>([]);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setPhase(isActive ? "in" : "out");
  }, [isActive]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) {
      el.style.setProperty("--fade-progress", "1");
      return;
    }

    let raf = 0;

    const clamp = (value: number, min: number, max: number) =>
      Math.max(min, Math.min(max, value));

    const update = () => {
      raf = 0;

      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;

      const enterDistance = vh * 0.92;
      const exitDistance = vh * 0.72;

      const enterProgress = clamp((vh - rect.top) / enterDistance, 0, 1);
      const exitProgress = clamp(rect.bottom / exitDistance, 0, 1);

      const rawProgress = Math.min(enterProgress, exitProgress);
      const easedProgress = rawProgress * rawProgress * (3 - 2 * rawProgress);

      el.style.setProperty("--fade-progress", String(easedProgress));
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      try {
        const url = buildUrl(
          REMOTE_API_BASE,
          `/api/cms?siteKey=${encodeURIComponent(REMOTE_SITE_KEY)}&key=${encodeURIComponent(CMS_KEY)}&ts=${Date.now()}`
        );

        const r = await fetch(url, {
          signal: controller.signal,
          cache: "no-store",
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        });

        if (!alive || r.status === 404 || !r.ok) {
          if (alive) setCmsItems([]);
          return;
        }

        const wrapper = await r.json().catch(() => null as any);
        if (!alive) return;

        const data = safeJsonParse<CmsServicesPayload>(wrapper?.json, { items: [] });

        const nextItems: NormalizedService[] = Array.isArray(data?.items)
          ? data.items
              .map((it, i) => ({
                id: String(it?.id || `svc_${i + 1}`),
                title: String(it?.title || "").trim(),
                text: String(it?.text || "").trim(),
              }))
              .filter((it) => it.title || it.text)
          : [];

        console.log("PCR services raw:", wrapper);
        console.log("PCR services parsed:", data);
        console.log("PCR services visible items:", nextItems);

        if (alive) setCmsItems(nextItems);
      } catch (err) {
        console.error("PCR services load failed:", err);
        if (alive) setCmsItems([]);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  const items = useMemo(
    () =>
      cmsItems.map((it, idx) => ({
        id: it.id,
        icon: iconForService(normalizeTitle(it.title), idx),
        title: normalizeTitle(it.title),
        desc: it.text,
      })),
    [cmsItems]
  );

  const topItem = items[0];
  const bottomItems = items.slice(1);

  const cls =
    "page " +
    (phase === "in"
      ? "animate__animated animate__slideInRight"
      : "animate__animated animate__slideOutLeft");

  if (!items.length) return null;

  return (
    <section
      id="services"
      ref={sectionRef}
      className={cls}
      aria-hidden={!isActive}
      style={
        {
          animationDuration: "650ms",
          ["--fade-progress" as any]: 0,
        } as React.CSSProperties
      }
    >
      <div className="about-bg" aria-hidden="true" />

      <div className="svc-center svc-center--pyramid">
        <div className="svc-inner svc-inner--pyramid">
          <h2 className="about-title svc-title">
            <span className="svc-titleWhite">OUR</span>{" "}
            <span className="type-gradient">SERVICES</span>
          </h2>

          <div className="svc-pyramid">
            {topItem && (
              <div className="svc-topRow">
                <article className="svc-card" key={topItem.id}>
                  <div className="svc-icon" aria-hidden="true">
                    <span className="svc-iconRing">{topItem.icon}</span>
                  </div>
                  <h3 className="svc-name">{topItem.title}</h3>
                  <p className="svc-desc">{topItem.desc}</p>
                </article>
              </div>
            )}

            {!!bottomItems.length && (
              <div className="svc-bottomRow">
                {bottomItems.map((it) => (
                  <article className="svc-card" key={it.id}>
                    <div className="svc-icon" aria-hidden="true">
                      <span className="svc-iconRing">{it.icon}</span>
                    </div>
                    <h3 className="svc-name">{it.title}</h3>
                    <p className="svc-desc">{it.desc}</p>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="svc-powerMove" aria-hidden="true">
            <img
              className="svc-powerMoveLogo"
              src="/branding/pcr-logo-mark.png"
              alt="PCR"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}