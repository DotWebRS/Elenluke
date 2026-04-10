import { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config/apiBase";
import FadeSection from "../components/FadeSection";
import Footer from "../components/Footer";

type CmsSyncPayload = {
  h1: string;
  t1: string;
  h2: string;
  t2: string;
  h3: string;
  t3: string;
};

type SyncPartner = {
  id: string;
  src: string;
  name: string;
  href: string;
};

type CmsSyncPartnersPayload = {
  items: SyncPartner[];
};

const CMS_SITE_KEY = "purple-crunch-publishing";

const DEFAULT_SYNC: CmsSyncPayload = {
  h1: "Sync Made Simple. Music Made Powerful.",
  t1: "We connect your music to film, TV, ads, games, and digital content with smooth clearance and transparent licensing.",
  h2: "Where Music meets Global impact.",
  t2: "Worldwide rights administration and strategic placements that grow your catalog and revenue.",
  h3: "Where premium sound meets viral energy.",
  t3: "From trending digital sounds to bespoke compositions—built for your audience and your brief.",
};

const DEFAULT_SYNC_PARTNERS: CmsSyncPartnersPayload = {
  items: [
    {
      id: "partner_1",
      name: "Roblox",
      src: "/branding/PNG/roblox.png",
      href: "https://www.roblox.com/",
    },
    {
      id: "partner_2",
      name: "Amanotes",
      src: "/branding/PNG/amanotes.avif",
      href: "https://amanotes.com/",
    },
    {
      id: "partner_3",
      name: "Fortnite",
      src: "/branding/PNG/fortnite.png",
      href: "https://www.fortnite.com/",
    },
  ],
};

function safeParseJson<T>(raw: any, fallback: T): T {
  try {
    if (raw == null) return fallback;
    if (typeof raw === "string") return JSON.parse(raw) as T;
    return raw as T;
  } catch {
    return fallback;
  }
}

function buildApiUrl(path: string) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return base ? `${base}/${p}` : `/${p}`;
}

function absolutizeSrc(src: string) {
  const s = String(src || "").trim();
  if (!s) return "";
  if (s.startsWith("data:")) return s;
  if (s.startsWith("blob:")) return s;
  if (/^https?:\/\//i.test(s)) return s;

  if (s.startsWith("/uploads/")) {
    return buildApiUrl(s);
  }

  if (s.startsWith("/")) {
    return s;
  }

  return buildApiUrl(s);
}

function normalizeHref(href: string) {
  const h = String(href || "").trim();
  if (!h) return "#";
  if (/^https?:\/\//i.test(h)) return h;
  if (h.startsWith("/")) return h;
  return `https://${h}`;
}

function pickPartnerSrc(it: any) {
  return String(
    it?.src ??
      it?.logo ??
      it?.image ??
      it?.img ??
      it?.filePath ??
      it?.path ??
      it?.assetUrl ??
      it?.asset ??
      ""
  ).trim();
}

function pickPartnerName(it: any, i: number) {
  return String(
    it?.name ??
      it?.title ??
      it?.label ??
      it?.partnerName ??
      `Partner ${i + 1}`
  ).trim();
}

function pickPartnerHref(it: any) {
  return String(it?.href ?? it?.link ?? it?.website ?? "").trim();
}

async function cmsGet(siteKey: string, key: string, signal: AbortSignal) {
  const ts = Date.now();
  const url = buildApiUrl(
    `/api/cms?siteKey=${encodeURIComponent(siteKey)}&key=${encodeURIComponent(
      key
    )}&ts=${ts}`
  );

  return fetch(url, {
    signal,
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Accept: "application/json",
    },
  });
}

function normalizePartners(raw: any): CmsSyncPartnersPayload {
  const rawItems = Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw?.partners)
    ? raw.partners
    : Array.isArray(raw?.logos)
    ? raw.logos
    : Array.isArray(raw)
    ? raw
    : [];

  const items = rawItems
    .map((it: any, i: number) => ({
      id: String(it?.id || it?._id || `sync_partner_${i + 1}`),
      src: absolutizeSrc(pickPartnerSrc(it)),
      name: pickPartnerName(it, i),
      href: normalizeHref(pickPartnerHref(it)),
    }))
    .filter((x: SyncPartner) => x.src && x.name);

  return { items };
}

