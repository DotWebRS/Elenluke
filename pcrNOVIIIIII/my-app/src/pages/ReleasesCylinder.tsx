import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { buildApiUrl } from "../config/apiBase";

export type ReleaseCylinderItem = {
  id: number | string;
  artist: string;
  title: string;
  releaseDate: string;
  platform: string;
  spotifyUrl: string;
  image: string;
  audioSrc?: string;
};

type Props = {
  items?: ReleaseCylinderItem[];
  audioSrc?: string;
  moreLink?: string;
};

type CmsReleaseItem = {
  id?: string;
  imageSrc?: string;
  artist?: string;
  title?: string;
  dateISO?: string;
  platformLabel?: string;
  url?: string;
  audioSrc?: string;
};

type CmsReleasesHubPayload = {
  items?: CmsReleaseItem[];
};

const CMS_SITE_KEY = "purple-crunch-records";
const CMS_KEY_RELEASES = "pcr.releasesHub.items";

const demoItems: ReleaseCylinderItem[] = [
  {
    id: 1,
    artist: "Luna Vale",
    title: "Neon Heart",
    releaseDate: "12 Apr 2026",
    platform: "Spotify",
    spotifyUrl: "#",
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80",
    audioSrc: "/audio.wav",
  },
  {
    id: 2,
    artist: "Echo District",
    title: "Midnight Drive",
    releaseDate: "18 Apr 2026",
    platform: "Spotify",
    spotifyUrl: "#",
    image:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=80",
    audioSrc: "/audio.wav",
  },
  {
    id: 3,
    artist: "Nova Bloom",
    title: "Velvet Sky",
    releaseDate: "24 Apr 2026",
    platform: "Spotify",
    spotifyUrl: "#",
    image:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=600&q=80",
    audioSrc: "/audio.wav",
  },
  {
    id: 4,
    artist: "Purple Static",
    title: "Signal Fire",
    releaseDate: "01 May 2026",
    platform: "Spotify",
    spotifyUrl: "#",
    image:
      "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?auto=format&fit=crop&w=600&q=80",
    audioSrc: "/audio.wav",
  },
  {
    id: 5,
    artist: "Astra K",
    title: "Golden Noise",
    releaseDate: "08 May 2026",
    platform: "Spotify",
    spotifyUrl: "#",
    image:
      "https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&w=600&q=80",
    audioSrc: "/audio.wav",
  },
];

function safeJsonParse<T>(value: unknown, fallback: T): T {
  try {
    if (!value) return fallback;
    if (typeof value === "string") return JSON.parse(value) as T;
    return value as T;
  } catch {
    return fallback;
  }
}

