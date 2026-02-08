// src/components/PcrContactForm.tsx
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import ReleasesFooterBar from "../components/ReleasesFooterBar";
import { API_BASE } from "../config/apiBase";
import "../style/PcrContactForm.css";

type SubmissionType = "GeneralContactInquiry" | "DemoUpload" | "PlaylistPitch";
type ExtraFields = Record<string, string>;

function buildUrl(path: string) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return base ? `${base}/${p}` : `/${p}`;
}

function looksLikeFullName(v: string) {
  const parts = (v || "")
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean);
  return parts.length >= 2;
}

function isAllowedDemoUpload(file: File) {
  const n = (file.name || "").toLowerCase();
  const extOk =
    n.endsWith(".png") || n.endsWith(".jpg") || n.endsWith(".jpeg") || n.endsWith(".mp3") || n.endsWith(".mp4");

  const t = (file.type || "").toLowerCase();
  const typeOk =
    t === "image/png" || t === "image/jpeg" || t === "audio/mpeg" || t === "audio/mp3" || t === "video/mp4";

  if (n.endsWith(".wav") || t.includes("wav") || t === "audio/wav" || t === "audio/x-wav") return false;

  return extOk || typeOk;
}

const DRAFT_KEY = "pcr_contact_form_draft_v2";

type DraftPayload = {
  type: SubmissionType | "";
  name: string;
  email: string;
  message: string;
  privacyAccepted: boolean;
  fields: ExtraFields;
};

function safeParseDraft(raw: string | null): DraftPayload | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    if (!d || typeof d !== "object") return null;
    return {
      type: (typeof d.type === "string" ? d.type : "") as SubmissionType | "",
      name: typeof d.name === "string" ? d.name : "",
      email: typeof d.email === "string" ? d.email : "",
      message: typeof d.message === "string" ? d.message : "",
      privacyAccepted: typeof d.privacyAccepted === "boolean" ? d.privacyAccepted : false,
      fields: (d.fields && typeof d.fields === "object" ? d.fields : {}) as ExtraFields,
    };
  } catch {
    return null;
  }
}

const DEFAULT_FIELDS: ExtraFields = {
  ig: "",
  spotifyLinks: "",
  playlists: "",
  trackTitle: "",
  spotifyTrackUrl: "",
};

const DISCLAIMER =
  "We carefully review all submissions and evaluate if they fit our network or not. Due to the high amount of submissions we can’t guarantee that all submissions will be answered. If accepted we will get back to you shortly.";

// -------------------- CMS PLAYLISTS (FROM DB) --------------------
type PlaylistItem = {
  id: string;
  title: string;
  url: string;
  coverSrc: string;
};

type PlaylistsCms = {
  items: PlaylistItem[];
};

type CmsApiEntry = {
  siteKey: string;
  key: string;
  json: string;
  updatedAtUtc?: string;
};

const PCR_SITE_KEY = "purple-crunch-records";
const CMS_KEY_PLAYLISTS = "pcr.playlists.items";

function safeJsonParse<T>(raw: any, fallback: T): T {
  try {
    if (!raw) return fallback;
    if (typeof raw === "string") return JSON.parse(raw) as T;
    return raw as T;
  } catch {
    return fallback;
  }
}

