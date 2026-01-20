import { useEffect, useMemo, useRef, useState } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Modal from "react-bootstrap/Modal";
import { Link } from "react-router-dom";

type CmsTrack = { title: string; url: string };

type CmsArtist = {
  id: string;
  name: string;
  bio: string;
  image: string;
  spotifyUrl: string;
  tracks: CmsTrack[];
};

type CmsRosterPayload = { artists: CmsArtist[] };
type CmsHomeArtistsPayload = { top3: string[] };

type Artist = {
  id: string;
  name: string;
  bio: string;
  image: string;
  spotifyUrl: string;
  tracks: CmsTrack[];
};

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:5284";

const DEFAULT_IMG = "/branding/artist.jpg";
const DEFAULT_TRACK_URL = "https://open.spotify.com/";

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
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
  return res.json(); // { siteKey, key, json, updatedAtUtc }
}

function mapArtist(a: any): Artist {
  return {
    id: String(a?.id || ""),
    name: String(a?.name || ""),
    bio: String(a?.bio || ""),
    image: String(a?.image || ""),
    spotifyUrl: String(a?.spotifyUrl || ""),
    tracks: Array.isArray(a?.tracks) ? a.tracks.slice(0, 5) : [],
  };
}

function getTrackId(url: string) {
  if (!url) return "";
  const u = url.trim();
  const m = u.match(/track\/([a-zA-Z0-9]+)/);
  if (m?.[1]) return m[1];
  const parts = u.split("?");
  const p = parts[0].split("/");
  const idx = p.findIndex((x) => x === "track");
  return idx >= 0 ? p[idx + 1] : "";
}

function toEmbedTrack(url: string) {
  const id = getTrackId(url);
  return id ? `https://open.spotify.com/embed/track/${id}` : "https://open.spotify.com/";
}

function useInViewOnce<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [inView, threshold]);

  return { ref, inView };
}

const ArtistsPreview = ({ siteKey = "purple-crunch-publishing" }: { siteKey?: string }) => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [rosterWrap, homeWrap] = await Promise.all([
          fetchCms(siteKey, "artists.roster"),
          fetchCms(siteKey, "home.artists"),
        ]);

        const rosterParsed = safeJsonParse<CmsRosterPayload>(rosterWrap?.json, { artists: [] });
        const homeParsed = safeJsonParse<CmsHomeArtistsPayload>(homeWrap?.json, { top3: [] });

        const all = (rosterParsed.artists || []).map(mapArtist).filter((a) => a.id);
        const top3ids = (homeParsed.top3 || []).filter(Boolean);

        let preview: Artist[] = [];

        if (top3ids.length) {
          const byId = new Map(all.map((a) => [a.id, a] as const));
          const top = top3ids.map((id) => byId.get(id)).filter(Boolean) as Artist[];
          for (const a of all) {
            if (top.length >= 3) break;
            if (!top.find((x) => x.id === a.id)) top.push(a);
          }
          preview = top.slice(0, 3);
        } else {
          preview = all.slice(0, 3);
        }

        if (!cancelled) setArtists(preview);
      } catch {
        if (!cancelled) setArtists([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [siteKey]);

  const active = useMemo(() => artists.find((a) => a.id === openId) ?? null, [openId, artists]);
  const close = () => setOpenId(null);
  const { ref: animRef, inView } = useInViewOnce<HTMLDivElement>(0.2);

  const shownTracks = useMemo(() => {
    const base =
      active?.tracks?.length
        ? active.tracks
        : Array.from({ length: 5 }).map((_, i) => ({ title: `Track ${i + 1}`, url: DEFAULT_TRACK_URL }));
    return base.slice(0, 5);
  }, [active]);

  const delayIndex = (idx: number) => (artists.length - 1 - idx);

  return (
    <section className="artists-section" id="top-tracks">
      <Container >
        <div ref={animRef} className={`artists-animwrap ${inView ? "is-inview" : ""}`}>
          <div className="artists-head">
            <h2 className="about-title about-title-centered">
              OUR <span className="about-us-animated">TALENTS</span>
            </h2>

            <Link className="artists-link" to="/artists">
              EXPLORE FULL ROSTER <span className="artists-arrow">→</span>
            </Link>
          </div>

          {artists.length === 0 ? (
            <div className="artists-empty">
              No artists yet. Add artists in CMS → Artists roster, then pick Top 3.
            </div>
          ) : (
            <Row className="artists-grid g-0 align-items-stretch">
              {artists.map((a, idx) => (
                <Col key={a.id} xs={12} md={4} className="artist-col">
                  <button
                    type="button"
                    className="artist-card"
                    onClick={() => setOpenId(a.id)}
                    style={
                      {
                        ["--stagger" as any]: `${delayIndex(idx) * 120}ms`,
                      } as React.CSSProperties
                    }
                  >
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
          )}
        </div>
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

export default ArtistsPreview;
