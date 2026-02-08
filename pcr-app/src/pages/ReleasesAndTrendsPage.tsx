// src/pages/ReleasesAndTrendsFullPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import ReleasesFooterBar from "../components/ReleasesFooterBar";
import { buildApiUrl } from "../config/apiBase";

type Props = { isActive?: boolean };

type ReleaseStatus = "latest" | "upcoming" | "all";

type ReleaseItem = {
  id: string;
  imageSrc: string;
  artist: string;
  title: string;
  dateISO: string; // YYYY-MM-DD
  platformLabel?: string;
  url?: string;
};

// -------------------- CMS --------------------
const CMS_SITE_KEY = "purple-crunch-records";
const CMS_KEY_RELEASES_HUB = "pcr.releasesHub.items";

function safeJsonParse<T>(raw: any, fallback: T): T {
  try {
    if (!raw) return fallback;
    if (typeof raw === "string") return JSON.parse(raw) as T;
    return raw as T;
  } catch {
    return fallback;
  }
}

function ensureItems(payload: any): ReleaseItem[] {
  const items = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
  return items
    .map((x: any) => ({
      id: String(x?.id ?? "").trim() || `rh_${Math.random().toString(16).slice(2)}_${Date.now()}`,
      imageSrc: String(x?.imageSrc ?? "").trim(),
      artist: String(x?.artist ?? "").trim(),
      title: String(x?.title ?? "").trim(),
      dateISO: String(x?.dateISO ?? "").trim(),
      platformLabel: String(x?.platformLabel ?? "").trim() || undefined,
      url: String(x?.url ?? "").trim() || undefined,
    }))
    .filter((x: ReleaseItem) => x.artist || x.title || x.imageSrc || x.dateISO || x.url);
}

// -------------------- DATE HELPERS --------------------
function isoToDate(iso: string) {
  const [y, m, d] = String(iso || "")
    .split("-")
    .map((x) => parseInt(x, 10));
  return new Date(y || 1970, (m || 1) - 1, d || 1, 12, 0, 0);
}

