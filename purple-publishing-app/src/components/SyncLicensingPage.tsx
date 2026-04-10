import { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import { useNavigate } from "react-router-dom";
import type { AdminSiteKey } from "../components/admin/adminSites";
import { API_BASE } from "../config/apiBase";
import FadeSection from "./FadeSection";
import Footer from "./Footer";

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

function hostnameToSiteKey(hostname: string): AdminSiteKey {
  const h = (hostname || "").toLowerCase().replace(/^www\./, "");

  if (h.includes("publishing")) return "purple-crunch-publishing";
  if (h.includes("records")) return "purple-crunch-records";
  if (h.includes("music-group")) return "purple-music-group";

  return "purple-crunch-publishing";
}

function buildApiUrl(path: string) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return base ? `${base}/${p}` : `/${p}`;
}

function absolutizeSrc(src: string) {
  const s = (src || "").trim();
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

  return s;
}

async function cmsGet(siteKey: string, key: string, signal: AbortSignal) {
  const ts = Date.now();
  const url = buildApiUrl(
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

function normalizePartners(raw: CmsSyncPartnersPayload | null | undefined): CmsSyncPartnersPayload {
  const items = (raw?.items || [])
    .map((it: any, i: number) => ({
      id: String(it?.id || `sync_partner_${i + 1}`),
      src: absolutizeSrc(String(it?.src ?? "")),
      name: String(it?.name ?? "").trim(),
      href: String(it?.href ?? "").trim(),
    }))
    .filter((x) => x.src && x.name);

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
      const host = window.location.hostname.toLowerCase().replace(/^www\./, "");
      const siteKey = hostnameToSiteKey(host);

      try {
        const [syncRes, partnersRes] = await Promise.all([
          cmsGet(siteKey, "home.syncText", controller.signal),
          cmsGet(siteKey, "sync.partners", controller.signal),
        ]);

        if (syncRes.status !== 404 && syncRes.ok) {
          const payload = await syncRes.json().catch(() => null as any);
          const parsed = safeParseJson<CmsSyncPayload>(payload?.json, DEFAULT_SYNC);

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

        if (partnersRes.status !== 404 && partnersRes.ok) {
          const payload = await partnersRes.json().catch(() => null as any);
          const parsed = safeParseJson<CmsSyncPartnersPayload>(payload?.json, DEFAULT_SYNC_PARTNERS);
          const nextPartners = normalizePartners(parsed);

          console.log("sync.partners payload:", payload);
          console.log("sync.partners parsed:", parsed);
          console.log("sync.partners normalized:", nextPartners);

          if (alive) {
            setSyncPartners(
              nextPartners.items.length ? nextPartners : normalizePartners(DEFAULT_SYNC_PARTNERS)
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
            <h2 className="about-title about-title-centered">
              SYNC <span className="about-us-animated">LICENSING</span>
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
                <h2 className="about-title about-title-centered">
                  OUR <span className="about-us-animated">PARTNERS</span>
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
                      target={href === "#" ? undefined : "_blank"}
                      rel={href === "#" ? undefined : "noreferrer"}
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
                          (e.currentTarget as HTMLImageElement).style.display = "none";
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