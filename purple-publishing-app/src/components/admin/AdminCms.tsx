import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { ADMIN_SITES } from "./adminSites";
import { useAdminSite } from "./useAdminSite";
import "../../AdminCms.css";
import type { AdminSiteKey } from "./adminSites";

/** =========================
 *  Types
 *  ========================= */
type HeroCms = {
  prefixes: [string, string, string];
  typeWords: [string, string, string];
  subtext: string;
};

type AboutCms = {
  paragraphs: [string, string, string, string, string];
};

type CmsTrack = { title: string; url: string };

type CmsArtist = {
  id: string;
  name: string;
  bio: string;
  image: string; // url or dataURL
  spotifyUrl: string;
  tracks: CmsTrack[]; // always 5
};

type CmsRosterPayload = { artists: CmsArtist[] };

type CmsHomeArtistsPayload = {
  top3: string[]; // ids from roster, ordered
};

type ServicesItem = { title: string; text: string };
type CmsServicesPayload = { items: ServicesItem[] };

type FaqItem = { id: string; q: string; a: string };
type CmsFaqPayload = { items: FaqItem[] };

type PartnerItem = { id: string; src: string; name: string; href: string };
type CmsPartnersPayload = { items: PartnerItem[] };

type CmsSyncPayload = {
  h1: string;
  t1: string;
  h2: string;
  t2: string;
  h3: string;
  t3: string;
};

/** =========================
 *  CMS Keys
 *  ========================= */
const CMS_KEYS = {
  hero: "home.hero",
  about: "home.about",
  services: "home.services",
  homeArtists: "home.artists", // { top3: [...] }
  roster: "artists.roster",
  faq: "home.faq",
  partners: "home.partners",
  syncText: "home.syncText"
};

/** =========================
 *  Defaults
 *  ========================= */
const DEFAULT_HERO: HeroCms = {
  prefixes: ["BUILT FOR", "EMPOWERING", "ELEVATING"],
  typeWords: ["SONGWRITERS.", "CREATORS.", "TALENT."],
  subtext: "Your trusted partner in music publishing, global rights administration, and creative career growth."
};

const DEFAULT_ABOUT: AboutCms = {
  paragraphs: [
    "Purple Crunch Publishing is a boutique music publishing company focused on creator-first partnerships, global rights administration, and long-term artist development.",
    "",
    "",
    "",
    ""
  ]
};

function make5Tracks(): CmsTrack[] {
  return Array.from({ length: 5 }).map((_, i) => ({
    title: `Track ${i + 1}`,
    url: ""
  }));
}

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function newArtist(idSeed?: string): CmsArtist {
  const id = idSeed ?? newId("artist");
  return {
    id,
    name: "New Artist",
    bio: "",
    image: "",
    spotifyUrl: "",
    tracks: make5Tracks()
  };
}

const DEFAULT_ROSTER: CmsRosterPayload = {
  artists: Array.from({ length: 10 }).map((_, i) => {
    const a = newArtist(`seed_${i + 1}`);
    return { ...a, name: `Artist ${i + 1}` };
  })
};

const DEFAULT_HOME_ARTISTS: CmsHomeArtistsPayload = { top3: [] };

const DEFAULT_SERVICES: CmsServicesPayload = {
  items: [
    { title: "Rights management & Administration", text: "We ensure every work is properly registered and protected worldwide." },
    { title: "Royalty collection & Accounting", text: "We track, collect, and transparently report royalties across all platforms." },
    { title: "Sync opportunities & Pitching", text: "We connect your music with global film, TV, gaming, and brand placements." },
    { title: "Publishing right registration", text: "We manage and register publishing rights to guarantee accurate ownership and payment." }
  ]
};

const DEFAULT_FAQ: CmsFaqPayload = {
  items: [
    { id: newId("faq"), q: "WHAT IS MUSIC PUBLISHING?", a: "Publishing covers songwriting rights administration." },
    { id: newId("faq"), q: "HOW CAN YOU SUPPORT ME?", a: "We register works, manage rights, and collect royalties." }
  ]
};

const DEFAULT_PARTNERS: CmsPartnersPayload = {
  items: [
    { id: newId("partner"), src: "", name: "Partner 1", href: "" },
    { id: newId("partner"), src: "", name: "Partner 2", href: "" },
    { id: newId("partner"), src: "", name: "Partner 3", href: "" }
  ]
};