function normalizePublicUrl(u: string) {
  const s = String(u || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  const withSlash = s.startsWith("/") ? s : `/${s}`;
  return buildUrl(withSlash);
}

function sanitizePlaylists(payload: PlaylistsCms | null | undefined): PlaylistItem[] {
  const items = Array.isArray(payload?.items) ? payload!.items : [];
  return items
    .map((x: any) => ({
      id: String(x?.id || "").trim(),
      title: String(x?.title ?? "").trim(),
      url: String(x?.url ?? "").trim(),
      coverSrc: normalizePublicUrl(String(x?.coverSrc ?? "")),
    }))
    .filter((x) => x.id && x.title); // show all with id+title (don’t hide “missing url” ones)
}

function labelFor(k: string) {
  const m: Record<string, string> = {
    ig: "Instagram",
    spotifyLinks: "Song(s) Spotify links",
    playlists: "Which playlist(s)",
    trackTitle: "Track title",
    spotifyTrackUrl: "Spotify track link",
  };
  return m[k] || k;
}

function readTypeFromQuery(search: string): SubmissionType | "" {
  const p = new URLSearchParams(search || "");
  const t = (p.get("type") || "").trim();
  if (t === "GeneralContactInquiry" || t === "DemoUpload" || t === "PlaylistPitch") return t;
  return "";
}

export default function PcrContactForm() {
  const location = useLocation();

  const railRef = useRef<HTMLDivElement | null>(null);

  const initialDraft = useMemo(() => safeParseDraft(sessionStorage.getItem(DRAFT_KEY)), []);
  const initialTypeFromUrl = useMemo(() => readTypeFromQuery(location.search), [location.search]);

  const [type, setType] = useState<SubmissionType | "">(initialTypeFromUrl || initialDraft?.type || "");
  const [name, setName] = useState(initialDraft?.name ?? "");
  const [email, setEmail] = useState(initialDraft?.email ?? "");
  const [message, setMessage] = useState(initialDraft?.message ?? "");
  const [privacyAccepted, setPrivacyAccepted] = useState(initialDraft?.privacyAccepted ?? false);
  const [fields, setFields] = useState<ExtraFields>({ ...DEFAULT_FIELDS, ...(initialDraft?.fields ?? {}) });

  const [playlistSelected, setPlaylistSelected] = useState<string[]>(() => {
    const raw = (initialDraft?.fields?.playlists ?? "").trim();
    if (!raw) return [];
    return raw
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  });

  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [okId, setOkId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [cmsPlaylists, setCmsPlaylists] = useState<PlaylistItem[]>([]);
  const [cmsPlaylistsLoading, setCmsPlaylistsLoading] = useState(true);

  const isGeneral = type === "GeneralContactInquiry";
  const isDemo = type === "DemoUpload";
  const isPlaylist = type === "PlaylistPitch";

  const totalBytes = useMemo(() => files.reduce((s, f) => s + (f?.size || 0), 0), [files]);

  const setField = (key: string, value: string) => setFields((p) => ({ ...p, [key]: value }));

  const onFilesChange = (list: FileList | null) => {
    if (!list) return setFiles([]);
    setFiles(Array.from(list));
  };

  useEffect(() => {
    let alive = true;
    setCmsPlaylistsLoading(true);

    (async () => {
      try {
        const url = buildUrl(
          `/api/cms?siteKey=${encodeURIComponent(PCR_SITE_KEY)}&key=${encodeURIComponent(CMS_KEY_PLAYLISTS)}&ts=${Date.now()}`
        );

        const res = await fetch(url);

        if (res.status === 404) {
          if (!alive) return;
          setCmsPlaylists([]);
          return;
        }

        const text = await res.text().catch(() => "");
        if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

        const parsedEntry = JSON.parse(text) as CmsApiEntry;
        const payload = safeJsonParse<PlaylistsCms>(parsedEntry?.json, { items: [] });
        const cleaned = sanitizePlaylists(payload);

        if (!alive) return;
        setCmsPlaylists(cleaned);

        // quick debug so you see count
        // eslint-disable-next-line no-console
        console.log("[PCR Contact] playlists from CMS:", cleaned.length, cleaned);
      } catch (e: any) {
        if (!alive) return;
        setCmsPlaylists([]);
        // eslint-disable-next-line no-console
        console.log("[PCR Contact] playlists load failed:", e?.message || e);
      } finally {
        if (!alive) return;
        setCmsPlaylistsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const t = readTypeFromQuery(location.search);
    if (!t) return;
    setType(t);
    setFiles([]);
    setErr(null);
    setOkId(null);
  }, [location.search]);

  useEffect(() => {
    setField("playlists", playlistSelected.join(", "));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistSelected.join("|")]);

  useEffect(() => {
    if (isSubmitting) return;
    try {
      const payload: DraftPayload = { type, name, email, message, privacyAccepted, fields };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    } catch {
      //
    }
  }, [type, name, email, message, privacyAccepted, fields, isSubmitting]);

  const clearDraft = () => {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      //
    }
  };

  const resetAll = () => {
    setType("");
    setName("");
    setEmail("");
    setMessage("");
    setPrivacyAccepted(false);
    setFields({ ...DEFAULT_FIELDS });
    setPlaylistSelected([]);
    setFiles([]);
  };

  const validate = () => {
    if (!type) return "Submission Type is required.";
    if (!privacyAccepted) return "Privacy policy must be accepted.";

    if (!name.trim() || !email.trim()) return "Name and Email are required.";
    if (!looksLikeFullName(name.trim())) return "In Name box enter First name Last name.";

    if (isGeneral) {
      if (!message.trim()) return "Message is required.";
      return null;
    }

    if (isPlaylist) {
      if (!fields.ig.trim()) return `${labelFor("ig")} is required.`;
      if (!fields.spotifyLinks.trim()) return `${labelFor("spotifyLinks")} is required.`;
      if (!playlistSelected.length) return "Please choose at least one playlist.";
      return null;
    }

    if (isDemo) {
      if (totalBytes > 20 * 1024 * 1024) return "Total upload size must be 20MB or less.";
      if (!files || files.length === 0) return "Please upload at least one file (mp3/mp4 or images).";
      if (files.length > 5) return "Please upload at most 5 files.";
      if (files.some((f) => !isAllowedDemoUpload(f))) return "Allowed: mp3, mp4, png, jpg, jpeg. WAV is not allowed.";
      return null;
    }

    return null;
  };

  const buildFieldsJson = () => {
    const obj: Record<string, string> = {};
    const put = (k: string, v: string) => {
      const val = (v ?? "").trim();
      if (val) obj[k] = val;
    };

    if (isPlaylist) {
      put("ig", fields.ig);
      put("spotifyLinks", fields.spotifyLinks);
      put("playlists", playlistSelected.join(", "));
    }

    if (isDemo) {
      put("trackTitle", fields.trackTitle);
      put("spotifyTrackUrl", fields.spotifyTrackUrl);
    }

    return JSON.stringify(obj);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOkId(null);

    const v = validate();
    if (v) return setErr(v);

    setIsSubmitting(true);
    try {
      const fd = new FormData();

      fd.append("Type", String(type));
      fd.append("Domain", window.location.hostname || "");
      fd.append("PrivacyAccepted", privacyAccepted ? "true" : "false");

      fd.append("Name", name.trim());
      fd.append("Email", email.trim());

      if (message.trim()) fd.append("Message", message.trim());

      const fieldsJson = buildFieldsJson();
      if (fieldsJson && fieldsJson !== "{}") fd.append("FieldsJson", fieldsJson);

      if (isDemo) {
        for (const f of files) fd.append("Files", f);
      }

      const res = await fetch(buildUrl("/api/submissions/form"), {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Submit failed.");
      }

      const data = await res.json().catch(() => null);
      setOkId(data?.id ?? data?.Id ?? "submitted");

      clearDraft();
      resetAll();
    } catch (ex: any) {
      setErr(ex?.message || "Submit failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePlaylist = (id: string) => {
    setPlaylistSelected((prev) => {
      const has = prev.includes(id);
      if (has) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  };

  const scrollRail = (dir: "left" | "right") => {
    const el = railRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".pcr-playlistCard");
    const step = (card?.offsetWidth ?? 320) + 14;
    el.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  };

  return (
    <main className="submitform-page">
      <BottomNav />

      <section className="submitform-wrap">
        <header className="submitform-head">
          <h1 className="submitform-title">
            CONTACT <span className="submitform-titleGrad">US</span>
          </h1>
        </header>

        <form className="submitform-card" onSubmit={onSubmit}>
          <div className="submitform-grid">
            <label className="submitform-field">
              <span className="submitform-label">SUBMISSION TYPE*</span>

              <div className="submitform-select">
                <select
                  className="submitform-control"
                  value={type}
                  onChange={(ev) => {
                    const next = ev.target.value as SubmissionType | "";
                    setType(next);
                    setFiles([]);
                    setErr(null);
                    setOkId(null);
                  }}
                >
                  <option value="">Select…</option>
                  <option value="GeneralContactInquiry">General contact</option>
                  <option value="DemoUpload">Demo submission</option>
                  <option value="PlaylistPitch">Playlisting</option>
                </select>
              </div>
            </label>

            <div className="submitform-divider" />

            <label className="submitform-field">
              <span className="submitform-label">NAME*</span>
              <input
                className="submitform-control"
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                placeholder="First name Last name"
                autoComplete="name"
              />
            </label>

            <label className="submitform-field">
              <span className="submitform-label">EMAIL*</span>
              <input
                className="submitform-control"
                type="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                placeholder="name@email.com"
                autoComplete="email"
              />
            </label>

            {isPlaylist && (
              <>
                <label className="submitform-field">
                  <span className="submitform-label">INSTAGRAM*</span>
                  <input
                    className="submitform-control"
                    value={fields.ig}
                    onChange={(ev) => setField("ig", ev.target.value)}
                    placeholder="@yourhandle"
                  />
                </label>

                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">SONG(S) FROM SPOTIFY LINKS*</span>
                  <textarea
                    className="submitform-control submitform-textarea"
                    rows={4}
                    value={fields.spotifyLinks}
                    onChange={(ev) => setField("spotifyLinks", ev.target.value)}
                    placeholder="Paste Spotify track links (one per line)"
                  />
                </label>

                <div className="submitform-field submitform-span2">
                  <div className="submitform-label">CHOOSE PLAYLIST(S)*</div>

                  <div className="pcr-railWrap">
                    <button
                      type="button"
                      className="pcr-railBtn pcr-railBtn--left"
                      onClick={() => scrollRail("left")}
                      aria-label="Scroll playlists left"
                      disabled={cmsPlaylistsLoading || cmsPlaylists.length === 0}
                    >
                      ‹
                    </button>

                    <div ref={railRef} className="pcr-playlistsRail" role="list" aria-label="Playlists">
                      {!cmsPlaylistsLoading && cmsPlaylists.length === 0 ? (
                        <div className="submitform-help" style={{ padding: 10 }}>
                          No playlists available right now.
                        </div>
                      ) : null}

                      {cmsPlaylists.map((pl) => {
                        const selected = playlistSelected.includes(pl.id);
                        const href = (pl.url || "").trim();
                        const canOpen = /^https?:\/\//i.test(href);

                        return (
                          <button
                            key={pl.id}
                            type="button"
                            className={"pcr-playlistCard " + (selected ? "is-selected" : "")}
                            onClick={() => togglePlaylist(pl.id)}
                            aria-pressed={selected}
                            title={pl.title}
                          >
                            <div className="pcr-playlistCover">
                              {pl.coverSrc ? <img src={pl.coverSrc} alt={pl.title} draggable={false} /> : null}
                              <div className="pcr-playlistOverlay" />
                              <div className={"pcr-playlistTick " + (selected ? "on" : "")}>✓</div>
                            </div>

                            <div className="pcr-playlistMeta">
                              <div className="pcr-playlistTitle">{pl.title}</div>
                              <div className="pcr-playlistSub">{selected ? "Selected" : "Click to select"}</div>

                              {canOpen ? (
                                <a
                                  className="pcr-playlistLink"
                                  href={href}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Open on Spotify
                                </a>
                              ) : (
                                <span className="pcr-playlistLink" onClick={(e) => e.stopPropagation()}>
                                  No link
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      className="pcr-railBtn pcr-railBtn--right"
                      onClick={() => scrollRail("right")}
                      aria-label="Scroll playlists right"
                      disabled={cmsPlaylistsLoading || cmsPlaylists.length === 0}
                    >
                      ›
                    </button>
                  </div>

                  <div className="submitform-help">You can select multiple playlists. Use arrows or horizontal scroll.</div>
                </div>
              </>
            )}

            {isDemo && (
              <>
                <label className="submitform-field">
                  <span className="submitform-label">TRACK TITLE</span>
                  <input
                    className="submitform-control"
                    value={fields.trackTitle}
                    onChange={(ev) => setField("trackTitle", ev.target.value)}
                    placeholder="Track title"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">SPOTIFY TRACK LINK</span>
                  <input
                    className="submitform-control"
                    value={fields.spotifyTrackUrl}
                    onChange={(ev) => setField("spotifyTrackUrl", ev.target.value)}
                    placeholder="https://open.spotify.com/track/..."
                  />
                </label>

                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">UPLOAD (MP3/MP4/IMAGES)*</span>
                  <input
                    className="submitform-control"
                    type="file"
                    multiple
                    accept="audio/mpeg,video/mp4,image/png,image/jpeg,.mp3,.mp4,.png,.jpg,.jpeg"
                    onChange={(ev) => onFilesChange(ev.target.files)}
                  />
                  <div className="submitform-help">Allowed: mp3, mp4, png, jpg, jpeg. Total max 20MB. WAV is blocked.</div>

                  {files.length > 0 && (
                    <div className="submitform-filesList">
                      {files.map((f) => (
                        <div key={f.name + f.size} className="submitform-fileRow">
                          <span className="submitform-fileName">{f.name}</span>
                          <span className="submitform-fileMeta">{Math.round(f.size / 1024)} KB</span>
                        </div>
                      ))}
                      <div className="submitform-fileTotal">Total: {Math.round(totalBytes / 1024)} KB</div>
                    </div>
                  )}
                </label>
              </>
            )}

            <label className="submitform-field submitform-span2">
              <span className="submitform-label">MESSAGE{isGeneral ? "*" : ""}</span>
              <textarea
                className="submitform-control submitform-textarea"
                rows={7}
                value={message}
                onChange={(ev) => setMessage(ev.target.value)}
                placeholder="Details, references, deadlines..."
              />
            </label>

            <label className="submitform-field submitform-span2 submitform-privacy">
              <span>
                <input type="checkbox" checked={privacyAccepted} onChange={(ev) => setPrivacyAccepted(ev.target.checked)} />
                &nbsp;&nbsp;I agree to the{" "}
                <Link className="submitform-link" to="/privacy">
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link className="submitform-link" to="/cookies">
                  Cookie Policy
                </Link>
                .
              </span>
            </label>

            <div className="submitform-field submitform-span2">
              <div className="submitform-note--disclaimer">{DISCLAIMER}</div>
            </div>
          </div>

          {err && <div className="submitform-alert submitform-alert--err">{err}</div>}
          {okId && (
            <div className="submitform-alert submitform-alert--ok">
              Submitted successfully. Reference ID: <span className="submitform-mono">{okId}</span>
            </div>
          )}

          <div className="submitform-foot">
            <button className="submitform-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "SENDING..." : "SEND"}
            </button>
          </div>
        </form>
      </section>

      <ReleasesFooterBar />
    </main>
  );
}
