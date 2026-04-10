import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ADMIN_SITES, type AdminSiteKey } from "./adminSites";
import { useAdminSite } from "./useAdminSite";
import "../../AdminCms.css";
import { buildApiUrl } from "../../config/apiBase";

type HeroCms = {
  rotateWords: string[];
  subLines: string[];
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
  dateISO: string;
  platformLabel?: string;
  url?: string;
  audioSrc?: string;
};

type ReleasesHubCms = {
  items: ReleaseItem[];
};

type ServiceItem = {
  id: string;
  title: string;
  text: string;
};

type ServicesCms = {
  items: ServiceItem[];
};

const CMS_KEYS = {
  hero: "pcr.home.hero",
  about: "pcr.about.text",
  releasesHub: "pcr.releasesHub.items",
  tiktok: "pcr.tiktok.items",
  team: "pcr.team.text",
  services: "pcr.services",
} as const;

const MAX_TIKTOK_ITEMS = 5;
const SERVICES_COUNT = 3;

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

const EMPTY_HERO: HeroCms = {
  rotateWords: ["YOUR SOUND.", "YOUR VISION.", "AMPLIFIED."],
  subLines: ["MUSIC THAT DEFINES THE DIGITAL GENERATION"],
};

const EMPTY_TIKTOK: TikTokCms = { items: [] };
const EMPTY_RELEASES_HUB: ReleasesHubCms = { items: [] };
const EMPTY_ABOUT_TEXT = "";
const EMPTY_TEAM_TEXT = "";

const DEFAULT_SERVICES: ServicesCms = {
  items: [
    { id: newId("svc"), title: "", text: "" },
    { id: newId("svc"), title: "", text: "" },
    { id: newId("svc"), title: "", text: "" },
  ],
};

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

function sanitizeHero(payload: HeroCms): HeroCms {
  const p: any = payload ?? {};
  const rotateWords = Array.isArray(p.rotateWords)
    ? p.rotateWords.map(String).map((x: string) => x.trim()).filter(Boolean)
    : [];
  const subLines = Array.isArray(p.subLines)
    ? p.subLines.map(String).map((x: string) => x.trim()).filter(Boolean)
    : [];

  return {
    rotateWords,
    subLines,
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

  return { items: cleaned.slice(0, MAX_TIKTOK_ITEMS) };
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
    audioSrc: x?.audioSrc != null ? String(x.audioSrc).trim() : "",
  }));

  return { items: cleaned };
}

function sanitizeServices(payload: ServicesCms): ServicesCms {
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const cleaned = items.map((x: any, i: number) => ({
    id: String(x?.id || `svc_${i + 1}`),
    title: String(x?.title ?? "").trimEnd(),
    text: String(x?.text ?? "").trimEnd(),
  }));

  const next = [...cleaned];
  while (next.length < SERVICES_COUNT) {
    next.push({ id: newId("svc"), title: "", text: "" });
  }

  return { items: next.slice(0, SERVICES_COUNT) };
}

