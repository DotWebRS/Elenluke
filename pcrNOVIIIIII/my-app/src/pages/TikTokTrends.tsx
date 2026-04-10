import { useEffect, useMemo, useRef, useState } from "react";
import FadeSection from "../components/FadeSection";
import { buildApiUrl } from "../config/apiBase";

type TikTokItem = { id?: string; url: string };
type TikTokCms = { items: TikTokItem[] };

const CMS_SITE_KEY = "purple-crunch-records";
const CMS_KEY_TIKTOK = "pcr.tiktok.items";

const DEFAULT_VIDEOS: string[] = [
  "https://www.tiktok.com/@rntyler/video/7496960131242970373",
  "https://www.tiktok.com/@championsleague/video/7564775226530221334",
  "https://www.tiktok.com/@looooooooch/video/7479530147931032840",
  "https://www.tiktok.com/@nba/video/7560000000000000000",
  "https://www.tiktok.com/@fifa/video/7560000000000000001",
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

function normalizeVideos(payload: any): string[] {
  const parsed = safeJsonParse<TikTokCms>(payload, { items: [] });
  const urls = (parsed.items || [])
    .map((x) => String(x?.url ?? "").trim())
    .filter(Boolean)
    .slice(0, 5);

  if (!urls.length) return DEFAULT_VIDEOS.slice(0, 5);

  const result = [...urls];
  while (result.length < 5) {
    result.push(...DEFAULT_VIDEOS.slice(0, 5 - result.length));
  }

  return result.slice(0, 5);
}

function getTikTokId(url: string) {
  const m = String(url || "").match(/\/video\/(\d+)/);
  return m?.[1] ?? "";
}

function buildPlayerUrl(url: string, autoplay = false) {
  const id = getTikTokId(url);
  if (!id) return url;

  const u = new URL(`https://www.tiktok.com/player/v1/${id}`);
  u.searchParams.set("autoplay", autoplay ? "1" : "0");
  u.searchParams.set("muted", "0");
  u.searchParams.set("controls", "1");
  u.searchParams.set("play_button", "0");
  u.searchParams.set("volume_control", "1");
  u.searchParams.set("fullscreen_button", "1");
  u.searchParams.set("description", "0");
  u.searchParams.set("music_info", "0");
  u.searchParams.set("rel", "0");
  return u.toString();
}

function buildPreviewUrl(url: string) {
  const id = getTikTokId(url);
  if (!id) return url;

  const u = new URL(`https://www.tiktok.com/player/v1/${id}`);
  u.searchParams.set("autoplay", "0");
  u.searchParams.set("muted", "1");
  u.searchParams.set("controls", "0");
  u.searchParams.set("play_button", "0");
  u.searchParams.set("volume_control", "0");
  u.searchParams.set("fullscreen_button", "0");
  u.searchParams.set("description", "0");
  u.searchParams.set("music_info", "0");
  u.searchParams.set("rel", "0");
  return u.toString();
}

function signedDistance(index: number, active: number, total: number) {
  const raw = (index - active + total) % total;
  if (raw === 0) return 0;
  return raw <= total / 2 ? raw : raw - total;
}

type Slot = "far-left" | "left" | "center" | "right" | "far-right";

function slotFromDistance(distance: number): Slot {
  if (distance === 0) return "center";
  if (distance === -1) return "left";
  if (distance === 1) return "right";
  if (distance === -2) return "far-left";
  return "far-right";
}

type TikTokMessageType = "play" | "pause" | "mute" | "unMute";

function postToPlayer(iframe: HTMLIFrameElement | null, type: TikTokMessageType) {
  if (!iframe?.contentWindow) return;

  iframe.contentWindow.postMessage(
    {
      type,
      value: undefined,
      "x-tiktok-player": true,
    },
    "*"
  );
}

export default function TikTokTrends() {
  const [videos, setVideos] = useState<string[]>(DEFAULT_VIDEOS.slice(0, 5));
  const [activeIndex, setActiveIndex] = useState(0);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [hasUnlockedPlayback, setHasUnlockedPlayback] = useState(false);
  const [activeSrc, setActiveSrc] = useState(buildPlayerUrl(DEFAULT_VIDEOS[0], false));

  const activeIframeRef = useRef<HTMLIFrameElement | null>(null);
  const pendingPlayRef = useRef(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const url = buildApiUrl(
          `/api/cms?siteKey=${encodeURIComponent(CMS_SITE_KEY)}&key=${encodeURIComponent(
            CMS_KEY_TIKTOK
          )}&ts=${Date.now()}`
        );

        const res = await fetch(url, {
          headers: { Accept: "application/json, text/plain;q=0.9, */*;q=0.8" },
          cache: "no-store",
        });

        if (res.status === 404 || !res.ok) return;

        const text = await res.text().catch(() => "");
        const dto = safeJsonParse<{ json?: any }>(text, {} as any);
        const next = normalizeVideos(dto?.json);

        if (!alive) return;

        setVideos(next);
        setActiveIndex(0);
        setLoaded({});
        setHasUnlockedPlayback(false);
        setActiveSrc(buildPlayerUrl(next[0], false));
        pendingPlayRef.current = false;
      } catch {
        //
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const list = useMemo(
    () => normalizeVideos({ items: videos.map((url) => ({ url })) }),
    [videos]
  );

  const items = useMemo(() => {
    return list.map((url, index) => {
      const distance = signedDistance(index, activeIndex, list.length);
      const slot = slotFromDistance(distance);
      const isActive = distance === 0;

      return {
        url,
        index,
        distance,
        slot,
        isActive,
        previewSrc: buildPreviewUrl(url),
      };
    });
  }, [list, activeIndex]);

  const activeItem = items.find((x) => x.isActive) ?? items[0];
  const previewItems = items.filter((x) => !x.isActive);

  const forcePlayWithSound = () => {
    const iframe = activeIframeRef.current;
    if (!iframe) return;

    postToPlayer(iframe, "unMute");
    postToPlayer(iframe, "play");

    setTimeout(() => {
      postToPlayer(iframe, "unMute");
      postToPlayer(iframe, "play");
    }, 150);

    setTimeout(() => {
      postToPlayer(iframe, "unMute");
      postToPlayer(iframe, "play");
    }, 400);
  };

  const setActiveVideo = (index: number, playWithSound: boolean) => {
    const url = list[index];
    setActiveIndex(index);
    setLoaded((prev) => ({
      ...prev,
      [`active:${url}`]: false,
    }));

    if (playWithSound) {
      setHasUnlockedPlayback(true);
      pendingPlayRef.current = true;
      setActiveSrc(buildPlayerUrl(url, true));
    } else {
      pendingPlayRef.current = false;
      setActiveSrc(buildPlayerUrl(url, false));
    }
  };

  const unlockAndPlayCurrent = () => {
    setActiveVideo(activeIndex, true);
  };

  const goPrev = () => {
    const nextIndex = (activeIndex - 1 + list.length) % list.length;
    setActiveVideo(nextIndex, hasUnlockedPlayback);
  };

  const goNext = () => {
    const nextIndex = (activeIndex + 1) % list.length;
    setActiveVideo(nextIndex, hasUnlockedPlayback);
  };

  const openVideo = (index: number) => {
    setActiveVideo(index, hasUnlockedPlayback);
  };

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data["x-tiktok-player"] !== true) return;

      if (data.type === "onPlayerReady" && pendingPlayRef.current) {
        forcePlayWithSound();
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const handleActiveLoad = () => {
    setLoaded((prev) => ({
      ...prev,
      [`active:${activeItem.url}`]: true,
    }));

    if (pendingPlayRef.current) {
      setTimeout(() => {
        forcePlayWithSound();
      }, 120);
    }
  };

  return (
    <FadeSection id="tiktok-trends" className="ttr-section">
      <div className="ttr-bg-orb" aria-hidden="true" />

      <div className="ttr-wrap">
        <div className="ttr-head">
          <h2 className="ttr-title">
            <span className="ttr-title-light">TIKTOK</span>
            <span className="ttr-title-grad">TRENDS</span>
          </h2>
          <div className="ttr-title-line" aria-hidden="true" />
        </div>

        <div className="ttr-layout">
          <button
            type="button"
            className="ttr-nav ttr-nav--left"
            onClick={goPrev}
            aria-label="Previous TikTok"
          >
            <span className="ttr-nav__chevron" />
          </button>

          <div className="ttr-stage">
            <div className="ttr-previewLayer">
              {previewItems.map((item) => (
                <button
                  key={item.url}
                  type="button"
                  className={`ttr-preview ttr-preview--${item.slot}`}
                  onClick={() => openVideo(item.index)}
                  aria-label={`Open TikTok ${item.index + 1}`}
                >
                  <div className="ttr-preview__inner">
                    {!loaded[`preview:${item.url}`] && (
                      <div className="ttr-loading ttr-loading--preview">
                        <div className="ttr-loading__spinner" />
                      </div>
                    )}

                    <iframe
                      src={item.previewSrc}
                      title={`TikTok preview ${item.index + 1}`}
                      scrolling="no"
                      allow="fullscreen"
                      referrerPolicy="strict-origin-when-cross-origin"
                      loading={Math.abs(item.distance) <= 1 ? "eager" : "lazy"}
                      onLoad={() =>
                        setLoaded((prev) => ({
                          ...prev,
                          [`preview:${item.url}`]: true,
                        }))
                      }
                      className={`ttr-iframe ttr-iframe--preview ${loaded[`preview:${item.url}`] ? "is-loaded" : ""}`}
                    />
                  </div>
                </button>
              ))}
            </div>

            <div className="ttr-featureWrap">
              <article className="ttr-phone">
                <div className="ttr-phone__shell">
                  <div className="ttr-phone__screen">
                    {!hasUnlockedPlayback ? (
                      <div className="ttr-poster">
                        <div className="ttr-poster__glow" aria-hidden="true" />
                        <button
                          type="button"
                          className="ttr-playButton"
                          onClick={unlockAndPlayCurrent}
                          aria-label="Play TikTok video with sound"
                        >
                          <span className="ttr-playButton__triangle" />
                        </button>
                      </div>
                    ) : (
                      <>
                        {!loaded[`active:${activeItem.url}`] && (
                          <div className="ttr-loading">
                            <div className="ttr-loading__spinner" />
                          </div>
                        )}

                        <iframe
                          key={`active-${activeItem.url}`}
                          ref={activeIframeRef}
                          src={activeSrc}
                          title="Featured TikTok"
                          scrolling="no"
                          allow="autoplay; fullscreen"
                          allowFullScreen
                          referrerPolicy="strict-origin-when-cross-origin"
                          loading="eager"
                          onLoad={handleActiveLoad}
                          className={`ttr-iframe ${loaded[`active:${activeItem.url}`] ? "is-loaded" : ""}`}
                        />
                      </>
                    )}
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

                <div className="ttr-featureGlow" aria-hidden="true" />
              </article>
            </div>
          </div>

          <button
            type="button"
            className="ttr-nav ttr-nav--right"
            onClick={goNext}
            aria-label="Next TikTok"
          >
            <span className="ttr-nav__chevron" />
          </button>
        </div>

        <div className="ttr-controls">
          <div className="ttr-dots">
            {list.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`ttr-dot ${i === activeIndex ? "is-active" : ""}`}
                onClick={() => openVideo(i)}
                aria-label={`Go to TikTok ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </FadeSection>
  );
}