const SyncLicensingPage = () => {
  const navigate = useNavigate();
  const [syncText, setSyncText] = useState<CmsSyncPayload>(DEFAULT_SYNC);
  const [syncPartners, setSyncPartners] = useState<CmsSyncPartnersPayload>(
    normalizePartners(DEFAULT_SYNC_PARTNERS)
  );

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      try {
        const [syncRes, partnersRes] = await Promise.all([
          cmsGet(CMS_SITE_KEY, "home.syncText", controller.signal),
          cmsGet(CMS_SITE_KEY, "sync.partners", controller.signal),
        ]);

        if (syncRes.ok && syncRes.status !== 404) {
          const payload = await syncRes.json().catch(() => null as any);
          const parsed = safeParseJson<CmsSyncPayload>(
            payload?.json ?? payload,
            DEFAULT_SYNC
          );

          const next: CmsSyncPayload = {
            h1: parsed?.h1 ?? DEFAULT_SYNC.h1,
            t1: parsed?.t1 ?? DEFAULT_SYNC.t1,
            h2: parsed?.h2 ?? DEFAULT_SYNC.h2,
            t2: parsed?.t2 ?? DEFAULT_SYNC.t2,
            h3: parsed?.h3 ?? DEFAULT_SYNC.h3,
            t3: parsed?.t3 ?? DEFAULT_SYNC.t3,
          };

          if (alive) setSyncText(next);
        }

        if (partnersRes.ok && partnersRes.status !== 404) {
          const payload = await partnersRes.json().catch(() => null as any);
          const parsed = safeParseJson<any>(
            payload?.json ?? payload,
            DEFAULT_SYNC_PARTNERS
          );
          const nextPartners = normalizePartners(parsed);

          if (alive) {
            setSyncPartners(
              nextPartners.items.length
                ? nextPartners
                : normalizePartners(DEFAULT_SYNC_PARTNERS)
            );
          }
        } else {
          if (alive) {
            setSyncPartners(normalizePartners(DEFAULT_SYNC_PARTNERS));
          }
        }
      } catch (err) {
        console.error("Failed to load Sync Licensing CMS:", err);
        if (alive) {
          setSyncText(DEFAULT_SYNC);
          setSyncPartners(normalizePartners(DEFAULT_SYNC_PARTNERS));
        }
      }
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
            <h2 className="sync-page-title">
              <span className="sync-page-title__white">SYNC</span>{" "}
              <span className="sync-page-title__grad">LICENSING</span>
            </h2>

            <button
              type="button"
              className="artists-link artists-link--back sync-link-btn"
              onClick={() => navigate("/#sync")}
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

          {syncPartners.items.length > 0 && (
            <div className="sync-partners-block">
              <div className="sync-head sync-head--center">
                <h2 className="sync-page-title">
                  <span className="sync-page-title__white">OUR</span>{" "}
                  <span className="sync-page-title__grad">PARTNERS</span>
                </h2>
              </div>

              <div className="sync-partners-row">
                {syncPartners.items.map((partner) => {
                  const href = partner.href || "#";

                  return (
                    <a
                      key={partner.id}
                      className="sync-partner-logo"
                      href={href}
                      target={href === "#" || href.startsWith("/") ? undefined : "_blank"}
                      rel={href === "#" || href.startsWith("/") ? undefined : "noreferrer"}
                      title={partner.name}
                      aria-label={partner.name}
                      onClick={(e) => {
                        if (href === "#") e.preventDefault();
                      }}
                    >
                      <img
                        src={partner.src}
                        alt={partner.name}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        onError={(e) => {
                          console.error("Partner image failed:", partner.name, partner.src);
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </Container>
      </FadeSection>

      <Footer />
    </>
  );
};

export default SyncLicensingPage;