// src/pages/ReleasesAndTrends.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { buildApiUrl } from "../config/apiBase";

type Props = { isActive?: boolean };

type Card = {
  id: string;
  imageSrc: string;
  tiktokArtist: string;
  trackName: string;
  trackUrl: string;
};

// CMS
const CMS_SITE_KEY = "purple-crunch-records";

const CMS_KEY_RELEASES_HUB = "pcr.releasesHub.items";

type ReleaseHubItem = {
  id: string;
  imageSrc: string;
  artist: string; 
  title: string; 
  dateISO: string; 
  platformLabel?: string;
  url?: string;
};

type ReleasesHubCms = {
  items: ReleaseHubItem[];
};

function safeJsonParse<T>(raw: any, fallback: T): T {
  try {
    if (!raw) return fallback;
    if (typeof raw === "string") return JSON.parse(raw) as T;
    return raw as T;
  } catch {
    return fallback;
  }
}

function ensureHubItems(payload: any): ReleaseHubItem[] {
  const arr = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
  return arr
    .map((x: any) => ({
      id: String(x?.id ?? "").trim() || `rh_${Math.random().toString(16).slice(2)}_${Date.now()}`,
      imageSrc: String(x?.imageSrc ?? "").trim(),
      artist: String(x?.artist ?? "").trim(),
      title: String(x?.title ?? "").trim(),
      dateISO: String(x?.dateISO ?? "").trim(),
      platformLabel: String(x?.platformLabel ?? "").trim() || undefined,
      url: String(x?.url ?? "").trim() || undefined,
    }))
    .filter((x: ReleaseHubItem) => x.imageSrc || x.artist || x.title || x.url || x.dateISO);
}

function isoToDate(iso: string) {
  const [y, m, d] = String(iso || "")
    .split("-")
    .map((n) => parseInt(n, 10));
  return new Date(y || 1970, (m || 1) - 1, d || 1, 12, 0, 0);
}

function sortDescByDate(a: ReleaseHubItem, b: ReleaseHubItem) {
  return isoToDate(b.dateISO).getTime() - isoToDate(a.dateISO).getTime();
}

export default function ReleasesAndTrends({ isActive = true }: Props) {
  const [phase, setPhase] = useState<"in" | "out">("in");
  useEffect(() => setPhase(isActive ? "in" : "out"), [isActive]);

  const cls =
    "page " +
    (phase === "in"
      ? "animate__animated animate__slideInRight"
      : "animate__animated animate__slideOutLeft");

  const [hubItems, setHubItems] = useState<ReleaseHubItem[]>([]);
  const [loading, setLoading] = useState(true);

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
          if (alive) setHubItems([]);
          return;
        }

        const text = await res.text().catch(() => "");
        if (!res.ok) {
          if (alive) setHubItems([]);
          return;
        }

        const dto = safeJsonParse<{ json?: any }>(text, {} as any);
        const parsed = safeJsonParse<any>(dto?.json, dto?.json);

        const items = ensureHubItems(parsed);
        if (alive) setHubItems(items);
      } catch {
        if (alive) setHubItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, []);

  const cards = useMemo<Card[]>(() => {
    const base = [...hubItems].sort(sortDescByDate);

    return base.slice(0, 9).map((x) => ({
      id: x.id,
      imageSrc: x.imageSrc,
      tiktokArtist: x.artist || "",
      trackName: x.title || "",
      trackUrl: x.url || "#",
    }));
  }, [hubItems]);

  const count = cards.length;

  return (
    <section className={cls} style={{ animationDuration: "650ms" }} id="releases-trends">
      <div className="rt-bg" aria-hidden="true" />

      <div className="rt-content">
        <div className="rt-stack">
          <h2 className="rt-title">
            <span className="rt-title-light">RELEASES AND</span>{" "}
            <span className="rt-title-grad">TRENDS</span>
          </h2>

          <div className="rt-carousel-wrap">
            <div className="rt-entire">
              <div className="rt-carrousel" style={{ ["--count" as any]: count }} aria-label="3D carousel">
                {cards.map((it, idx) => (
                  <figure
                    key={`${it.id}_${idx}`}
                    className="rt-fig rt-shadow"
                    style={{ ["--i" as any]: idx, ["--bg" as any]: `url("${it.imageSrc}")` }}
                  >
                    <div className="rt-cardMedia" aria-hidden="true">
                      <div className="rt-cardBg" />
                      <div className="rt-cardOverlay" />
                    </div>

                    <div className="rt-cardInfo">
                      <div className="rt-meta">
                        <div className="rt-ttArtist">{it.tiktokArtist}</div>
                        <div className="rt-trackName">{it.trackName}</div>
                      </div>

                      <a
                        className="rt-openSpotify"
                        href={it.trackUrl || "#"}
                        target={it.trackUrl && it.trackUrl !== "#" ? "_blank" : undefined}
                        rel={it.trackUrl && it.trackUrl !== "#" ? "noreferrer" : undefined}
                      >
                        Open in Spotify
                      </a>
                    </div>
                  </figure>
                ))}

                {!loading && cards.length === 0 ? null : null}
              </div>
            </div>
          </div>

          <div className="rt-footer">
            <Link className="rt-seeAll" to="/releases-trends">
              SEE ALL RELEASES
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
