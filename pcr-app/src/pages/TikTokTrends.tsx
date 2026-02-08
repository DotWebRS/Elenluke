import React, { useEffect, useMemo, useState } from "react";
import { buildApiUrl } from "../config/apiBase";

type Props = { isActive?: boolean };

type TikTokItem = { id?: string; url: string };
type TikTokCms = { items: TikTokItem[] };

const CMS_SITE_KEY = "purple-crunch-records";
const CMS_KEY_TIKTOK = "pcr.tiktok.items";

const DEFAULT_VIDEOS: string[] = [
  "https://www.tiktok.com/@rntyler/video/7496960131242970373?_r=1&_t=ZG-93gu7pmtNs8",
  "https://www.tiktok.com/@championsleague/video/7564775226530221334?_r=1&_t=ZG-93gu2pqMZn7",
  "https://www.tiktok.com/@looooooooch/video/7479530147931032840?_r=1&_t=ZG-93gtAcWTGMq",
];

function safeJsonParse<T>(value: any, fallback: T): T {
  try {
    if (!value) return fallback;
    if (typeof value === "string") return JSON.parse(value) as T;
    return value as T;
  } catch {
    return fallback;
  }
}

function getTikTokId(url: string) {
  const m = String(url || "").match(/\/video\/(\d+)/);
  return m?.[1] ?? "";
}

function normalizeVideos(payload: any): string[] {
  const parsed = safeJsonParse<TikTokCms>(payload, { items: [] });
  const urls = (parsed.items || [])
    .map((x) => String(x?.url ?? "").trim())
    .filter(Boolean)
    .slice(0, 3);
  return urls.length ? urls : DEFAULT_VIDEOS;
}

export default function TikTokTrends({ isActive = true }: Props) {
  const [videos, setVideos] = useState<string[]>(DEFAULT_VIDEOS);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const url = buildApiUrl(
          `/api/cms?siteKey=${encodeURIComponent(CMS_SITE_KEY)}&key=${encodeURIComponent(CMS_KEY_TIKTOK)}&ts=${Date.now()}`
        );

        const res = await fetch(url);
        if (res.status === 404) return;

        const text = await res.text().catch(() => "");
        if (!res.ok) return;

        const dto = safeJsonParse<{ json?: any }>(text, {} as any);
        const next = normalizeVideos(dto?.json);

        if (alive && next.length) setVideos(next);
      } catch {
        //
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, []);

  const list = useMemo(() => (videos.length ? videos : DEFAULT_VIDEOS), [videos]);

  return (
    <section id="tiktok-trends" aria-hidden={!isActive}>
      <div className="ttr-wrap">
        <h2 className="about-title ttr-title">
          <span className="about-title-light">TIKTOK</span>{" "}
          <span className="about-title-grad">TRENDS</span>
        </h2>

        <div className="ttr-row">
          {list.map((url) => {
            const id = getTikTokId(url);
            const embedSrc = id ? `https://www.tiktok.com/embed/v2/${id}` : url;

            return (
              <a
                key={url}
                className="ttr-card"
                href={url}
                target="_blank"
                rel="noreferrer"
                aria-label="Open on TikTok"
              >
                <div className="ttr-embed" aria-hidden="true">
                  <iframe
                    src={embedSrc}
                    title="TikTok video"
                    scrolling="no"
                    allow="encrypted-media; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>

                <div className="ttr-foot">
                  <span className="ttr-openLink">Open on TikTok</span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
