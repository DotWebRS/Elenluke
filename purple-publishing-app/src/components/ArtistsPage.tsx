import { useEffect, useMemo, useState } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Modal from "react-bootstrap/Modal";

type CmsTrack = { title: string; url: string; length?: string };
type CmsArtist = {
  id?: string;
  name?: string;
  bio?: string;
  image?: string;
  spotifyUrl?: string;
  tracks?: CmsTrack[];
};
type CmsRosterPayload = { artists?: CmsArtist[] };

type Artist = {
  id: string;
  name: string;
  bio: string;
  image: string;
  spotifyUrl: string;
  tracks: CmsTrack[];
};

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:5284";
const SITE_KEY = "purple-crunch-publishing";
const DEFAULT_IMG = "/branding/artist.jpg";

function safeJsonParse<T>(raw: any, fallback: T): T {
  try {
    if (!raw) return fallback;
    if (typeof raw === "string") return JSON.parse(raw) as T;
    return raw as T;
  } catch {
    return fallback;
  }
}

async function fetchCms(siteKey: string, key: string) {
  const res = await fetch(
    `${API_BASE}/api/cms?siteKey=${encodeURIComponent(siteKey)}&key=${encodeURIComponent(key)}`
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function normalizeArtist(a: CmsArtist, idx: number): Artist {
  const id = String(a?.id || `artist_${idx}`);
  const tracks = Array.from({ length: 5 }).map((_, i) => {
    const t = a?.tracks?.[i];
    return {
      title: String(t?.title || `Track ${i + 1}`),
      url: String(t?.url || ""),
      length: typeof t?.length === "string" ? t.length : "—",
    };
  });

  return {
    id,
    name: String(a?.name || "Untitled artist"),
    bio: String(a?.bio || ""),
    image: String(a?.image || DEFAULT_IMG),
    spotifyUrl: String(a?.spotifyUrl || ""),
    tracks,
  };
}

function getTrackId(url: string) {
  if (!url) return "";
  const clean = url.trim().split("?")[0];
  const m = clean.match(/track\/([a-zA-Z0-9]+)/);
  if (m?.[1]) return m[1];
  const parts = clean.split("/").filter(Boolean);
  const idx = parts.findIndex((p) => p === "track");
  return idx >= 0 ? parts[idx + 1] : "";
}

function toEmbedTrack(url: string) {
  const id = getTrackId(url);
  return id ? `https://open.spotify.com/embed/track/${id}` : "https://open.spotify.com/";
}

const ArtistPage = () => {
  const [all, setAll] = useState<Artist[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(8);

  useEffect(() => {
    document.body.setAttribute("data-active-section", "artists");
    return () => document.body.removeAttribute("data-active-section");
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const wrap = await fetchCms(SITE_KEY, "artists.roster");
        const payload = safeJsonParse<CmsRosterPayload>(wrap?.json, { artists: [] });

        const list = (payload.artists || [])
          .map(normalizeArtist)
          .filter((x) => x.id && x.name);

        if (!cancelled) {
          setAll(list);
          setVisibleCount(8);
        }
      } catch {
        if (!cancelled) {
          setAll([]);
          setVisibleCount(8);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const shown = useMemo(() => all.slice(0, visibleCount), [all, visibleCount]);
  const canShowMore = all.length > visibleCount;

  const active = useMemo(() => all.find((a) => a.id === openId) ?? null, [openId, all]);
  const close = () => setOpenId(null);

  const shownTracks = useMemo(() => (active?.tracks || []).slice(0, 5), [active]);

  return (
    <section className="artists-section" id="roster">
      <Container fluid className="artists-roster-fluid">
        <div className="artists-head artists-head--center">
          <h2 className="about-title about-title-centered">
            FULL <span className="about-us-animated">ROSTER</span>
          </h2>
        </div>

        {shown.length === 0 ? (
          <div className="artists-empty">
            No artists yet. Add them in Admin CMS → Artists roster, then Save all.
          </div>
        ) : (
          <>
            <Row className="artists-grid g-0 align-items-stretch artists-grid--roster">
              {shown.map((a, idx) => (
                <Col
                  key={a.id}
                  xs={12}
                  sm={6}
                  md={4}
                  lg={3}
                  className="artist-col artist-col--roster"
                >
                  <button type="button" className="artist-card" onClick={() => setOpenId(a.id)}>
                    <div className="artist-top">
                      <div className="artist-number">({idx + 1})</div>
                      <div className="artist-title">{a.name}</div>
                    </div>

                    <div className="artist-media">
                      <img
                        className="artist-photo"
                        src={a.image || DEFAULT_IMG}
                        alt={a.name}
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = DEFAULT_IMG;
                        }}
                      />
                      <div className="artist-bio-overlay" aria-hidden="true">
                        <div className="artist-bio">{a.bio}</div>
                      </div>
                    </div>
                  </button>
                </Col>
              ))}
            </Row>

            {canShowMore && (
              <div className="roster-more-wrap">
                <button
                  type="button"
                  className="roster-more-btn"
                  onClick={() => setVisibleCount((n) => Math.min(n + 8, all.length))}
                >
                  + SHOW MORE
                </button>
              </div>
            )}
          </>
        )}
      </Container>

      <Modal
        show={!!active}
        onHide={close}
        centered
        size="lg"
        contentClassName="artist-modal"
        backdropClassName="artist-backdrop"
      >
        <div className="artist-modal-hero">
          <div
            className="artist-modal-hero-bg"
            style={{ backgroundImage: `url(${active?.image || DEFAULT_IMG})` }}
            aria-hidden="true"
          />
          <div className="artist-modal-hero-overlay" aria-hidden="true" />

          <button
            type="button"
            className="artist-modal-close"
            onClick={close}
            aria-label="Close"
            title="Close"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>

          <div className="artist-modal-hero-content">
            <div className="artist-verified-pill">
              <i className="fa-solid fa-circle-check" aria-hidden="true" />
              <span>Verified Artist</span>
            </div>

            <div className="artist-modal-name">{active?.name}</div>

            <div className="artist-modal-actions">
              <a
                className="artist-btn artist-btn--ghost"
                href={active?.spotifyUrl || "#"}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  if (!active?.spotifyUrl) e.preventDefault();
                }}
              >
                <i className="fa-solid fa-user-plus" aria-hidden="true" />
                <span>FOLLOW</span>
              </a>

              <a
                className="artist-btn artist-btn--spotify"
                href={active?.spotifyUrl || "#"}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  if (!active?.spotifyUrl) e.preventDefault();
                }}
              >
                <i className="fa-brands fa-spotify" aria-hidden="true" />
                <span>SPOTIFY</span>
              </a>
            </div>
          </div>
        </div>

        <Modal.Body>
          <div className="artist-playlist-head">
            <div className="artist-playlist-title">Top Tracks</div>
            <div className="artist-playlist-sub">Curated selection</div>
          </div>

          <div className="artist-tracks artist-tracks--embeds">
            {shownTracks.map((t, i) => (
              <div className="artist-track artist-track--embedrow" key={`embed-${i}`}>
                <div className="artist-track-left artist-track-left--embedrow">
                  <span className="artist-track-index">{String(i + 1).padStart(2, "0")}</span>
                  <div className="artist-track-embed-inline">
                    <iframe
                      title={`Spotify Track ${i + 1}`}
                      src={toEmbedTrack(t.url)}
                      width="100%"
                      height="80"
                      scrolling="no"
                      style={{ display: "block", border: 0 }}
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Modal.Body>
      </Modal>
    </section>
  );
};

export default ArtistPage;
