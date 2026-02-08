// src/components/admin/AdminPCR.tsx
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ADMIN_SITES, type AdminSiteKey } from "./adminSites";
import { useAdminSite } from "./useAdminSite";
import "../../AdminCms.css";
import { buildApiUrl } from "../../config/apiBase";

type HeroCms = {
  titleLight: string;
  rotateWords: string[];
  subLines: string[];
  buttons: {
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryScrollTo: string;
  };
};

type TikTokItem = {
  id: string;
  url: string;
};

type TikTokCms = {
  items: TikTokItem[];
};

type ReleaseItem = {
  id: string;
  imageSrc: string;
  artist: string;
  title: string;
  dateISO: string; // YYYY-MM-DD
  platformLabel?: string;
  url?: string;
};

type ReleasesHubCms = {
  items: ReleaseItem[];
};

type PlaylistItem = {
  id: string;
  title: string;
  url: string;
  coverSrc: string;
};

type PlaylistsCms = {
  items: PlaylistItem[];
};

const CMS_KEYS = {
  hero: "pcr.home.hero",
  about: "pcr.about.text",
  releasesHub: "pcr.releasesHub.items",
  tiktok: "pcr.tiktok.items",
  team: "pcr.team.text",
  playlists: "pcr.playlists.items",
} as const;

// -------------------- EMPTY INITIALS (NO DEFAULT CONTENT) --------------------

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

const EMPTY_HERO: HeroCms = {
  titleLight: "",
  rotateWords: [],
  subLines: [],
  buttons: {
    primaryLabel: "",
    primaryHref: "",
    secondaryLabel: "",
    secondaryScrollTo: "",
  },
};

const EMPTY_TIKTOK: TikTokCms = { items: [] };
const EMPTY_RELEASES_HUB: ReleasesHubCms = { items: [] };
const EMPTY_PLAYLISTS: PlaylistsCms = { items: [] };

const EMPTY_ABOUT_TEXT = "";
const EMPTY_TEAM_TEXT = "";

// -------------------- HELPERS --------------------

function safeJsonParse<T>(raw: any, fallback: T): T {
  try {
    if (!raw) return fallback;
    if (typeof raw === "string") return JSON.parse(raw) as T;
    return raw as T;
  } catch {
    return fallback;
  }
}