// format: DD MMM YYYY
function formatDateShort(iso: string) {
  const dt = isoToDate(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dd = String(dt.getDate()).padStart(2, "0");
  const m = months[dt.getMonth()] || "—";
  return `${dd} ${m} ${dt.getFullYear()}`;
}

function isUpcoming(iso: string) {
  const now = new Date();
  const dt = isoToDate(iso);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  return dt.getTime() > today.getTime();
}

function sortDescByDate(a: ReleaseItem, b: ReleaseItem) {
  return isoToDate(b.dateISO).getTime() - isoToDate(a.dateISO).getTime();
}

function sortAscByDate(a: ReleaseItem, b: ReleaseItem) {
  return isoToDate(a.dateISO).getTime() - isoToDate(b.dateISO).getTime();
}

// -------------------- SPOTIFY EMBED HELPERS --------------------
function getSpotifyEmbedSrc(url?: string) {
  if (!url) return null;
  const m = url.match(/open\.spotify\.com\/(track|album|playlist|episode|show)\/([A-Za-z0-9]+)/i);
  if (!m) return null;
  const type = m[1].toLowerCase();
  const id = m[2];
  return `https://open.spotify.com/embed/${type}/${id}`;
}

export default function ReleasesAndTrendsFullPage({ isActive = true }: Props) {
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [filter, setFilter] = useState<ReleaseStatus>("latest");
  const [query, setQuery] = useState("");

  const [items, setItems] = useState<ReleaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => setPhase(isActive ? "in" : "out"), [isActive]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);

        const url = buildApiUrl(
          `/api/cms?siteKey=${encodeURIComponent(CMS_SITE_KEY)}&key=${encodeURIComponent(
            CMS_KEY_RELEASES_HUB
          )}&ts=${Date.now()}`
        );

        const res = await fetch(url);
        if (res.status === 404) {
          if (alive) setItems([]);
          return;
        }

        const text = await res.text().catch(() => "");
        if (!res.ok) {
          if (alive) setItems([]);
          return;
        }

        const dto = safeJsonParse<{ json?: any }>(text, {} as any);
        const payload = dto?.json;

        const parsed = safeJsonParse<any>(payload, payload);
        const nextItems = ensureItems(parsed);

        if (alive) setItems(nextItems);
      } catch {
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, []);

  const cls =
    "page " +
    (phase === "in"
      ? "animate__animated animate__slideInRight"
      : "animate__animated animate__slideOutLeft");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let base = [...items];

    if (filter === "upcoming") {
      base = base.filter((x) => x.dateISO && isUpcoming(x.dateISO)).sort(sortAscByDate);
    } else if (filter === "latest") {
      base = base.sort(sortDescByDate);
    } else {
      base = base.sort(sortDescByDate);
    }

    if (q) {
      base = base.filter((x) => {
        const a = (x.artist || "").toLowerCase();
        const t = (x.title || "").toLowerCase();
        const d = (x.dateISO || "").toLowerCase();
        return a.includes(q) || t.includes(q) || d.includes(q);
      });
    }

    return base;
  }, [filter, query, items]);

  return (
    <>
      <section className={cls} style={{ animationDuration: "650ms" }} id="releases-trends-full">
        <div className="rtFull-bg" aria-hidden="true" />

        <div className="rtFull-content">
          <div className="rtFull-inner">
            <header className="rtFull-head">
              <h2 className="rtFull-title">
                <span className="rtFull-titleLight">RELEASES</span>{" "}
                <span className="rtFull-titleGrad">HUB</span>
              </h2>

              <div className="rtFull-controls" role="region" aria-label="Filters">
                <div className="rtEq" role="tablist" aria-label="Release filter">
                  <button
                    type="button"
                    className={["rtEq-btn", filter === "latest" ? "is-active" : ""].join(" ")}
                    onClick={() => setFilter("latest")}
                    role="tab"
                    aria-selected={filter === "latest"}
                  >
                    <span className="rtEq-bars" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                    Latest
                  </button>

                  <button
                    type="button"
                    className={["rtEq-btn", filter === "upcoming" ? "is-active" : ""].join(" ")}
                    onClick={() => setFilter("upcoming")}
                    role="tab"
                    aria-selected={filter === "upcoming"}
                  >
                    <span className="rtEq-bars" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                    Upcoming
                  </button>

                  <button
                    type="button"
                    className={["rtEq-btn", filter === "all" ? "is-active" : ""].join(" ")}
                    onClick={() => setFilter("all")}
                    role="tab"
                    aria-selected={filter === "all"}
                  >
                    <span className="rtEq-bars" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                    All
                  </button>
                </div>

                <div className="rtFull-search">
                  <input
                    className="rtFull-input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search artist, title, date…"
                    aria-label="Search releases"
                  />
                </div>
              </div>
            </header>

            <div className="rtFull-grid" role="list" aria-label="Releases list">
              {!loading && filtered.length === 0 ? <div className="rtFull-empty">No items yet.</div> : null}

              {filtered.map((it) => {
                const embedSrc = getSpotifyEmbedSrc(it.url);

                return (
                  <article className="rtFull-card" key={it.id} role="listitem">
                    <a
                      className="rtFull-media"
                      href={it.url || "#"}
                      target={it.url ? "_blank" : undefined}
                      rel={it.url ? "noreferrer" : undefined}
                      style={{ ["--bg" as any]: `url("${it.imageSrc}")` }}
                      aria-label={`${it.artist} - ${it.title}`}
                    >
                      <div className="rtFull-bgImg" aria-hidden="true" />
                      <div className="rtFull-gloss" aria-hidden="true" />
                    </a>

                    <div className="rtFull-info">
                      <div className="rtFull-meta">
                        <div className="rtFull-artist">{it.artist}</div>
                        <div className="rtFull-name">{it.title}</div>
                      </div>

                      <div className="rtFull-row">
                        <div className="rtFull-date">
                          <span className="rtFull-pill">
                            {it.dateISO && isUpcoming(it.dateISO) ? "UPCOMING" : "RELEASED"}
                          </span>
                          <span className="rtFull-dateTxt">{it.dateISO ? formatDateShort(it.dateISO) : "—"}</span>
                        </div>

                        <a className="rtFull-link" href={it.url || "#"} target="_blank" rel="noreferrer">
                          <span className="rtFull-linkTxt">Open on</span>
                          <span className="rtFull-spotifyMark" aria-label="Spotify">
                            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                              <path
                                fill="currentColor"
                                d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Zm4.589 14.507a.75.75 0 0 1-1.032.247c-2.828-1.73-6.39-2.122-10.59-1.164a.75.75 0 1 1-.333-1.463c4.61-1.05 8.56-.6 11.706 1.323a.75.75 0 0 1 .249 1.057Zm1.474-3.276a.9.9 0 0 1-1.238.297c-3.238-1.99-8.172-2.567-11.995-1.405a.9.9 0 0 1-.523-1.722c4.369-1.328 9.79-.684 13.46 1.57a.9.9 0 0 1 .296 1.26Zm.127-3.412C14.34 7.49 8.01 7.276 4.69 8.29a1.05 1.05 0 0 1-.61-2.009c3.84-1.173 10.79-.92 15.36 1.8a1.05 1.05 0 0 1-1.08 1.738Z"
                              />
                            </svg>
                          </span>
                        </a>
                      </div>
                    </div>

                    {/* full-width player strip (no button) */}
                    {embedSrc ? (
                      <div className="rtFull-strip" aria-label="Player">
                        <iframe
                          className="rtFull-stripFrame"
                          src={embedSrc}
                          width="100%"
                          height="80"
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          loading="lazy"
                          title={`${it.artist} - ${it.title} player`}
                        />
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>

            <footer className="rtFull-foot">
              <div className="rtFull-count">{loading ? "Loading…" : `${filtered.length} items`}</div>
            </footer>
          </div>
        </div>

        <style>{`
          .rtFull-strip{
            width:100%;
            margin-top:12px;
            overflow:hidden;
          }
          .rtFull-stripFrame{
            display:block;
            width:100%;
            height:80px;
            border:0;
            filter: grayscale(1) saturate(0) contrast(1.08) brightness(0.95);
          }
          
         


        `}</style>
      </section>

      <ReleasesFooterBar />
    </>
  );
}
