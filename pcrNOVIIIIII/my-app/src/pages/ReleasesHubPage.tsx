import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { buildApiUrl } from "../config/apiBase";
import FadeSection from "../components/FadeSection";

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

type ReleaseCard = {
  id: string;
  artist: string;
  title: string;
  dateISO: string;
  releaseDateLabel: string;
  platform: string;
  url: string;
  image: string;
  audioSrc?: string;
};

const CMS_SITE_KEY = "purple-crunch-records";
const CMS_KEY_RELEASES = "pcr.releasesHub.items";
const FALLBACK_AUDIO = "/audio.wav";

function safeJsonParse<T>(value: unknown, fallback: T): T {
  try {
    if (!value) return fallback;
    if (typeof value === "string") return JSON.parse(value) as T;
    return value as T;
  } catch {
    return fallback;
  }
}

function formatDateLabel(dateISO?: string) {
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

function normalizeRelease(x: CmsReleaseItem, index: number): ReleaseCard | null {
  const image = String(x?.imageSrc ?? "").trim();
  const artist = String(x?.artist ?? "").trim();
  const title = String(x?.title ?? "").trim();

  if (!image || !artist || !title) return null;

  return {
    id: String(x?.id || `release_${index}`),
    artist,
    title,
    dateISO: String(x?.dateISO ?? "").trim(),
    releaseDateLabel: formatDateLabel(x?.dateISO),
    platform: String(x?.platformLabel ?? "").trim() || "Spotify",
    url: String(x?.url ?? "").trim() || "#",
    image,
    audioSrc: String(x?.audioSrc ?? "").trim() || "",
  };
}

function isPastRelease(dateISO: string) {
  if (!dateISO) return false;
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return false;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return d < today;
}

function isUpcomingRelease(dateISO: string) {
  if (!dateISO) return true;
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return true;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return d >= today;
}

export default function ReleasesHubPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [items, setItems] = useState<ReleaseCard[]>([]);
  const [loading, setLoading] = useState(true);

  const [timeFilter, setTimeFilter] = useState<"all" | "upcoming" | "past">("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [artistFilter, setArtistFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"dateDesc" | "dateAsc" | "artistAsc" | "titleAsc">("dateDesc");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [activeSoundId, setActiveSoundId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleBack = () => {
    const state = location.state as { from?: string } | null;
    const from = state?.from;

    if (from) {
      navigate(from);
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/#releases-trends");
  };

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audio.volume = 0.34;

    const handleEnded = () => {
      setActiveSoundId(null);
    };

    audio.addEventListener("ended", handleEnded);
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audio.removeEventListener("ended", handleEnded);
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const url = buildApiUrl(
          `/api/cms?siteKey=${encodeURIComponent(CMS_SITE_KEY)}&key=${encodeURIComponent(
            CMS_KEY_RELEASES
          )}&ts=${Date.now()}`
        );

        const res = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json, text/plain;q=0.9, */*;q=0.8" },
          cache: "no-store",
        });

        if (!res.ok) {
          if (alive) {
            setItems([]);
            setLoading(false);
          }
          return;
        }

        const text = await res.text().catch(() => "");
        const dto = safeJsonParse<{ json?: unknown }>(text, {});
        const payload = safeJsonParse<CmsReleasesHubPayload>(dto?.json, { items: [] });

        const normalized = (payload.items || [])
          .map((x, i) => normalizeRelease(x, i))
          .filter(Boolean) as ReleaseCard[];

        if (alive) {
          setItems(normalized);
          setLoading(false);
        }
      } catch {
        if (alive) {
          setItems([]);
          setLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const platforms = useMemo(() => {
    return Array.from(new Set(items.map((x) => x.platform).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [items]);

  const artists = useMemo(() => {
    return Array.from(new Set(items.map((x) => x.artist).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [items]);

  const filtered = useMemo(() => {
    let next = [...items];

    if (timeFilter === "upcoming") {
      next = next.filter((x) => isUpcomingRelease(x.dateISO));
    } else if (timeFilter === "past") {
      next = next.filter((x) => isPastRelease(x.dateISO));
    }

    if (platformFilter !== "all") {
      next = next.filter((x) => x.platform === platformFilter);
    }

    if (artistFilter !== "all") {
      next = next.filter((x) => x.artist === artistFilter);
    }

    if (dateFrom) {
      const fromTs = new Date(dateFrom).getTime();
      next = next.filter((x) => {
        if (!x.dateISO) return false;
        const ts = new Date(x.dateISO).getTime();
        return !Number.isNaN(ts) && ts >= fromTs;
      });
    }

    if (dateTo) {
      const toTs = new Date(dateTo).getTime();
      next = next.filter((x) => {
        if (!x.dateISO) return false;
        const ts = new Date(x.dateISO).getTime();
        return !Number.isNaN(ts) && ts <= toTs;
      });
    }

    const q = search.trim().toLowerCase();
    if (q) {
      next = next.filter(
        (x) =>
          x.artist.toLowerCase().includes(q) ||
          x.title.toLowerCase().includes(q) ||
          x.platform.toLowerCase().includes(q) ||
          x.releaseDateLabel.toLowerCase().includes(q)
      );
    }

    next.sort((a, b) => {
      if (sortBy === "artistAsc") return a.artist.localeCompare(b.artist);
      if (sortBy === "titleAsc") return a.title.localeCompare(b.title);

      const da = a.dateISO ? new Date(a.dateISO).getTime() : 0;
      const db = b.dateISO ? new Date(b.dateISO).getTime() : 0;

      if (sortBy === "dateAsc") return da - db;
      return db - da;
    });

    return next;
  }, [items, timeFilter, platformFilter, artistFilter, dateFrom, dateTo, search, sortBy]);

  const stopAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    setActiveSoundId(null);
  };

  const toggleAudio = async (item: ReleaseCard) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (activeSoundId === item.id) {
      stopAudio();
      return;
    }

    const src = String(item.audioSrc || "").trim() || FALLBACK_AUDIO;
    if (!src) return;

    try {
      audio.pause();
      audio.currentTime = 0;
      audio.src = src;
      audio.volume = 0.34;
      await audio.play();
      setActiveSoundId(item.id);
    } catch {
      setActiveSoundId(null);
    }
  };

  return (
    <FadeSection id="releases-hub-page" className="rhp-section">
      <div className="rhp-bg-orb" aria-hidden="true" />

      <div className="rhp-wrap">
        <div className="rhp-head">
          <div className="rhp-headTop">
            <h1 className="rhp-title">
              <span className="rhp-title-light">RELEASES</span>
              <span className="rhp-title-grad"> HUB</span>
            </h1>

            <button
              type="button"
              className="artists-link artists-link--back sync-link-btn rhp-backBtn"
              onClick={handleBack}
            >
              BACK
            </button>
          </div>

          <div className="rhp-title-line" aria-hidden="true" />

          <div className="rhp-mainTabs">
            <button
              type="button"
              className={`rhp-mainTab ${timeFilter === "all" ? "is-active" : ""}`}
              onClick={() => setTimeFilter("all")}
            >
              All Releases
            </button>

            <button
              type="button"
              className={`rhp-mainTab ${timeFilter === "upcoming" ? "is-active" : ""}`}
              onClick={() => setTimeFilter("upcoming")}
            >
              Upcoming
            </button>

            <button
              type="button"
              className={`rhp-mainTab ${timeFilter === "past" ? "is-active" : ""}`}
              onClick={() => setTimeFilter("past")}
            >
              Past
            </button>
          </div>
        </div>

        <div className="rhp-toolbar">
          <div className="rhp-toolbarRow">
            <input
              className="rhp-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search artist, track, platform."
            />

            <select
              className="rhp-select"
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
            >
              <option value="all">All platforms</option>
              {platforms.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <select
              className="rhp-select"
              value={artistFilter}
              onChange={(e) => setArtistFilter(e.target.value)}
            >
              <option value="all">All artists</option>
              {artists.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            <select
              className="rhp-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "dateDesc" | "dateAsc" | "artistAsc" | "titleAsc")}
            >
              <option value="dateDesc">Newest first</option>
              <option value="dateAsc">Oldest first</option>
              <option value="artistAsc">Artist A–Z</option>
              <option value="titleAsc">Title A–Z</option>
            </select>

            <div className="rhp-dateRange">
              <input
                className="rhp-dateInput"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label="Date from"
              />

              <input
                className="rhp-dateInput"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                aria-label="Date to"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rhp-empty">Loading releases…</div>
        ) : filtered.length === 0 ? (
          <div className="rhp-empty">No releases found.</div>
        ) : (
          <div className="rhp-grid">
            {filtered.map((item) => {
              const isPlaying = activeSoundId === item.id;

              return (
                <a
                  key={item.id}
                  className={`rhp-card ${isPlaying ? "is-playing" : ""}`}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="rhp-card-inner">
                    <div className="rhp-imageWrap">
                      <img src={item.image} alt={`${item.artist} - ${item.title}`} />
                      <div className="rhp-imageOverlay" />

                      <div className={`rhp-badge ${isPlaying ? "is-on" : ""}`}>
                        <span className="rhp-badgeDot" />
                        <span className="rhp-badgeText">
                          {isPlaying ? "Playing" : item.platform}
                        </span>
                      </div>

                      <button
                        type="button"
                        className={`rhp-playBtn ${isPlaying ? "is-active" : ""}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          void toggleAudio(item);
                        }}
                        aria-label={isPlaying ? `Pause preview for ${item.title}` : `Play preview for ${item.title}`}
                      >
                        <span className={`rhp-playBtnIcon ${isPlaying ? "is-pause" : "is-play"}`} />
                      </button>
                    </div>

                    <div className="rhp-content">
                      <div className="rhp-topline">
                        <span className="rhp-date">{item.releaseDateLabel}</span>
                        <span className="rhp-platformMini">{item.platform}</span>
                      </div>

                      <h3 className="rhp-artist">{item.artist}</h3>
                      <p className="rhp-track">{item.title}</p>

                      <div className="rhp-meta">
                        <div className="rhp-metaRow">
                          <span className="rhp-metaLabel">Artist</span>
                          <span className="rhp-metaValue">{item.artist}</span>
                        </div>

                        <div className="rhp-metaRow">
                          <span className="rhp-metaLabel">Release</span>
                          <span className="rhp-metaValue">{item.releaseDateLabel}</span>
                        </div>
                      </div>

                      <div className={`rhp-musicLine ${isPlaying ? "is-active" : ""}`} />
                      <div className="rhp-open">{isPlaying ? "PREVIEW PLAYING" : "OPEN RELEASE"}</div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </FadeSection>
  );
}