function normalizePublicUrl(u: string) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  const withSlash = u.startsWith("/") ? u : `/${u}`;
  return buildApiUrl(withSlash);
}

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
  const [services, setServices] = useState<ServicesCms>(DEFAULT_SERVICES);

  const [openSection, setOpenSection] = useState<
    "hero" | "about" | "releasesHub" | "tiktok" | "team" | "services" | null
  >("hero");

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
  }, [params, setSite]);

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

  const siteLabel = useMemo(
    () => ADMIN_SITES.find((s) => s.key === site)?.label ?? site,
    [site]
  );
  const siteLabelSafe = siteLabel || "PCR";

  const cmsGet = async (key: string) => {
    if (!site) return null;

    const url = buildApiUrl(
      `/api/cms?siteKey=${encodeURIComponent(site)}&key=${encodeURIComponent(key)}&ts=${Date.now()}`
    );

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
        const [h, a, hub, t, team, svc] = await Promise.all([
          loadOne<HeroCms>(CMS_KEYS.hero, EMPTY_HERO),
          loadOne<string>(CMS_KEYS.about, EMPTY_ABOUT_TEXT),
          loadOne<ReleasesHubCms>(CMS_KEYS.releasesHub, EMPTY_RELEASES_HUB),
          loadOne<TikTokCms>(CMS_KEYS.tiktok, EMPTY_TIKTOK),
          loadOne<string>(CMS_KEYS.team, EMPTY_TEAM_TEXT),
          loadOne<ServicesCms>(CMS_KEYS.services, DEFAULT_SERVICES),
        ]);

        if (!alive) return;

        setHero(h ? sanitizeHero(h) : EMPTY_HERO);
        setAboutText(typeof a === "string" ? a : EMPTY_ABOUT_TEXT);
        setReleasesHub(hub ? sanitizeReleasesHub(hub) : EMPTY_RELEASES_HUB);
        setTikTok(t ? sanitizeTikTok(t) : EMPTY_TIKTOK);
        setTeamText(typeof team === "string" ? team : EMPTY_TEAM_TEXT);
        setServices(svc ? sanitizeServices(svc) : DEFAULT_SERVICES);

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
  }, [site]);

  const saveAll = async () => {
    setMsg(null);
    setSaving(true);

    const heroToSave = sanitizeHero(hero);
    const aboutToSave = String(aboutText ?? "").trimEnd();
    const teamToSave = String(teamText ?? "").trimEnd();
    const tiktokToSave = sanitizeTikTok(tiktok);
    const releasesHubToSave = sanitizeReleasesHub(releasesHub);
    const servicesToSave = sanitizeServices(services);

    try {
      await Promise.all([
        cmsPut(CMS_KEYS.hero, heroToSave),
        cmsPut(CMS_KEYS.about, aboutToSave),
        cmsPut(CMS_KEYS.releasesHub, releasesHubToSave),
        cmsPut(CMS_KEYS.tiktok, tiktokToSave),
        cmsPut(CMS_KEYS.team, teamToSave),
        cmsPut(CMS_KEYS.services, servicesToSave),
      ]);

      setHero(heroToSave);
      setAboutText(aboutToSave);
      setReleasesHub(releasesHubToSave);
      setTikTok(tiktokToSave);
      setTeamText(teamToSave);
      setServices(servicesToSave);

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
      audioSrc: "",
    };

    setReleasesHub((prev) => ({ items: [it, ...(prev.items || [])] }));
    newItemFlashId.current = it.id;

    setTimeout(() => {
      const el = scrollRefs.current[it.id];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const removeReleaseHubItem = (id: string) => {
    setReleasesHub((prev) => ({
      items: (prev.items || []).filter((x) => x.id !== id),
    }));
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

  const uploadReleaseHubImage = async (releaseId: string, file: File) => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "releases");

      const res = await fetch(buildApiUrl(`/api/uploads/file`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (!res.ok) return;

      const data = await res.json().catch(() => null as any);
      const url = data?.url || data?.path || data?.filePath || data?.publicUrl || "";
      const publicUrl = normalizePublicUrl(String(url || ""));

      if (publicUrl) {
        updateReleaseHubItem(releaseId, { imageSrc: publicUrl });
      }
    } catch {}
  };

  const uploadReleaseHubAudio = async (releaseId: string, file: File) => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "releases-audio");

      const res = await fetch(buildApiUrl(`/api/uploads/file`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (!res.ok) return;

      const data = await res.json().catch(() => null as any);
      const url = data?.url || data?.path || data?.filePath || data?.publicUrl || "";
      const publicUrl = normalizePublicUrl(String(url || ""));

      if (publicUrl) {
        updateReleaseHubItem(releaseId, { audioSrc: publicUrl });
      }
    } catch {}
  };

  const updateTikTokItem = (id: string, patch: Partial<TikTokItem>) => {
    setTikTok((prev) => ({
      items: (prev.items || []).map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  };

  const addTikTok = () => {
    setTikTok((prev) => {
      const items = prev.items || [];
      if (items.length >= MAX_TIKTOK_ITEMS) return prev;
      const it: TikTokItem = { id: newId("tt"), url: "" };
      return { items: [...items, it] };
    });
  };

  const removeTikTok = (id: string) => {
    setTikTok((prev) => ({
      items: (prev.items || []).filter((x) => x.id !== id),
    }));
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

  const updateServiceItem = (id: string, patch: Partial<ServiceItem>) => {
    setServices((prev) => ({
      items: prev.items.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  };

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

                if (next === "purple-music-group") {
                  navigate(`/admin/pmg?site=${encodeURIComponent(next)}`);
                } else if (next === "purple-crunch-records") {
                  navigate(`/admin/pcr?site=${encodeURIComponent(next)}`);
                } else {
                  navigate(`/admin/cms?site=${encodeURIComponent(next)}`);
                }
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

          {msg && (
            <div className={`cms-headerToast ${msg.kind === "ok" ? "is-ok" : "is-err"}`}>
              {msg.text}
            </div>
          )}
        </div>

        <div className="cms-sections">
          <AccordionHeader title="Home Hero" open={openSection === "hero"} onToggle={() => toggleSection("hero")} />
          {openSection === "hero" && (
            <div className="cms-panel">
              <Field label="Rotate words (one per line)">
                <textarea
                  className="cms-textarea"
                  value={heroRotateText}
                  onChange={(e) =>
                    setHero((p) => ({
                      ...p,
                      rotateWords: normalizeLinesFromTextarea(e.target.value),
                    }))
                  }
                  placeholder={`YOUR SOUND.\nYOUR VISION.\nAMPLIFIED.`}
                />
              </Field>

              <Field label="Sub lines (one per line)">
                <textarea
                  className="cms-textarea"
                  value={heroSubText}
                  onChange={(e) =>
                    setHero((p) => ({
                      ...p,
                      subLines: normalizeLinesFromTextarea(e.target.value),
                    }))
                  }
                  placeholder="MUSIC THAT DEFINES THE DIGITAL GENERATION"
                />
              </Field>
            </div>
          )}

          <AccordionHeader title="Services" open={openSection === "services"} onToggle={() => toggleSection("services")} />
          {openSection === "services" && (
            <div className="cms-panel">
              <div className="cms-block__head">
                <div>
                  <div className="cms-block__title">Services content</div>
                  <div className="cms-block__desc">Exactly 3 items. Each item has a title and one paragraph.</div>
                </div>
              </div>

              <div className="cms-list">
                {services.items.map((it, i) => (
                  <div key={it.id} className="cms-card">
                    <div className="cms-card__head">
                      <div className="cms-card__title">
                        <div className="cms-card__index">#{i + 1}</div>
                        <div className="cms-card__name">Service {i + 1}</div>
                      </div>
                    </div>

                    <div className="cms-card__body">
                      <Field label="Title">
                        <input
                          className="cms-input"
                          value={it.title}
                          onChange={(e) => updateServiceItem(it.id, { title: e.target.value })}
                        />
                      </Field>

                      <Field label="Paragraph">
                        <textarea
                          className="cms-textarea"
                          value={it.text}
                          onChange={(e) => updateServiceItem(it.id, { text: e.target.value })}
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <AccordionHeader title="About (text)" open={openSection === "about"} onToggle={() => toggleSection("about")} />
          {openSection === "about" && (
            <div className="cms-panel">
              <Field label="About text (Enter = new line, blank line = new paragraph)">
                <textarea
                  className="cms-textarea"
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                  rows={10}
                />
              </Field>
            </div>
          )}

          <AccordionHeader
            title="Releases Hub (cards list)"
            open={openSection === "releasesHub"}
            onToggle={() => toggleSection("releasesHub")}
          />
          {openSection === "releasesHub" && (
            <div className="cms-panel">
              <div className="cms-block__head">
                <div>
                  <div className="cms-block__title">Items</div>
                  <div className="cms-block__desc">This powers ReleasesAndTrendsFullPage.</div>
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
                          <button
                            className="cms-iconbtn"
                            disabled={i === 0}
                            onClick={() => moveReleaseHubItem(i, i - 1)}
                            type="button"
                          >
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
                          <button
                            className="cms-btn cms-btn--danger"
                            onClick={() => removeReleaseHubItem(it.id)}
                            type="button"
                          >
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

                        <Field label="Audio src (URL)">
                          <input
                            className="cms-input"
                            value={it.audioSrc || ""}
                            onChange={(e) => updateReleaseHubItem(it.id, { audioSrc: e.target.value })}
                            placeholder="https://… or /uploads/releases-audio/example.mp3"
                          />
                        </Field>

                        {it.audioSrc ? (
                          <Field label="Audio preview">
                            <audio controls preload="none" style={{ width: "100%" }}>
                              <source src={it.audioSrc} />
                            </audio>
                          </Field>
                        ) : null}

                        <Field label="Upload image">
                          <input
                            className="cms-input"
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const f = (e.target as HTMLInputElement).files?.[0];
                              if (!f) return;
                              await uploadReleaseHubImage(it.id, f);
                              e.currentTarget.value = "";
                            }}
                          />
                        </Field>

                        <Field label="Upload audio (mp3 or wav)">
                          <input
                            className="cms-input"
                            type="file"
                            accept=".mp3,.wav,audio/mpeg,audio/wav"
                            onChange={async (e) => {
                              const f = (e.target as HTMLInputElement).files?.[0];
                              if (!f) return;
                              await uploadReleaseHubAudio(it.id, f);
                              e.currentTarget.value = "";
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

          <AccordionHeader
            title={`TikTok Trends (max ${MAX_TIKTOK_ITEMS})`}
            open={openSection === "tiktok"}
            onToggle={() => toggleSection("tiktok")}
          />
          {openSection === "tiktok" && (
            <div className="cms-panel">
              <div className="cms-block__head">
                <div>
                  <div className="cms-block__title">TikTok links</div>
                  <div className="cms-block__desc">
                    Maximum {MAX_TIKTOK_ITEMS} items. The first item is the main featured TikTok on the page.
                  </div>
                </div>
                <button
                  className="cms-btn cms-btn--primary"
                  onClick={addTikTok}
                  type="button"
                  disabled={tiktok.items.length >= MAX_TIKTOK_ITEMS}
                >
                  + Add link
                </button>
              </div>

              <div className="cms-list">
                {tiktok.items.map((it, i) => (
                  <div key={it.id} className="cms-card">
                    <div className="cms-card__head">
                      <div className="cms-card__title">
                        <div className="cms-card__index">#{i + 1}</div>
                        <div className="cms-card__name">
                          TikTok {i === 0 ? "• MAIN" : ""}
                        </div>
                      </div>

                      <div className="cms-card__actions">
                        <button
                          className="cms-iconbtn"
                          disabled={i === 0}
                          onClick={() => moveTikTok(i, i - 1)}
                          type="button"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          className="cms-iconbtn"
                          disabled={i === tiktok.items.length - 1}
                          onClick={() => moveTikTok(i, i + 1)}
                          type="button"
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          className="cms-btn cms-btn--danger"
                          onClick={() => removeTikTok(it.id)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="cms-card__body">
                      {i === 0 && (
                        <div className="cms-muted" style={{ marginBottom: 10 }}>
                          This is the main TikTok. It will appear first and be treated as the primary one.
                        </div>
                      )}

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

          <AccordionHeader title="Team (text)" open={openSection === "team"} onToggle={() => toggleSection("team")} />
          {openSection === "team" && (
            <div className="cms-panel">
              <Field label="Team text (Enter = new line, blank line = new paragraph)">
                <textarea
                  className="cms-textarea"
                  value={teamText}
                  onChange={(e) => setTeamText(e.target.value)}
                  rows={12}
                />
              </Field>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AccordionHeader({
  title,
  open,
  onToggle,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
}) {
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