function formatDate(dateISO?: string) {
  const raw = String(dateISO || "").trim();
  if (!raw) return "TBA";

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;

  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeCmsItem(
  x: CmsReleaseItem,
  index: number
): ReleaseCylinderItem | null {
  const image = String(x?.imageSrc ?? "").trim();
  const artist = String(x?.artist ?? "").trim();
  const title = String(x?.title ?? "").trim();

  if (!image || !artist || !title) return null;

  return {
    id: String(x?.id || `cms_release_${index}`),
    artist,
    title,
    releaseDate: formatDate(x?.dateISO),
    platform: String(x?.platformLabel ?? "").trim() || "Spotify",
    spotifyUrl: String(x?.url ?? "").trim() || "#",
    image,
    audioSrc: String(x?.audioSrc ?? "").trim(),
  };
}

function buildCardsFromCms(
  cmsItems: CmsReleaseItem[] | undefined,
  fallbackItems: ReleaseCylinderItem[]
) {
  const normalized = (cmsItems || [])
    .map((x, i) => normalizeCmsItem(x, i))
    .filter(Boolean) as ReleaseCylinderItem[];

  if (normalized.length) return normalized.slice(0, 5);
  return fallbackItems.slice(0, 5);
}

export default function ReleasesCylinder({
  items,
  audioSrc = "/audio.wav",
  moreLink = "/releases-hub",
}: Props) {
  const location = useLocation();

  const [cmsItems, setCmsItems] = useState<ReleaseCylinderItem[] | null>(null);
  const [activeSoundId, setActiveSoundId] = useState<number | string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const cards = useMemo(() => {
    if (Array.isArray(items) && items.length > 0) {
      return items.slice(0, 5);
    }

    if (cmsItems && cmsItems.length > 0) {
      return cmsItems.slice(0, 5);
    }

    return demoItems.slice(0, 5);
  }, [items, cmsItems]);

  useEffect(() => {
    if (Array.isArray(items) && items.length > 0) return;

    let alive = true;

    (async () => {
      try {
        const url = buildApiUrl(
          `/api/cms?siteKey=${encodeURIComponent(
            CMS_SITE_KEY
          )}&key=${encodeURIComponent(CMS_KEY_RELEASES)}&ts=${Date.now()}`
        );

        const res = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json, text/plain;q=0.9, */*;q=0.8" },
          cache: "no-store",
        });

        if (!res.ok) {
          if (alive) setCmsItems(demoItems.slice(0, 5));
          return;
        }

        const text = await res.text().catch(() => "");
        const dto = safeJsonParse<{ json?: unknown }>(text, {});
        const payload = safeJsonParse<CmsReleasesHubPayload>(dto?.json, { items: [] });

        const next = buildCardsFromCms(payload.items, demoItems);

        if (alive) setCmsItems(next);
      } catch {
        if (alive) setCmsItems(demoItems.slice(0, 5));
      }
    })();

    return () => {
      alive = false;
    };
  }, [items]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.volume = 0.9;
    audioRef.current = audio;

    const onEnded = () => {
      setIsPlaying(false);
      setActiveSoundId(null);
    };

    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audio.removeEventListener("ended", onEnded);
      audioRef.current = null;
    };
  }, []);

  const handlePlayToggle = async (item: ReleaseCylinderItem) => {
    const audio = audioRef.current;
    if (!audio) return;

    const src = String(item.audioSrc || "").trim() || audioSrc;
    if (!src) return;

    const sameTrack = String(activeSoundId) === String(item.id);

    try {
      if (sameTrack && isPlaying) {
        audio.pause();
        setIsPlaying(false);
        return;
      }

      if (!sameTrack) {
        audio.pause();
        audio.currentTime = 0;
        audio.src = src;
      }

      await audio.play();
      setActiveSoundId(item.id);
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  if (!cards.length) return null;

  return (
    <section id="releases-trends" className="records-premium">
      <div className="records-premium__inner">
        <div className="records-premium__head">
          <h2 className="about-title about-title-centered records-premium__title">
            <span className="sync-page-title__white">OUR</span>{" "}
            <span className="sync-page-title__grad">RELEASES</span>
          </h2>

          <Link
            className="artists-link sync-link-btn records-premium__more"
            to={moreLink}
            state={{ from: `${location.pathname}#releases-trends` }}
          >
            EXPLORE THE RELEASE HUB
          </Link>
        </div>

        <div className="records-premium__panel">
          <div className="records-premium__tableHead">
            <span className="records-premium__headCell records-premium__headCell--play" />
            <span className="records-premium__headCell records-premium__headCell--track">
              Track
            </span>
            <span className="records-premium__headCell records-premium__headCell--artist">
              Artist(s)
            </span>
            <span className="records-premium__headCell records-premium__headCell--release">
              Release
            </span>
            <span className="records-premium__headCell records-premium__headCell--platform">
              Platform
            </span>
            <span className="records-premium__headCell records-premium__headCell--spotify" />
          </div>

          <div className="records-premium__list">
            {cards.map((item, index) => {
              const active = String(activeSoundId) === String(item.id) && isPlaying;

              return (
                <div
                  key={item.id}
                  className={`records-premium__row ${active ? "is-active" : ""}`}
                >
                  <button
                    type="button"
                    className={`records-premium__playBtn ${active ? "is-active" : ""}`}
                    onClick={() => handlePlayToggle(item)}
                    aria-label={active ? `Pause ${item.title}` : `Play ${item.title}`}
                    title={active ? "Pause preview" : "Play preview"}
                  >
                    <span className="records-premium__playIcon">
                      {active ? "❚❚" : "▶"}
                    </span>
                  </button>

                  <div className="records-premium__track">
                    <div className="records-premium__coverWrap">
                      <img
                        className="records-premium__cover"
                        src={item.image}
                        alt={`${item.artist} - ${item.title}`}
                      />
                    </div>

                    <div className="records-premium__trackText">
                      <span className="records-premium__trackTitle">
                        {index + 1}. {item.title}
                      </span>
                    </div>
                  </div>

                  <div className="records-premium__artist">{item.artist}</div>

                  <div className="records-premium__release">{item.releaseDate}</div>

                  <div className="records-premium__platform">{item.platform}</div>

                  <a
                    className="records-premium__spotifyBtn"
                    href={item.spotifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${item.title} on Spotify`}
                    title="Open on Spotify"
                  >
                    SPOTIFY
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}