function normalizeLinesFromTextarea(v: string) {
  return (v || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function isIsoDate(v: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(v || ""));
}

// “Ensure” funkcije ovde NE UBACUJU default tekst.
// Samo normalizuju shape i čiste obvious junk.

function sanitizeHero(payload: HeroCms): HeroCms {
  const p: any = payload ?? {};
  const rotateWords = Array.isArray(p.rotateWords) ? p.rotateWords.map(String).map((x: string) => x.trim()).filter(Boolean) : [];
  const subLines = Array.isArray(p.subLines) ? p.subLines.map(String).map((x: string) => x.trim()).filter(Boolean) : [];

  return {
    titleLight: String(p.titleLight ?? "").trimEnd(),
    rotateWords,
    subLines,
    buttons: {
      primaryLabel: String(p?.buttons?.primaryLabel ?? "").trimEnd(),
      primaryHref: String(p?.buttons?.primaryHref ?? "").trim(),
      secondaryLabel: String(p?.buttons?.secondaryLabel ?? "").trimEnd(),
      secondaryScrollTo: String(p?.buttons?.secondaryScrollTo ?? "").trim(),
    },
  };
}

function sanitizeTikTok(payload: TikTokCms): TikTokCms {
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const cleaned = items
    .map((x: any) => ({
      id: String(x?.id || newId("tt")),
      url: String(x?.url ?? "").trim(),
    }))
    .filter((x) => x.url.length > 0);

  // Ako želiš striktno max 3 na frontu:
  return { items: cleaned.slice(0, 3) };
}

function sanitizeReleasesHub(payload: ReleasesHubCms): ReleasesHubCms {
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const cleaned = items.map((x: any) => ({
    id: String(x?.id || newId("r")),
    imageSrc: String(x?.imageSrc ?? "").trim(),
    artist: String(x?.artist ?? "").trimEnd(),
    title: String(x?.title ?? "").trimEnd(),
    dateISO: isIsoDate(x?.dateISO) ? String(x.dateISO) : "",
    platformLabel: x?.platformLabel != null ? String(x.platformLabel).trimEnd() : "",
    url: x?.url != null ? String(x.url).trim() : "",
  }));

  return { items: cleaned };
}

function sanitizePlaylists(payload: PlaylistsCms): PlaylistsCms {
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const cleaned = items.map((x: any) => ({
    id: String(x?.id || newId("pl")),
    title: String(x?.title ?? "").trimEnd(),
    url: String(x?.url ?? "").trim(),
    coverSrc: String(x?.coverSrc ?? "").trim(),
  }));

  // Ne filtriram title/url obavezno (da možeš da imaš draft),
  // ali možeš ako hoćeš:
  // const cleaned2 = cleaned.filter(x => x.title || x.url || x.coverSrc);
  return { items: cleaned };
}

// -------------------- COMPONENT --------------------

export default function AdminPCR() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { site, setSite } = useAdminSite();

  const token = localStorage.getItem("token") || "";

  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [hero, setHero] = useState<HeroCms>(EMPTY_HERO);
  const [aboutText, setAboutText] = useState<string>(EMPTY_ABOUT_TEXT);
  const [teamText, setTeamText] = useState<string>(EMPTY_TEAM_TEXT);
  const [tiktok, setTikTok] = useState<TikTokCms>(EMPTY_TIKTOK);
  const [releasesHub, setReleasesHub] = useState<ReleasesHubCms>(EMPTY_RELEASES_HUB);
  const [playlistsCms, setPlaylistsCms] = useState<PlaylistsCms>(EMPTY_PLAYLISTS);

  const [openSection, setOpenSection] = useState<"hero" | "about" | "releasesHub" | "tiktok" | "team" | "playlists" | null>("hero");

  const newItemFlashId = useRef<string | null>(null);
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    document.body.classList.add("is-admin");
    return () => document.body.classList.remove("is-admin");
  }, []);

  useEffect(() => {
    if (!msg) return;
    const t = window.setTimeout(() => setMsg(null), 1500);
    return () => window.clearTimeout(t);
  }, [msg]);

  useEffect(() => {
    const fromUrl = params.get("site");
    if (fromUrl) setSite(fromUrl as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    const s = qp.get("site");
    if (!s) return;

    const isValid = ADMIN_SITES.some((x) => x.key === s);
    if (!isValid) return;

    setSite(s as AdminSiteKey);
  }, [location.search, setSite]);

  useEffect(() => {
    if (!token) navigate("/admin/login");
  }, [token, navigate]);

  const siteLabel = useMemo(() => ADMIN_SITES.find((s) => s.key === site)?.label ?? site, [site]);
  const siteLabelSafe = siteLabel || "PCR";

  const cmsGet = async (key: string) => {
    if (!site) return null;

    const url = buildApiUrl(`/api/cms?siteKey=${encodeURIComponent(site)}&key=${encodeURIComponent(key)}&ts=${Date.now()}`);

    const res = await fetch(url);
    if (res.status === 404) return null;

    const text = await res.text().catch(() => "");
    if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`API returned non-JSON for ${key}`);
    }
  };

  const cmsPut = async (key: string, payload: any) => {
    const url = buildApiUrl(`/api/cms`);

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        siteKey: site,
        key,
        json: JSON.stringify(payload),
      }),
    });

    const text = await res.text().catch(() => "");

    if (res.status === 401) {
      localStorage.removeItem("token");
      navigate("/admin/login");
      throw new Error("Unauthorized");
    }

    if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  };

  const loadOne = async <T,>(key: string, fallback: T): Promise<T | null> => {
    const data = await cmsGet(key);
    if (!data) return null;
    return safeJsonParse<T>(data.json, fallback);
  };

  useEffect(() => {
    let alive = true;

    if (!site) {
      setLoading(false);
      return () => {
        alive = false;
      };
    }

    setMsg(null);
    setLoading(true);

    (async () => {
      try {
        const [h, a, hub, t, team, pls] = await Promise.all([
          loadOne<HeroCms>(CMS_KEYS.hero, EMPTY_HERO),
          loadOne<string>(CMS_KEYS.about, EMPTY_ABOUT_TEXT),
          loadOne<ReleasesHubCms>(CMS_KEYS.releasesHub, EMPTY_RELEASES_HUB),
          loadOne<TikTokCms>(CMS_KEYS.tiktok, EMPTY_TIKTOK),
          loadOne<string>(CMS_KEYS.team, EMPTY_TEAM_TEXT),
          loadOne<PlaylistsCms>(CMS_KEYS.playlists, EMPTY_PLAYLISTS),
        ]);

        if (!alive) return;

        // Ako nema u bazi (null), ostavi prazno (NO DEFAULT).
        setHero(h ? sanitizeHero(h) : EMPTY_HERO);
        setAboutText(typeof a === "string" ? a : EMPTY_ABOUT_TEXT);
        setReleasesHub(hub ? sanitizeReleasesHub(hub) : EMPTY_RELEASES_HUB);
        setTikTok(t ? sanitizeTikTok(t) : EMPTY_TIKTOK);
        setTeamText(typeof team === "string" ? team : EMPTY_TEAM_TEXT);
        setPlaylistsCms(pls ? sanitizePlaylists(pls) : EMPTY_PLAYLISTS);

        setOpenSection((prev) => prev ?? "hero");
      } catch (e: any) {
        if (!alive) return;
        setMsg({ kind: "err", text: e?.message || "Failed to load CMS" });
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site]);

  const saveAll = async () => {
    setMsg(null);
    setSaving(true);

    // Snimamo TAČNO state, samo minimalno sanitizovan da je JSON čist.
    const heroToSave = sanitizeHero(hero);
    const aboutToSave = String(aboutText ?? "").trimEnd();
    const teamToSave = String(teamText ?? "").trimEnd();
    const tiktokToSave = sanitizeTikTok(tiktok);
    const releasesHubToSave = sanitizeReleasesHub(releasesHub);
    const playlistsToSave = sanitizePlaylists(playlistsCms);

    try {
      await Promise.all([
        cmsPut(CMS_KEYS.hero, heroToSave),
        cmsPut(CMS_KEYS.about, aboutToSave),
        cmsPut(CMS_KEYS.releasesHub, releasesHubToSave),
        cmsPut(CMS_KEYS.tiktok, tiktokToSave),
        cmsPut(CMS_KEYS.team, teamToSave),
        cmsPut(CMS_KEYS.playlists, playlistsToSave),
      ]);

      setHero(heroToSave);
      setAboutText(aboutToSave);
      setReleasesHub(releasesHubToSave);
      setTikTok(tiktokToSave);
      setTeamText(teamToSave);
      setPlaylistsCms(playlistsToSave);

      setMsg({ kind: "ok", text: "Saved ✅" });
    } catch (e: any) {
      setMsg({ kind: "err", text: e?.message || "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (key: typeof openSection) => {
    setOpenSection((prev) => (prev === key ? null : key));
  };

  // -------------------- Releases Hub CRUD --------------------

  const updateReleaseHubItem = (id: string, patch: Partial<ReleaseItem>) => {
    setReleasesHub((prev) => ({
      items: (prev.items || []).map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  };

  const addReleaseHubItem = () => {
    const it: ReleaseItem = {
      id: newId("r"),
      imageSrc: "",
      artist: "",
      title: "",
      dateISO: "",
      platformLabel: "",
      url: "",
    };

    setReleasesHub((prev) => ({ items: [it, ...(prev.items || [])] }));
    newItemFlashId.current = it.id;

    setTimeout(() => {
      const el = scrollRefs.current[it.id];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const removeReleaseHubItem = (id: string) => {
    setReleasesHub((prev) => ({ items: (prev.items || []).filter((x) => x.id !== id) }));
  };

  const moveReleaseHubItem = (from: number, to: number) => {
    setReleasesHub((prev) => {
      const next = [...(prev.items || [])];
      if (from < 0 || from >= next.length || to < 0 || to >= next.length) return prev;
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return { items: next };
    });
  };

  // -------------------- TikTok CRUD --------------------

  const updateTikTokItem = (id: string, patch: Partial<TikTokItem>) => {
    setTikTok((prev) => ({
      items: (prev.items || []).map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  };

  const addTikTok = () => {
    setTikTok((prev) => {
      const items = prev.items || [];
      if (items.length >= 3) return prev;
      const it: TikTokItem = { id: newId("tt"), url: "" };
      return { items: [it, ...items] };
    });
  };

  const removeTikTok = (id: string) => {
    setTikTok((prev) => ({ items: (prev.items || []).filter((x) => x.id !== id) }));
  };

  const moveTikTok = (from: number, to: number) => {
    setTikTok((prev) => {
      const next = [...(prev.items || [])];
      if (from < 0 || from >= next.length || to < 0 || to >= next.length) return prev;
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return { items: next };
    });
  };

  // -------------------- Playlists CRUD --------------------

  const updatePlaylistItem = (id: string, patch: Partial<PlaylistItem>) => {
    setPlaylistsCms((prev) => ({
      items: (prev.items || []).map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  };

  const addPlaylistItem = () => {
    const it: PlaylistItem = { id: newId("pl"), title: "", url: "", coverSrc: "" };
    setPlaylistsCms((prev) => ({ items: [it, ...(prev.items || [])] }));
    newItemFlashId.current = it.id;

    setTimeout(() => {
      const el = scrollRefs.current[it.id];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const removePlaylistItem = (id: string) => {
    setPlaylistsCms((prev) => ({ items: (prev.items || []).filter((x) => x.id !== id) }));
  };

  const movePlaylistItem = (from: number, to: number) => {
    setPlaylistsCms((prev) => {
      const next = [...(prev.items || [])];
      if (from < 0 || from >= next.length || to < 0 || to >= next.length) return prev;
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return { items: next };
    });
  };

  const uploadPlaylistCover = async (playlistId: string, file: File) => {
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(buildApiUrl(`/api/uploads/file`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (!res.ok) return;

      const data = await res.json().catch(() => null as any);
      const url = data?.url || data?.path || data?.filePath || data?.publicUrl || "";

      const normalizePublicUrl = (u: string) => {
        if (!u) return "";
        if (/^https?:\/\//i.test(u)) return u;
        const withSlash = u.startsWith("/") ? u : `/${u}`;
        return buildApiUrl(withSlash);
      };

      const publicUrl = normalizePublicUrl(String(url || ""));
      if (publicUrl) updatePlaylistItem(playlistId, { coverSrc: publicUrl });
    } catch {
      //
    }
  };

  // -------------------- RENDER --------------------

  if (loading) {
    return (
      <div className="cms-root">
        <div className="cms-shell">
          <div className="cms-header cms-header--fluid">
            <div className="cms-title">Admin PCR CMS: {siteLabelSafe}</div>
          </div>
          <div className="cms-loading">Loading CMS…</div>
        </div>
      </div>
    );
  }

  const heroRotateText = Array.isArray(hero.rotateWords) ? hero.rotateWords.join("\n") : "";
  const heroSubText = Array.isArray(hero.subLines) ? hero.subLines.join("\n") : "";

  return (
    <div className="cms-root">
      <div className="cms-shell">
        <div className="cms-header">
          <div>
            <div className="cms-title">Admin CMS: {siteLabelSafe}</div>
            <div className="cms-subtitle">Purple Crunch Records</div>
          </div>

          <div className="cms-actions">
            <button
              className="cms-btn cms-btn--primary"
              onClick={() => navigate(`/admin/submissions?site=${encodeURIComponent(site)}`)}
              type="button"
            >
              Back
            </button>

            <select
              className="cms-select"
              value={site}
              onChange={(e) => {
                const next = e.target.value;
                setSite(next as any);

                if (next === "purple-music-group") navigate(`/admin/pmg?site=${encodeURIComponent(next)}`);
                else if (next === "purple-crunch-records") navigate(`/admin/pcr?site=${encodeURIComponent(next)}`);
                else navigate(`/admin/cms?site=${encodeURIComponent(next)}`);
              }}
            >
              {ADMIN_SITES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>

            <button className="cms-btn cms-btn--primary" onClick={saveAll} disabled={saving} type="button">
              {saving ? "Saving…" : "Save all"}
            </button>
          </div>

          {msg && <div className={`cms-headerToast ${msg.kind === "ok" ? "is-ok" : "is-err"}`}>{msg.text}</div>}
        </div>

        <div className="cms-sections">
          {/* HERO */}
          <AccordionHeader title="Home Hero" open={openSection === "hero"} onToggle={() => toggleSection("hero")} />
          {openSection === "hero" && (
            <div className="cms-panel">
              <div className="cms-grid2">
                <Field label="Title (light part)">
                  <input
                    className="cms-input"
                    value={hero.titleLight}
                    onChange={(e) => setHero((p) => ({ ...p, titleLight: e.target.value }))}
                    placeholder="(empty allowed)"
                  />
                </Field>

                <Field label="Rotate words (one per line)">
                  <textarea
                    className="cms-textarea"
                    value={heroRotateText}
                    onChange={(e) => setHero((p) => ({ ...p, rotateWords: normalizeLinesFromTextarea(e.target.value) }))}
                    placeholder="(empty allowed)"
                  />
                </Field>
              </div>

              <Field label="Sub lines (one per line)">
                <textarea
                  className="cms-textarea"
                  value={heroSubText}
                  onChange={(e) => setHero((p) => ({ ...p, subLines: normalizeLinesFromTextarea(e.target.value) }))}
                  placeholder="(empty allowed)"
                />
              </Field>

              <div className="cms-grid2">
                <Field label="Primary button label">
                  <input
                    className="cms-input"
                    value={hero.buttons.primaryLabel}
                    onChange={(e) => setHero((p) => ({ ...p, buttons: { ...p.buttons, primaryLabel: e.target.value } }))}
                    placeholder="(empty allowed)"
                  />
                </Field>

                <Field label="Primary button href">
                  <input
                    className="cms-input"
                    value={hero.buttons.primaryHref}
                    onChange={(e) => setHero((p) => ({ ...p, buttons: { ...p.buttons, primaryHref: e.target.value } }))}
                    placeholder="(empty allowed)"
                  />
                </Field>
              </div>

              <div className="cms-grid2">
                <Field label="Secondary button label">
                  <input
                    className="cms-input"
                    value={hero.buttons.secondaryLabel}
                    onChange={(e) => setHero((p) => ({ ...p, buttons: { ...p.buttons, secondaryLabel: e.target.value } }))}
                    placeholder="(empty allowed)"
                  />
                </Field>

                <Field label="Secondary scrollTo id">
                  <input
                    className="cms-input"
                    value={hero.buttons.secondaryScrollTo}
                    onChange={(e) => setHero((p) => ({ ...p, buttons: { ...p.buttons, secondaryScrollTo: e.target.value } }))}
                    placeholder="(empty allowed)"
                  />
                </Field>
              </div>
            </div>
          )}

          {/* ABOUT */}
          <AccordionHeader title="About (text)" open={openSection === "about"} onToggle={() => toggleSection("about")} />
          {openSection === "about" && (
            <div className="cms-panel">
              <Field label="About text (Enter = new line, blank line = new paragraph)">
                <textarea className="cms-textarea" value={aboutText} onChange={(e) => setAboutText(e.target.value)} rows={10} />
              </Field>
            </div>
          )}

          {/* RELEASES HUB */}
          <AccordionHeader title="Releases Hub (cards list)" open={openSection === "releasesHub"} onToggle={() => toggleSection("releasesHub")} />
          {openSection === "releasesHub" && (
            <div className="cms-panel">
              <div className="cms-block__head">
                <div>
                  <div className="cms-block__title">Items</div>
                  <div className="cms-block__desc">This powers ReleasesAndTrendsFullPage (filters/search on frontend).</div>
                </div>
                <button className="cms-btn cms-btn--primary" onClick={addReleaseHubItem} type="button">
                  + Add release
                </button>
              </div>

              <div className="cms-list">
                {releasesHub.items.map((it, i) => {
                  const isNew = newItemFlashId.current === it.id;

                  return (
                    <div
                      key={it.id}
                      ref={(el) => {
                        scrollRefs.current[it.id] = el;
                      }}
                      className={`cms-card ${isNew ? "is-new" : ""}`}
                      onAnimationEnd={() => {
                        if (isNew) newItemFlashId.current = null;
                      }}
                    >
                      <div className="cms-card__head">
                        <div className="cms-card__title">
                          <div className="cms-card__index">#{i + 1}</div>
                          <div className="cms-card__name">Release</div>
                        </div>

                        <div className="cms-card__actions">
                          <button className="cms-iconbtn" disabled={i === 0} onClick={() => moveReleaseHubItem(i, i - 1)} type="button">
                            ↑
                          </button>
                          <button
                            className="cms-iconbtn"
                            disabled={i === releasesHub.items.length - 1}
                            onClick={() => moveReleaseHubItem(i, i + 1)}
                            type="button"
                          >
                            ↓
                          </button>
                          <button className="cms-btn cms-btn--danger" onClick={() => removeReleaseHubItem(it.id)} type="button">
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="cms-card__body">
                        {it.imageSrc ? (
                          <div className="cms-logoPreview">
                            <img
                              src={it.imageSrc}
                              alt="preview"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }}
                            />
                          </div>
                        ) : null}

                        <div className="cms-grid2">
                          <Field label="Artist">
                            <input
                              className="cms-input"
                              value={it.artist || ""}
                              onChange={(e) => updateReleaseHubItem(it.id, { artist: e.target.value })}
                              placeholder="@artist"
                            />
                          </Field>

                          <Field label="Title">
                            <input
                              className="cms-input"
                              value={it.title || ""}
                              onChange={(e) => updateReleaseHubItem(it.id, { title: e.target.value })}
                              placeholder="Track name"
                            />
                          </Field>
                        </div>

                        <div className="cms-grid2">
                          <Field label="Release date">
                            <div className="cms-dateWrap">
                              <input
                                name="date"
                                className="cms-input cms-dateInput"
                                type="date"
                                value={it.dateISO || ""}
                                onChange={(e) => updateReleaseHubItem(it.id, { dateISO: e.target.value })}
                              />
                              <span className="cms-dateIcon" aria-hidden="true" />
                            </div>
                          </Field>

                          <Field label="Platform label">
                            <input
                              className="cms-input"
                              value={it.platformLabel || ""}
                              onChange={(e) => updateReleaseHubItem(it.id, { platformLabel: e.target.value })}
                              placeholder="Spotify"
                            />
                          </Field>
                        </div>

                        <Field label="Image src (URL)">
                          <input
                            className="cms-input"
                            value={it.imageSrc || ""}
                            onChange={(e) => updateReleaseHubItem(it.id, { imageSrc: e.target.value })}
                            placeholder="https://… or /img.png"
                          />
                        </Field>

                        <Field label="Open URL (Spotify/etc)">
                          <input
                            className="cms-input"
                            value={it.url || ""}
                            onChange={(e) => updateReleaseHubItem(it.id, { url: e.target.value })}
                            placeholder="https://open.spotify.com/…"
                          />
                        </Field>

                        <Field label="Upload image">
                          <input
                            className="cms-input"
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const f = (e.target as HTMLInputElement).files?.[0];
                              if (!f) return;

                              try {
                                const fd = new FormData();
                                fd.append("file", f);

                                const res = await fetch(buildApiUrl(`/api/uploads/file`), {
                                  method: "POST",
                                  headers: { Authorization: `Bearer ${token}` },
                                  body: fd,
                                });

                                if (!res.ok) return;

                                const data = await res.json().catch(() => null as any);
                                const url = data?.url || data?.path || data?.filePath || data?.publicUrl || "";

                                const normalizePublicUrl = (u: string) => {
                                  if (!u) return "";
                                  if (/^https?:\/\//i.test(u)) return u;
                                  const withSlash = u.startsWith("/") ? u : `/${u}`;
                                  return buildApiUrl(withSlash);
                                };

                                const publicUrl = normalizePublicUrl(String(url || ""));
                                if (publicUrl) updateReleaseHubItem(it.id, { imageSrc: publicUrl });
                              } catch {
                                //
                              }
                            }}
                          />
                        </Field>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TIKTOK */}
          <AccordionHeader title="TikTok Trends (3 links)" open={openSection === "tiktok"} onToggle={() => toggleSection("tiktok")} />
          {openSection === "tiktok" && (
            <div className="cms-panel">
              <div className="cms-block__head">
                <div>
                  <div className="cms-block__title">TikTok links</div>
                  <div className="cms-block__desc">Up to 3 items. Reorder works.</div>
                </div>
                <button className="cms-btn cms-btn--primary" onClick={addTikTok} type="button" disabled={tiktok.items.length >= 3}>
                  + Add link
                </button>
              </div>

              <div className="cms-list">
                {tiktok.items.map((it, i) => (
                  <div key={it.id} className="cms-card">
                    <div className="cms-card__head">
                      <div className="cms-card__title">
                        <div className="cms-card__index">#{i + 1}</div>
                        <div className="cms-card__name">TikTok</div>
                      </div>

                      <div className="cms-card__actions">
                        <button className="cms-iconbtn" disabled={i === 0} onClick={() => moveTikTok(i, i - 1)} type="button">
                          ↑
                        </button>
                        <button
                          className="cms-iconbtn"
                          disabled={i === tiktok.items.length - 1}
                          onClick={() => moveTikTok(i, i + 1)}
                          type="button"
                        >
                          ↓
                        </button>
                        <button className="cms-btn cms-btn--danger" onClick={() => removeTikTok(it.id)} type="button">
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="cms-card__body">
                      <Field label="TikTok URL">
                        <input
                          className="cms-input"
                          value={it.url}
                          onChange={(e) => updateTikTokItem(it.id, { url: e.target.value })}
                          placeholder="https://www.tiktok.com/@user/video/123..."
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TEAM */}
          <AccordionHeader title="Team (text)" open={openSection === "team"} onToggle={() => toggleSection("team")} />
          {openSection === "team" && (
            <div className="cms-panel">
              <Field label="Team text (Enter = new line, blank line = new paragraph)">
                <textarea className="cms-textarea" value={teamText} onChange={(e) => setTeamText(e.target.value)} rows={12} />
              </Field>
            </div>
          )}

          {/* PLAYLISTS */}
          <AccordionHeader title="Playlists from contact" open={openSection === "playlists"} onToggle={() => toggleSection("playlists")} />
          {openSection === "playlists" && (
            <div className="cms-panel">
              <div className="cms-block__head">
                <div>
                  <div className="cms-block__title">Items</div>
                  <div className="cms-block__desc">This powers PlaylistPitch cards in Contact form.</div>
                </div>

                <button className="cms-btn cms-btn--primary" onClick={addPlaylistItem} type="button">
                  + Add playlist
                </button>
              </div>

              <div className="cms-list">
                {(playlistsCms.items || []).map((pl, i) => (
                  <div
                    key={pl.id}
                    ref={(el) => {
                      scrollRefs.current[pl.id] = el;
                    }}
                    className={`cms-card ${newItemFlashId.current === pl.id ? "is-new" : ""}`}
                    onAnimationEnd={() => {
                      if (newItemFlashId.current === pl.id) newItemFlashId.current = null;
                    }}
                  >
                    <div className="cms-card__head">
                      <div className="cms-card__title">
                        <div className="cms-card__index">#{i + 1}</div>
                        <div className="cms-card__name">Playlist</div>
                      </div>

                      <div className="cms-card__actions">
                        <button className="cms-iconbtn" disabled={i === 0} onClick={() => movePlaylistItem(i, i - 1)} type="button">
                          ↑
                        </button>
                        <button
                          className="cms-iconbtn"
                          disabled={i === playlistsCms.items.length - 1}
                          onClick={() => movePlaylistItem(i, i + 1)}
                          type="button"
                        >
                          ↓
                        </button>

                        <button className="cms-btn cms-btn--danger" onClick={() => removePlaylistItem(pl.id)} type="button">
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="cms-card__body">
                      {pl.coverSrc ? (
                        <div className="cms-logoPreview">
                          <img
                            src={pl.coverSrc}
                            alt="preview"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </div>
                      ) : null}

                      <Field label="Title*">
                        <input
                          className="cms-input"
                          value={pl.title || ""}
                          onChange={(e) => updatePlaylistItem(pl.id, { title: e.target.value })}
                          placeholder="Playlist title"
                        />
                      </Field>

                      <Field label="Playlist URL (Spotify/etc)*">
                        <input
                          className="cms-input"
                          value={pl.url || ""}
                          onChange={(e) => updatePlaylistItem(pl.id, { url: e.target.value })}
                          placeholder="https://open.spotify.com/playlist/..."
                        />
                      </Field>

                      <Field label="Cover src (URL)">
                        <input
                          className="cms-input"
                          value={pl.coverSrc || ""}
                          onChange={(e) => updatePlaylistItem(pl.id, { coverSrc: e.target.value })}
                          placeholder="/playlist-covers/p1.jpg or https://..."
                        />
                      </Field>

                      <Field label="Upload cover">
                        <input
                          className="cms-input"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = (e.target as HTMLInputElement).files?.[0];
                            if (!f) return;
                            uploadPlaylistCover(pl.id, f);
                          }}
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------- UI HELPERS --------------------

function AccordionHeader({ title, open, onToggle }: { title: string; open: boolean; onToggle: () => void }) {
  return (
    <button className={`cms-acc ${open ? "is-open" : ""}`} onClick={onToggle} type="button">
      <span className="cms-acc__title">{title}</span>
      <span className="cms-acc__plus">{open ? "−" : "+"}</span>
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="cms-field">
      <div className="cms-label">{label}</div>
      {children}
    </div>
  );
}
