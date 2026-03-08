import { useEffect, useMemo, useState } from "react";
import { buildApiUrl } from "../config/apiBase";
import "../style/TikTokTrends.css";

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

    (async () => {
      try {
        const url = buildApiUrl(
          `/api/cms?siteKey=${encodeURIComponent(CMS_SITE_KEY)}&key=${encodeURIComponent(
            CMS_KEY_TIKTOK
          )}&ts=${Date.now()}`
        );

        const res = await fetch(url);
        if (res.status === 404) return;

        const text = await res.text().catch(() => "");
        if (!res.ok) return;

        const dto = safeJsonParse<{ json?: any }>(text, {} as any);
        const next = normalizeVideos(dto?.json);

        if (alive && next.length) setVideos(next);
      } catch {
        // ignore
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const list = useMemo(() => (videos.length ? videos : DEFAULT_VIDEOS), [videos]);

  return (
    <section id="tiktok-trends" aria-hidden={!isActive}>
      <div className="ttr-wrap">
        <h2 className="ttr-title">
          <span className="ttr-title-light">TIKTOK</span>{" "}
          <span className="ttr-title-grad type-gradient">TRENDS</span>
        </h2>

        <div className="ttr-row">
          {list.slice(0, 3).map((url) => {
            const id = getTikTokId(url);
            const embedSrc = id ? `https://www.tiktok.com/embed/v2/${id}` : url;

            return (
              <article className="ttr-card" key={url}>
                <div className="ttr-phone" aria-label="TikTok video">
                  <div className="ttr-phone__bezel">
                    <div className="ttr-phone__screen">
                      <iframe
                        src={embedSrc}
                        title="TikTok video"
                        scrolling="no"
                        allow="encrypted-media; picture-in-picture"
                        referrerPolicy="strict-origin-when-cross-origin"
                      />
                    </div>

                    <div className="ttr-phone__dynamic-island" aria-hidden="true">
                      <span className="ttr-phone__island-dot" />
                      <span className="ttr-phone__island-lens" />
                    </div>

                    <div className="ttr-phone__side ttr-phone__side--left" aria-hidden="true">
                      <span className="ttr-phone__btn ttr-phone__btn--mute" />
                      <span className="ttr-phone__btn ttr-phone__btn--vol" />
                      <span className="ttr-phone__btn ttr-phone__btn--vol2" />
                    </div>

                    <div className="ttr-phone__side ttr-phone__side--right" aria-hidden="true">
                      <span className="ttr-phone__btn ttr-phone__btn--power" />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
