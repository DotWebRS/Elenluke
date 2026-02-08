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
  dateISO: string; // YYYY-MM-DD (store ISO, UI shows date picker)
  platformLabel?: string;
  url?: string;
};

type ReleasesHubCms = {
  items: ReleaseItem[];
};

const CMS_KEYS = {
  hero: "pcr.home.hero",
  about: "pcr.about.text",
  releasesHub: "pcr.releasesHub.items",
  tiktok: "pcr.tiktok.items",
  team: "pcr.team.text",
} as const;

// -------------------- DEFAULTS --------------------

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

const DEFAULT_HERO: HeroCms = {
  titleLight: "LET'S BE",
  rotateWords: ["BOLD", "TIMELESS", "UNIGNORABLE"],
  subLines: ["YOUR SOUND. YOUR VISION. AMPLIFIED.", "MUSIC THAT DEFINES THE DIGITAL GENERATION"],
  buttons: {
    primaryLabel: "SUBMIT DEMO",
    primaryHref: "/submitform",
    secondaryLabel: "PLAYLIST",
    secondaryScrollTo: "spotify-playlist",
  },
};

const DEFAULT_ABOUT_TEXT =
  "Purple Crunch Records is the artist engine of the Purple Crunch ecosystem, a label\n" +
  "built for creators shaping the sound of digital culture.\n\n" +
  "We champion artists who understand that music today lives beyond streaming. It\n" +
  "thrives through communities, feeds, and viral moments.\n\n" +
  "At Purple Crunch Records, we stand for authenticity, creative freedom, and long-term\n" +
  "artist growth.";

const DEFAULT_TEAM_TEXT =
  "At Purple Crunch, we are a young and dynamic collective of music professionals.\n" +
  "United by passion, creativity, and a shared vision to redefine how music thrives in the digital era.\n\n" +
  "Our structure spans Marketing, Sales, Operations, and Business Development, working\n" +
  "together to bridge art and business with precision and purpose.\n\n" +
  "Driven by curiosity and guided by experience, we build the future of music, one artist at a time.";

const DEFAULT_TIKTOK: TikTokCms = {
  items: [
    { id: newId("tt"), url: "https://www.tiktok.com/@rntyler/video/7496960131242970373" },
    { id: newId("tt"), url: "https://www.tiktok.com/@championsleague/video/7564775226530221334" },
    { id: newId("tt"), url: "https://www.tiktok.com/@looooooooch/video/7479530147931032840" },
  ],
};

const DEFAULT_RELEASES_HUB: ReleasesHubCms = {
  items: [
    {
      id: newId("r"),
      imageSrc: "https://images.pexels.com/photos/21261/pexels-photo.jpg?w=1200&h=900&auto=compress&cs=tinysrgb",
      artist: "@violetsaint",
      title: "Night Signal",
      dateISO: "2026-02-02",
      platformLabel: "Spotify",
      url: "https://open.spotify.com/track/1M6UfseXYQfzkRoms2us89?si=7350d635c4a64b38",
    },
    {
      id: newId("r"),
      imageSrc: "https://images.pexels.com/photos/567973/pexels-photo-567973.jpeg?w=1200&h=900&auto=compress&cs=tinysrgb",
      artist: "@novarune",
      title: "Chrome Hearts",
      dateISO: "2026-02-07",
      platformLabel: "Spotify",
      url: "https://open.spotify.com/track/1M6UfseXYQfzkRoms2us89?si=7350d635c4a64b38",
    },
  ],
};

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

function ensureHero(payload: HeroCms | null | undefined): HeroCms {
  const p = payload ?? ({} as any);
  const rotateWords = Array.isArray(p.rotateWords) ? p.rotateWords.filter(Boolean) : DEFAULT_HERO.rotateWords;
  const subLines = Array.isArray(p.subLines) ? p.subLines.filter(Boolean) : DEFAULT_HERO.subLines;

  return {
    titleLight: String(p.titleLight ?? DEFAULT_HERO.titleLight),
    rotateWords: rotateWords.length ? rotateWords : DEFAULT_HERO.rotateWords,
    subLines: subLines.length ? subLines : DEFAULT_HERO.subLines,
    buttons: {
      primaryLabel: String(p?.buttons?.primaryLabel ?? DEFAULT_HERO.buttons.primaryLabel),
      primaryHref: String(p?.buttons?.primaryHref ?? DEFAULT_HERO.buttons.primaryHref),
      secondaryLabel: String(p?.buttons?.secondaryLabel ?? DEFAULT_HERO.buttons.secondaryLabel),
      secondaryScrollTo: String(p?.buttons?.secondaryScrollTo ?? DEFAULT_HERO.buttons.secondaryScrollTo),
    },
  };
}