const DEFAULT_SYNC: CmsSyncPayload = {
  h1: "Sync Made Simple. Music Made Powerful.",
  t1: "We connect your music to film, TV, ads, games, and digital content with smooth clearance and transparent licensing.",
  h2: "Where Music meets Global impact.",
  t2: "Worldwide rights administration and strategic placements that grow your catalog and revenue.",
  h3: "Where premium sound meets viral energy.",
  t3: "From trending digital sounds to bespoke compositions—built for your audience and your brief."
};

/** =========================
 *  Helpers
 *  ========================= */
function safeJsonParse<T>(s: any, fallback: T): T {
  try {
    if (!s) return fallback;
    if (typeof s === "string") return JSON.parse(s) as T;
    return s as T;
  } catch {
    return fallback;
  }
}

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (from === to) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function normalizeTop3(top3: string[], rosterIds: string[]): string[] {
  const uniq: string[] = [];
  for (const id of top3) {
    if (rosterIds.includes(id) && !uniq.includes(id)) uniq.push(id);
  }
  return uniq.slice(0, 3);
}

function ensureArtistIds(payload: CmsRosterPayload): CmsRosterPayload {
  const artists = (payload?.artists ?? []).map((a: any) => ({
    ...a,
    id: a?.id || newId("artist"),
    name: a?.name ?? "",
    bio: a?.bio ?? "",
    image: a?.image ?? "",
    spotifyUrl: a?.spotifyUrl ?? "",
    tracks: Array.isArray(a?.tracks) && a.tracks.length ? a.tracks : make5Tracks()
  }));
  return { artists };
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/** =========================
 *  Component
 *  ========================= */
export default function AdminCms() {
  const location = useLocation();

  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { site, setSite } = useAdminSite();
  const token = localStorage.getItem("token") || "";

  const API_BASE = (import.meta as any).env?.VITE_API_BASE || "http://localhost:5284";

  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = window.setTimeout(() => setMsg(null), 1500);
    return () => window.clearTimeout(t);
  }, [msg]);

  const [saving, setSaving] = useState(false);

  // main cms state
  const [hero, setHero] = useState<HeroCms>(DEFAULT_HERO);
  const [about, setAbout] = useState<AboutCms>(DEFAULT_ABOUT);
  const [services, setServices] = useState<CmsServicesPayload>(DEFAULT_SERVICES);
  const [roster, setRoster] = useState<CmsRosterPayload>(DEFAULT_ROSTER);
  const [homeArtists, setHomeArtists] = useState<CmsHomeArtistsPayload>(DEFAULT_HOME_ARTISTS);
  const [faq, setFaq] = useState<CmsFaqPayload>(DEFAULT_FAQ);
  const [partners, setPartners] = useState<CmsPartnersPayload>(DEFAULT_PARTNERS);
  const [syncText, setSyncText] = useState<CmsSyncPayload>(DEFAULT_SYNC);

  const [loading, setLoading] = useState(true);

  // accordion state (CONTACT izbačen)
  const [openSection, setOpenSection] = useState<
    "hero" | "about" | "artists" | "services" | "sync" | "partners" | "faq" | null
  >(null);

  // artist accordion
  const [openArtistId, setOpenArtistId] = useState<string | null>(null);

  // highlight newly added
  const [newArtistId, setNewArtistId] = useState<string | null>(null);
  const [newFaqId, setNewFaqId] = useState<string | null>(null);
  const [newPartnerId, setNewPartnerId] = useState<string | null>(null);

  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // site from url (query param)
  useEffect(() => {
    const fromUrl = params.get("site");
    if (fromUrl) setSite(fromUrl as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ALSO allow setting site from location.search (your extra handler)
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
    const res = await fetch(`${API_BASE}/api/cms?siteKey=${encodeURIComponent(site)}&key=${encodeURIComponent(key)}`);
    if (res.status === 404) return null;
    const text = await res.text();
    if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`API returned non-JSON for ${key}`);
    }
  };

  const cmsPut = async (key: string, payload: any) => {
    const res = await fetch(`${API_BASE}/api/cms`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        siteKey: site,
        key,
        json: JSON.stringify(payload)
      })
    });

    if (res.status === 401) {
      localStorage.removeItem("token");
      navigate("/admin/login");
      throw new Error("Unauthorized");
    }
    const text = await res.text();
    if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  };

  const loadOne = async <T,>(key: string, fallback: T): Promise<T | null> => {
    const data = await cmsGet(key);
    if (!data) return null;
    return safeJsonParse<T>(data.json, fallback);
  };

  // LOAD ALL (CONTACT izbačen)
  useEffect(() => {
    let alive = true;
    setMsg(null);
    setLoading(true);

    (async () => {
      try {
        const [h, a, sv, f, p, s] = await Promise.all([
          loadOne<HeroCms>(CMS_KEYS.hero, DEFAULT_HERO),
          loadOne<AboutCms>(CMS_KEYS.about, DEFAULT_ABOUT),
          loadOne<CmsServicesPayload>(CMS_KEYS.services, DEFAULT_SERVICES),
          loadOne<CmsFaqPayload>(CMS_KEYS.faq, DEFAULT_FAQ),
          loadOne<CmsPartnersPayload>(CMS_KEYS.partners, DEFAULT_PARTNERS),
          loadOne<CmsSyncPayload>(CMS_KEYS.syncText, DEFAULT_SYNC)
        ]);

        const rosterRaw = await loadOne<any>(CMS_KEYS.roster, null as any);
        const homeArtistsRaw = await loadOne<any>(CMS_KEYS.homeArtists, DEFAULT_HOME_ARTISTS);

        const finalRoster = rosterRaw
          ? ensureArtistIds(safeJsonParse<CmsRosterPayload>(rosterRaw, DEFAULT_ROSTER))
          : DEFAULT_ROSTER;

        const rosterIds = finalRoster.artists.map((x) => x.id);

        let nextHomeArtists: CmsHomeArtistsPayload = DEFAULT_HOME_ARTISTS;
        if (homeArtistsRaw && typeof homeArtistsRaw === "object" && Array.isArray(homeArtistsRaw.top3)) {
          nextHomeArtists = { top3: normalizeTop3(homeArtistsRaw.top3, rosterIds) };
        } else {
          nextHomeArtists = { top3: rosterIds.slice(0, 3) };
        }

        if (!alive) return;

        if (h) setHero(h);
        if (a) setAbout(a);
        if (sv) setServices(sv);

        if (f) {
          setFaq({
            items: (f.items || []).map((it: any) => ({
              id: it.id || newId("faq"),
              q: it.q ?? "",
              a: it.a ?? ""
            }))
          });
        }

        if (p) {
          setPartners({
            items: (p.items || []).map((it: any) => ({
              id: it.id || newId("partner"),
              src: it.src ?? "",
              name: it.name ?? "",
              href: it.href ?? ""
            }))
          });
        }

        if (s) setSyncText(s);

        setRoster(finalRoster);
        setHomeArtists(nextHomeArtists);

        // open Hero by default
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

  /** =========================
   *  Save (GLOBAL) (CONTACT izbačen)
   *  ========================= */
  const saveAll = async () => {
    setMsg(null);
    setSaving(true);
    try {
      const rosterIds = roster.artists.map((x) => x.id);
      const normalizedHomeArtists: CmsHomeArtistsPayload = {
        top3: normalizeTop3(homeArtists.top3, rosterIds)
      };

      await Promise.all([
        cmsPut(CMS_KEYS.hero, hero),
        cmsPut(CMS_KEYS.about, about),
        cmsPut(CMS_KEYS.services, services),
        cmsPut(CMS_KEYS.roster, roster),
        cmsPut(CMS_KEYS.homeArtists, normalizedHomeArtists),
        cmsPut(CMS_KEYS.faq, faq),
        cmsPut(CMS_KEYS.partners, partners),
        cmsPut(CMS_KEYS.syncText, syncText)
      ]);

      setHomeArtists(normalizedHomeArtists);
      setMsg({ kind: "ok", text: "Saved ✅" });
    } catch (e: any) {
      setMsg({ kind: "err", text: e?.message || "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  /** =========================
   *  Upload helper
   *  ========================= */
  const uploadImage = async (file: File): Promise<string> => {
    // Try backend upload endpoint (preferred)
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(`${API_BASE}/api/uploads/file`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });

      if (res.ok) {
        const data = await res.json();
        return data?.url || data?.path || data?.filePath || data?.publicUrl || "";
      }
    } catch {
      // ignore and fallback
    }
    return readFileAsDataUrl(file);
  };

  /** =========================
   *  Artists (Top 3)
   *  ========================= */
  const top3Artists = useMemo(() => {
    const map = new Map(roster.artists.map((a) => [a.id, a]));
    return homeArtists.top3.map((id) => map.get(id)).filter(Boolean) as CmsArtist[];
  }, [homeArtists.top3, roster.artists]);

  const setTop3At = (index: number, id: string) => {
    setHomeArtists((prev) => {
      const next = [...prev.top3];
      next[index] = id;
      const uniq: string[] = [];
      for (const x of next) if (x && !uniq.includes(x)) uniq.push(x);
      return { top3: uniq.slice(0, 3) };
    });
  };

  const moveTop3 = (from: number, to: number) => {
    setHomeArtists((prev) => ({ top3: moveItem(prev.top3, from, to) }));
  };

  const autoFillTop3 = () => {
    setHomeArtists((prev) => {
      const ids = roster.artists.map((x) => x.id);
      const existing = normalizeTop3(prev.top3, ids);
      while (existing.length < 3 && ids[existing.length]) existing.push(ids[existing.length]);
      return { top3: existing.slice(0, 3) };
    });
  };

  /** =========================
   *  Artists (Roster)
   *  ========================= */
  const updateRosterArtist = (idx: number, patch: Partial<CmsArtist>) => {
    setRoster((prev) => {
      const next = [...prev.artists];
      next[idx] = { ...next[idx], ...patch };
      return { artists: next };
    });
  };

  const removeRosterArtist = (idx: number) => {
    setRoster((prev) => {
      const removed = prev.artists[idx]?.id;
      const nextArtists = prev.artists.filter((_, i) => i !== idx);

      setHomeArtists((ha) => ({ top3: ha.top3.filter((id) => id !== removed) }));
      if (openArtistId === removed) setOpenArtistId(null);

      return { artists: nextArtists };
    });
  };

  const moveRosterArtist = (from: number, to: number) => {
    setRoster((prev) => ({ artists: moveItem(prev.artists, from, to) }));
  };

  const addRosterArtist = () => {
    const a = newArtist();
    setRoster((prev) => ({ artists: [a, ...prev.artists] }));
    setOpenArtistId(a.id);
    setNewArtistId(a.id);

    setTimeout(() => {
      const el = scrollRefs.current[a.id];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  /** =========================
   *  Tracks (always 5)
   *  ========================= */
  const updateTrack = (artistIndex: number, trackIndex: number, patch: Partial<CmsTrack>) => {
    const a = roster.artists[artistIndex];
    const tracks = Array.isArray(a.tracks) && a.tracks.length ? [...a.tracks] : make5Tracks();
    while (tracks.length < 5) tracks.push({ title: `Track ${tracks.length + 1}`, url: "" });
    tracks[trackIndex] = { ...tracks[trackIndex], ...patch };
    updateRosterArtist(artistIndex, { tracks });
  };

  /** =========================
   *  Services
   *  ========================= */
  const updateService = (i: number, patch: Partial<ServicesItem>) => {
    setServices((prev) => {
      const items = [...prev.items];
      items[i] = { ...items[i], ...patch };
      return { items };
    });
  };

  const addService = () => {
    const item: ServicesItem = { title: "New service", text: "" };
    setServices((prev) => ({ items: [item, ...prev.items] }));
  };

  const removeService = (i: number) => {
    setServices((prev) => ({ items: prev.items.filter((_, idx) => idx !== i) }));
  };

  const moveService = (from: number, to: number) => {
    setServices((prev) => ({ items: moveItem(prev.items, from, to) }));
  };

  /** =========================
   *  FAQ
   *  ========================= */
  const updateFaqItem = (id: string, patch: Partial<FaqItem>) => {
    setFaq((prev) => ({
      items: prev.items.map((x) => (x.id === id ? { ...x, ...patch } : x))
    }));
  };

  const addFaqItem = () => {
    const it: FaqItem = { id: newId("faq"), q: "New question", a: "" };
    setFaq((prev) => ({ items: [it, ...prev.items] }));
    setNewFaqId(it.id);

    setTimeout(() => {
      const el = scrollRefs.current[it.id];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const removeFaqItem = (id: string) => {
    setFaq((prev) => ({ items: prev.items.filter((x) => x.id !== id) }));
  };

  const moveFaq = (from: number, to: number) => {
    setFaq((prev) => ({ items: moveItem(prev.items, from, to) }));
  };

  /** =========================
   *  Partners
   *  ========================= */
  const updatePartner = (id: string, patch: Partial<PartnerItem>) => {
    setPartners((prev) => ({
      items: prev.items.map((x) => (x.id === id ? { ...x, ...patch } : x))
    }));
  };

  const addPartner = () => {
    const it: PartnerItem = { id: newId("partner"), src: "", name: "New Partner", href: "" };
    setPartners((prev) => ({ items: [it, ...prev.items] }));
    setNewPartnerId(it.id);

    setTimeout(() => {
      const el = scrollRefs.current[it.id];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const removePartner = (id: string) => {
    setPartners((prev) => ({ items: prev.items.filter((x) => x.id !== id) }));
  };

  const movePartner = (from: number, to: number) => {
    setPartners((prev) => ({ items: moveItem(prev.items, from, to) }));
  };

  /** =========================
   *  UI
   *  ========================= */
  const toggleSection = (k: typeof openSection) => {
    setOpenSection((prev) => (prev === k ? null : k));
    setNewArtistId(null);
    setNewFaqId(null);
    setNewPartnerId(null);
  };

  if (loading) {
    return (
      <div className="cms-root">
        <div className="cms-shell">
          <div className="cms-header cms-header--fluid">
            <div className="cms-title">Admin CMS: {siteLabel}</div>
          </div>

          <div className="cms-loading">Loading CMS…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="cms-root">
      <div className="cms-shell">
        {/* HEADER (sticky) */}
        <div className="cms-header">
          <div>
            <div className="cms-title">Admin CMS: {siteLabel}</div>
            <div className="cms-subtitle">Purple Crunch Publishing</div>
          </div>

          <div className="cms-actions">
            <select
              className="cms-select"
              value={site}
              onChange={(e) => {
                const next = e.target.value;
                setSite(next as any);
                navigate(`/admin/cms?site=${encodeURIComponent(next)}`);
              }}
            >
              {ADMIN_SITES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>

            <button className="cms-btn cms-btn--primary" onClick={saveAll} disabled={saving}>
              {saving ? "Saving…" : "Save all"}
            </button>
          </div>

          {msg && <div className={`cms-headerToast ${msg.kind === "ok" ? "is-ok" : "is-err"}`}>{msg.text}</div>}
        </div>

        {/* SECTIONS */}
        <div className="cms-sections">
          {/* HERO */}
          <AccordionHeader title="Hero" open={openSection === "hero"} onToggle={() => toggleSection("hero")} />
          {openSection === "hero" && (
            <div className="cms-panel">
              <div className="cms-grid3">
                <Field label="Prefix 1">
                  <input
                    className="cms-input"
                    value={hero.prefixes[0]}
                    onChange={(e) => setHero((p) => ({ ...p, prefixes: [e.target.value, p.prefixes[1], p.prefixes[2]] }))}
                  />
                </Field>
                <Field label="Prefix 2">
                  <input
                    className="cms-input"
                    value={hero.prefixes[1]}
                    onChange={(e) => setHero((p) => ({ ...p, prefixes: [p.prefixes[0], e.target.value, p.prefixes[2]] }))}
                  />
                </Field>
                <Field label="Prefix 3">
                  <input
                    className="cms-input"
                    value={hero.prefixes[2]}
                    onChange={(e) => setHero((p) => ({ ...p, prefixes: [p.prefixes[0], p.prefixes[1], e.target.value] }))}
                  />
                </Field>
              </div>

              <div className="cms-grid3">
                <Field label="Typed text 1">
                  <input
                    className="cms-input"
                    value={hero.typeWords[0]}
                    onChange={(e) => setHero((p) => ({ ...p, typeWords: [e.target.value, p.typeWords[1], p.typeWords[2]] }))}
                  />
                </Field>
                <Field label="Typed text 2">
                  <input
                    className="cms-input"
                    value={hero.typeWords[1]}
                    onChange={(e) => setHero((p) => ({ ...p, typeWords: [p.typeWords[0], e.target.value, p.typeWords[2]] }))}
                  />
                </Field>
                <Field label="Typed text 3">
                  <input
                    className="cms-input"
                    value={hero.typeWords[2]}
                    onChange={(e) => setHero((p) => ({ ...p, typeWords: [p.typeWords[0], p.typeWords[1], e.target.value] }))}
                  />
                </Field>
              </div>

              <Field label="Subtitle (subtext)">
                <textarea className="cms-textarea" value={hero.subtext} onChange={(e) => setHero((p) => ({ ...p, subtext: e.target.value }))} />
              </Field>
            </div>
          )}

          {/* ABOUT */}
          <AccordionHeader title="About" open={openSection === "about"} onToggle={() => toggleSection("about")} />
          {openSection === "about" && (
            <div className="cms-panel">
              <Field label="Paragraph 1 (main)">
                <textarea
                  className="cms-textarea cms-textarea--about"
                  value={about.paragraphs[0]}
                  onChange={(e) =>
                    setAbout((prev) => {
                      const next = [...prev.paragraphs] as AboutCms["paragraphs"];
                      next[0] = e.target.value;
                      return { paragraphs: next };
                    })
                  }
                />
              </Field>
              <div className="cms-divider" />
            </div>
          )}

          {/* ARTISTS */}
          <AccordionHeader title="Artist " open={openSection === "artists"} onToggle={() => toggleSection("artists")} />
          {openSection === "artists" && (
            <div className="cms-panel">
              {/* Top 3 */}
              <div className="cms-block">
                <div className="cms-block__head">
                  <div>
                    <div className="cms-block__title">Main page (choose Top 3 and order)</div>
                    <div className="cms-block__desc">Pick 3 existing artists from roster and reorder with arrows.</div>
                  </div>
                  <button className="cms-btn" onClick={autoFillTop3} type="button">
                    Auto-fill
                  </button>
                </div>

                {[0, 1, 2].map((i) => (
                  <div key={i} className="cms-row">
                    <div className="cms-row__label">Top {i + 1}</div>

                    <select className="cms-select" value={homeArtists.top3[i] ?? ""} onChange={(e) => setTop3At(i, e.target.value)}>
                      <option value="">— select artist —</option>
                      {roster.artists.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>

                    <div className="cms-row__actions">
                      <button className="cms-iconbtn" disabled={i === 0} onClick={() => moveTop3(i, i - 1)} type="button">
                        ↑
                      </button>
                      <button className="cms-iconbtn" disabled={i === 2} onClick={() => moveTop3(i, i + 1)} type="button">
                        ↓
                      </button>
                    </div>
                  </div>
                ))}

                <div className="cms-muted">
                  Preview: {top3Artists.length ? top3Artists.map((a) => a.name).join(" • ") : "Top 3 not selected yet"}
                </div>
              </div>

              {/* Roster */}
              <div className="cms-block">
                <div className="cms-block__head">
                  <div>
                    <div className="cms-block__title">Artist roster</div>
                    <div className="cms-block__desc">
                      Each artist has: name, spotify URL, image (URL or upload), bio, and 5 tracks (title and URL).
                    </div>
                  </div>

                  <div className="cms-inline">
                    <div className="cms-badge">Count: {roster.artists.length}</div>
                    <button className="cms-btn cms-btn--primary" onClick={addRosterArtist} type="button">
                      + Add artist
                    </button>
                  </div>
                </div>

                <div className="cms-list">
                  {roster.artists.map((a, i) => {
                    const open = openArtistId === a.id;
                    const isNew = newArtistId === a.id;

                    return (
                      <div
                        key={a.id}
                        ref={(el) => {
                          scrollRefs.current[a.id] = el;
                        }}
                        className={`cms-card ${isNew ? "is-new" : ""}`}
                        onAnimationEnd={() => {
                          if (isNew) setNewArtistId(null);
                        }}
                      >
                        <div className="cms-card__head">
                          <button
                            className="cms-plus"
                            onClick={() => setOpenArtistId((prev) => (prev === a.id ? null : a.id))}
                            aria-label="Toggle artist"
                            type="button"
                          >
                            {open ? "−" : "+"}
                          </button>

                          <div className="cms-card__title">
                            <div className="cms-card__index">#{i + 1}</div>
                            <div className="cms-card__name">{a.name || "Untitled artist"}</div>
                          </div>

                          <div className="cms-card__actions">
                            <button className="cms-iconbtn" disabled={i === 0} onClick={() => moveRosterArtist(i, i - 1)} type="button">
                              ↑
                            </button>
                            <button
                              className="cms-iconbtn"
                              disabled={i === roster.artists.length - 1}
                              onClick={() => moveRosterArtist(i, i + 1)}
                              type="button"
                            >
                              ↓
                            </button>

                            <button className="cms-btn cms-btn--danger" onClick={() => removeRosterArtist(i)} type="button">
                              Delete
                            </button>
                          </div>
                        </div>

                        {open && (
                          <div className="cms-card__body">
                            <div className="cms-grid2">
                              <Field label="Artist name">
                                <input className="cms-input" value={a.name} onChange={(e) => updateRosterArtist(i, { name: e.target.value })} />
                              </Field>

                              <Field label="Spotify URL">
                                <input
                                  className="cms-input"
                                  value={a.spotifyUrl}
                                  onChange={(e) => updateRosterArtist(i, { spotifyUrl: e.target.value })}
                                />
                              </Field>
                            </div>

                            <div className="cms-grid2">
                              <Field label="Image URL (or dataURL)">
                                <input className="cms-input" value={a.image} onChange={(e) => updateRosterArtist(i, { image: e.target.value })} />
                              </Field>

                              <Field label="Upload image">
                                <input
                                  className="cms-input"
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const f = e.target.files?.[0];
                                    if (!f) return;
                                    const url = await uploadImage(f);
                                    if (url) updateRosterArtist(i, { image: url });
                                  }}
                                />
                              </Field>
                            </div>

                            <Field label="Bio">
                              <textarea className="cms-textarea" value={a.bio} onChange={(e) => updateRosterArtist(i, { bio: e.target.value })} />
                            </Field>

                            <div className="cms-divider" />

                            <div className="cms-block__title" style={{ marginBottom: 10 }}>
                              Tracks (5)
                            </div>

                            <div className="cms-tracks">
                              {Array.from({ length: 5 }).map((_, ti) => (
                                <div key={ti} className="cms-trackrow">
                                  <div className="cms-trackrow__label">Track {ti + 1}</div>
                                  <input
                                    className="cms-input"
                                    value={a.tracks?.[ti]?.title ?? `Track ${ti + 1}`}
                                    onChange={(e) => updateTrack(i, ti, { title: e.target.value })}
                                    placeholder={`Track ${ti + 1} title`}
                                  />
                                  <input
                                    className="cms-input"
                                    value={a.tracks?.[ti]?.url ?? ""}
                                    onChange={(e) => updateTrack(i, ti, { url: e.target.value })}
                                    placeholder="Spotify track URL"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SERVICES */}
          <AccordionHeader title="Services" open={openSection === "services"} onToggle={() => toggleSection("services")} />
          {openSection === "services" && (
            <div className="cms-panel">
              <div className="cms-block__head">
                <div>
                  <div className="cms-block__title">Services list</div>
                  <div className="cms-block__desc">Remove/reorder services.</div>
                </div>
              </div>

              <div className="cms-list">
                {services.items.map((it, i) => (
                  <div key={i} className="cms-card">
                    <div className="cms-card__head">
                      <div className="cms-card__title">
                        <div className="cms-card__index">#{i + 1}</div>
                        <div className="cms-card__name">{it.title || "Service"}</div>
                      </div>

                      <div className="cms-card__actions">
                        <button className="cms-iconbtn" disabled={i === 0} onClick={() => moveService(i, i - 1)} type="button">
                          ↑
                        </button>

                        <button
                          className="cms-iconbtn"
                          disabled={i === services.items.length - 1}
                          onClick={() => moveService(i, i + 1)}
                          type="button"
                        >
                          ↓
                        </button>

                        <button className="cms-btn cms-btn--danger" onClick={() => removeService(i)} type="button">
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="cms-card__body">
                      <div className="cms-grid2">
                        <Field label="Title">
                          <input className="cms-input" value={it.title ?? ""} onChange={(e) => updateService(i, { title: e.target.value })} />
                        </Field>

                        <Field label="Text">
                          <textarea className="cms-textarea" value={it.text ?? ""} onChange={(e) => updateService(i, { text: e.target.value })} />
                        </Field>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SYNC */}
          <AccordionHeader title="Sync" open={openSection === "sync"} onToggle={() => toggleSection("sync")} />
          {openSection === "sync" && (
            <div className="cms-panel">
              <div className="cms-grid3">
                <Field label="H1">
                  <input className="cms-input" value={syncText.h1} onChange={(e) => setSyncText((p) => ({ ...p, h1: e.target.value }))} />
                </Field>
                <Field label="H2">
                  <input className="cms-input" value={syncText.h2} onChange={(e) => setSyncText((p) => ({ ...p, h2: e.target.value }))} />
                </Field>
                <Field label="H3">
                  <input className="cms-input" value={syncText.h3} onChange={(e) => setSyncText((p) => ({ ...p, h3: e.target.value }))} />
                </Field>
              </div>

              <div className="cms-grid3">
                <Field label="T1">
                  <textarea className="cms-textarea" value={syncText.t1} onChange={(e) => setSyncText((p) => ({ ...p, t1: e.target.value }))} />
                </Field>
                <Field label="T2">
                  <textarea className="cms-textarea" value={syncText.t2} onChange={(e) => setSyncText((p) => ({ ...p, t2: e.target.value }))} />
                </Field>
                <Field label="T3">
                  <textarea className="cms-textarea" value={syncText.t3} onChange={(e) => setSyncText((p) => ({ ...p, t3: e.target.value }))} />
                </Field>
              </div>
            </div>
          )}

          {/* PARTNERS */}
          <AccordionHeader title="Partners" open={openSection === "partners"} onToggle={() => toggleSection("partners")} />
          {openSection === "partners" && (
            <div className="cms-panel">
              <div className="cms-block__head">
                <div>
                  <div className="cms-block__title">Partners list</div>
                  <div className="cms-block__desc">Upload logo, edit link, reorder.</div>
                </div>
                <button className="cms-btn cms-btn--primary" onClick={addPartner} type="button">
                  + Add partner
                </button>
              </div>

              <div className="cms-list">
                {partners.items.map((p, i) => {
                  const isNew = newPartnerId === p.id;

                  return (
                    <div
                      key={p.id}
                      ref={(el) => {
                        scrollRefs.current[p.id] = el;
                      }}
                      className={`cms-card ${isNew ? "is-new" : ""}`}
                      onAnimationEnd={() => {
                        if (isNew) setNewPartnerId(null);
                      }}
                    >
                      <div className="cms-card__head">
                        <div className="cms-card__title">
                          <div className="cms-card__index">#{i + 1}</div>
                          <div className="cms-card__name">{p.name || "Partner"}</div>
                        </div>

                        <div className="cms-card__actions">
                          <button className="cms-iconbtn" disabled={i === 0} onClick={() => movePartner(i, i - 1)} type="button">
                            ↑
                          </button>
                          <button
                            className="cms-iconbtn"
                            disabled={i === partners.items.length - 1}
                            onClick={() => movePartner(i, i + 1)}
                            type="button"
                          >
                            ↓
                          </button>
                          <button className="cms-btn cms-btn--danger" onClick={() => removePartner(p.id)} type="button">
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="cms-card__body">
                        <div className="cms-grid2">
                          <Field label="Name">
                            <input className="cms-input" value={p.name} onChange={(e) => updatePartner(p.id, { name: e.target.value })} />
                          </Field>
                          <Field label="Href">
                            <input className="cms-input" value={p.href} onChange={(e) => updatePartner(p.id, { href: e.target.value })} />
                          </Field>
                        </div>

                        <div className="cms-grid2">
                          <Field label="Logo src (URL or dataURL)">
                            <input className="cms-input" value={p.src} onChange={(e) => updatePartner(p.id, { src: e.target.value })} />
                          </Field>

                          <Field label="Upload logo">
                            <input
                              className="cms-input"
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const f = e.target.files?.[0];
                                if (!f) return;
                                const url = await uploadImage(f);
                                if (url) updatePartner(p.id, { src: url });
                              }}
                            />
                          </Field>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* FAQ */}
          <AccordionHeader title="FAQ" open={openSection === "faq"} onToggle={() => toggleSection("faq")} />
          {openSection === "faq" && (
            <div className="cms-panel">
              <div className="cms-block__head">
                <div>
                  <div className="cms-block__title">FAQ items</div>
                  <div className="cms-block__desc">Add/remove/reorder.</div>
                </div>
                <button className="cms-btn cms-btn--primary" onClick={addFaqItem} type="button">
                  + Add FAQ
                </button>
              </div>

              <div className="cms-list">
                {faq.items.map((it, i) => {
                  const isNew = newFaqId === it.id;

                  return (
                    <div
                      key={it.id}
                      ref={(el) => {
                        scrollRefs.current[it.id] = el;
                      }}
                      className={`cms-card ${isNew ? "is-new" : ""}`}
                      onAnimationEnd={() => {
                        if (isNew) setNewFaqId(null);
                      }}
                    >
                      <div className="cms-card__head">
                        <div className="cms-card__title">
                          <div className="cms-card__index">#{i + 1}</div>
                          <div className="cms-card__name">{it.q || "Question"}</div>
                        </div>

                        <div className="cms-card__actions">
                          <button className="cms-iconbtn" disabled={i === 0} onClick={() => moveFaq(i, i - 1)} type="button">
                            ↑
                          </button>
                          <button
                            className="cms-iconbtn"
                            disabled={i === faq.items.length - 1}
                            onClick={() => moveFaq(i, i + 1)}
                            type="button"
                          >
                            ↓
                          </button>
                          <button className="cms-btn cms-btn--danger" onClick={() => removeFaqItem(it.id)} type="button">
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="cms-card__body">
                        <Field label="Question">
                          <input className="cms-input" value={it.q} onChange={(e) => updateFaqItem(it.id, { q: e.target.value })} />
                        </Field>
                        <Field label="Answer">
                          <textarea className="cms-textarea" value={it.a} onChange={(e) => updateFaqItem(it.id, { a: e.target.value })} />
                        </Field>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="cms-bottomhint">
          Tip: Otvori samo sekciju koja ti treba. Sve se snima na <b>Save all</b> (gore u headeru).
        </div>
      </div>
    </div>
  );
}

/** =========================
 *  UI Components
 *  ========================= */
function AccordionHeader({
  title,
  open,
  onToggle
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="cms-field">
      <div className="cms-label">{label}</div>
      {children}
    </div>
  );
}