function ensureTikTok(payload: TikTokCms | null | undefined): TikTokCms {
  const items = (payload?.items ?? []).map((x: any) => ({
    id: x?.id || newId("tt"),
    url: String(x?.url ?? ""),
  }));
  const trimmed = items.slice(0, 3);
  return { items: trimmed.length ? trimmed : DEFAULT_TIKTOK.items };
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

function ensureReleasesHub(payload: ReleasesHubCms | null | undefined): ReleasesHubCms {
  const items = (payload?.items ?? []).map((x: any) => ({
    id: x?.id || newId("r"),
    imageSrc: String(x?.imageSrc ?? ""),
    artist: String(x?.artist ?? ""),
    title: String(x?.title ?? ""),
    dateISO: isIsoDate(x?.dateISO) ? String(x.dateISO) : "",
    platformLabel: x?.platformLabel != null ? String(x.platformLabel) : "",
    url: x?.url != null ? String(x.url) : "",
  }));

  return { items: items.length ? items : DEFAULT_RELEASES_HUB.items };
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

  const [hero, setHero] = useState<HeroCms>(DEFAULT_HERO);
  const [aboutText, setAboutText] = useState<string>(DEFAULT_ABOUT_TEXT);
  const [teamText, setTeamText] = useState<string>(DEFAULT_TEAM_TEXT);
  const [tiktok, setTikTok] = useState<TikTokCms>(DEFAULT_TIKTOK);
  const [releasesHub, setReleasesHub] = useState<ReleasesHubCms>(DEFAULT_RELEASES_HUB);

  const [openSection, setOpenSection] = useState<"hero" | "about" | "releasesHub" | "tiktok" | "team" | null>("hero");

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
        const [h, a, hub, t, team] = await Promise.all([
          loadOne<HeroCms>(CMS_KEYS.hero, DEFAULT_HERO),
          loadOne<string>(CMS_KEYS.about, DEFAULT_ABOUT_TEXT),
          loadOne<ReleasesHubCms>(CMS_KEYS.releasesHub, DEFAULT_RELEASES_HUB),
          loadOne<TikTokCms>(CMS_KEYS.tiktok, DEFAULT_TIKTOK),
          loadOne<string>(CMS_KEYS.team, DEFAULT_TEAM_TEXT),
        ]);

        if (!alive) return;

        setHero(ensureHero(h));
        setAboutText(typeof a === "string" && a.trim().length ? a : DEFAULT_ABOUT_TEXT);
        setReleasesHub(ensureReleasesHub(hub));
        setTikTok(ensureTikTok(t));
        setTeamText(typeof team === "string" && team.trim().length ? team : DEFAULT_TEAM_TEXT);

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

    const heroToSave = ensureHero(hero);
    const aboutToSave = String(aboutText ?? "").trimEnd();
    const teamToSave = String(teamText ?? "").trimEnd();
    const tiktokToSave = ensureTikTok(tiktok);
    const releasesHubToSave = ensureReleasesHub(releasesHub);

    try {
      await Promise.all([
        cmsPut(CMS_KEYS.hero, heroToSave),
        cmsPut(CMS_KEYS.about, aboutToSave),
        cmsPut(CMS_KEYS.releasesHub, releasesHubToSave),
        cmsPut(CMS_KEYS.tiktok, tiktokToSave),
        cmsPut(CMS_KEYS.team, teamToSave),
      ]);

      setHero(heroToSave);
      setAboutText(aboutToSave);
      setReleasesHub(releasesHubToSave);
      setTikTok(tiktokToSave);
      setTeamText(teamToSave);

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

  const siteLabelSafe = siteLabel || "PCR";

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
      platformLabel: "Spotify",
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
                    placeholder="LET'S BE"
                  />
                </Field>

                <Field label="Rotate words (one per line)">
                  <textarea
                    className="cms-textarea"
                    value={heroRotateText}
                    onChange={(e) => setHero((p) => ({ ...p, rotateWords: normalizeLinesFromTextarea(e.target.value) }))}
                    placeholder="TIMELESS\nUNIGNORABLE"
                  />
                </Field>
              </div>

              <Field label="Sub lines (one per line)">
                <textarea
                  className="cms-textarea"
                  value={heroSubText}
                  onChange={(e) => setHero((p) => ({ ...p, subLines: normalizeLinesFromTextarea(e.target.value) }))}
                  placeholder="YOUR SOUND...\nMUSIC THAT..."
                />
              </Field>
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

                                const publicUrl = normalizePublicUrl(url);
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
