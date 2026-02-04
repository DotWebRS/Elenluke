import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { ADMIN_SITES, type AdminSiteKey } from "./adminSites";
import { useAdminSite } from "./useAdminSite";
import "../../AdminCms.css";
import { buildApiUrl } from "../../config/apiBase";

type HeroCms = {
  title: string;
  lines: string[];
  locations: string;
};

type BrandCardItem = {
  id: string;
  key: string;
  title: string;
  desc: string;
  logoSrc: string;
  href: string;
};

type CmsBrandsPayload = {
  items: BrandCardItem[];
};

const CMS_KEYS = {
  hero: "home.hero",
  brands: "home.brands",
};

const DEFAULT_HERO: HeroCms = {
  title: "Purple Music Group",
  lines: [
    "Global music ecosystem for artists, writers, and brands.",
    "Connecting catalogs, campaigns, and creative talent.",
    "Publishing, records, sync, and strategy under one roof.",
    "Built for the digital generation.",
    "Powered by data, driven by creativity.",
  ],
  locations: "Berlin · London · Los Angeles · Worldwide",
};

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

const DEFAULT_BRANDS: CmsBrandsPayload = {
  items: [
    {
      id: newId("brand"),
      key: "records",
      title: "Purple Crunch Records",
      desc: "The artist-facing label dedicated to releases, campaigns, and growth in the digital era.",
      logoSrc: "/record.png",
      href: "https://purplecrunchrecords.com/",
    },
    {
      id: newId("brand"),
      key: "pmg",
      title: "BIGBITE Agency",
      desc: "Specialists in TikTok-first music marketing and cross-platform campaigns.",
      logoSrc: "/BIGBITE.png",
      href: "https://bigbiteagency.com/",
    },
    {
      id: newId("brand"),
      key: "publishing",
      title: "Purple Crunch Publishing",
      desc: "The creative backbone of the Purple Crunch ecosystem for writers, producers, and artists.",
      logoSrc: "/publishing.png",
      href: "https://purplecrunchpublishing.com/",
    },
  ],
};

/*function buildUrl(path: string) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  const full = base ? `${base}/${p}` : `/${p}`;
  console.log("[DBG] API_BASE =", API_BASE, "| buildUrl path =", path, "| full =", full);
  return full;
}*/



function safeJsonParse<T>(s: any, fallback: T): T {
  try {
    if (!s) return fallback;
    if (typeof s === "string") return JSON.parse(s) as T;
    return s as T;
  } catch {
    return fallback;
  }
}

function ensureBrands(payload: CmsBrandsPayload | null | undefined): CmsBrandsPayload {
  const items = (payload?.items ?? []).map((b: any) => ({
    id: b?.id || newId("brand"),
    key: b?.key ?? "",
    title: b?.title ?? "",
    desc: b?.desc ?? "",
    logoSrc: b?.logoSrc ?? "",
    href: b?.href ?? "",
  }));
  if (!items.length) return DEFAULT_BRANDS;
  return { items };
}

export default function AdminPMG() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { site, setSite } = useAdminSite();

  const token = localStorage.getItem("token") || "";
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [hero, setHero] = useState<HeroCms>(DEFAULT_HERO);
  const [brands, setBrands] = useState<CmsBrandsPayload>(DEFAULT_BRANDS);

  const [openSection, setOpenSection] = useState<"hero" | "brands" | null>("hero");
  const [newBrandId, setNewBrandId] = useState<string | null>(null);

  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!msg) return;
    const t = window.setTimeout(() => setMsg(null), 1500);
    return () => window.clearTimeout(t);
  }, [msg]);

  useEffect(() => {
    const fromUrl = params.get("site");
    if (fromUrl) setSite(fromUrl as any);
   
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

  const siteLabel = useMemo(
    () => ADMIN_SITES.find((s) => s.key === site)?.label ?? site,
    [site]
  );

  const cmsGet = async (key: string) => {
    if (!site) return null;

    const url = buildApiUrl(
      `/api/cms?siteKey=${encodeURIComponent(site)}&key=${encodeURIComponent(
        key
      )}&ts=${Date.now()}`
    );

    console.log("[AdminPMG] GET", url);

    const res = await fetch(url);
    if (res.status === 404) return null;

    const text = await res.text().catch(() => "");
    if (!res.ok) {
      console.error("[AdminPMG] error response", res.status, text);
      throw new Error(text || `HTTP ${res.status}`);
    }

    try {
      return JSON.parse(text);
    } catch {
      console.error("[AdminPMG] raw response for", key, ":", text);
      throw new Error(`API returned non-JSON for ${key}`);
    }
  };

  const cmsPut = async (key: string, payload: any) => {
    const url = buildApiUrl(`/api/cms`);

    console.log("[AdminPMG] PUT", url, "siteKey=", site, "key=", key);

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
      console.error("[AdminPMG] unauthorized PUT", text);
      localStorage.removeItem("token");
      navigate("/admin/login");
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      console.error("[AdminPMG] PUT failed", res.status, text);
      throw new Error(text || `HTTP ${res.status}`);
    }
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
        const [h, br] = await Promise.all([
          loadOne<HeroCms>(CMS_KEYS.hero, DEFAULT_HERO),
          loadOne<CmsBrandsPayload>(CMS_KEYS.brands, DEFAULT_BRANDS),
        ]);

        if (!alive) return;

        if (h) {
          setHero({
            title: h.title || DEFAULT_HERO.title,
            lines: Array.isArray(h.lines) ? h.lines : DEFAULT_HERO.lines,
            locations: h.locations || DEFAULT_HERO.locations,
          });
        } else {
          setHero(DEFAULT_HERO);
        }

        if (br) {
          setBrands(ensureBrands(br));
        } else {
          setBrands(DEFAULT_BRANDS);
        }

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
    try {
      await Promise.all([
        cmsPut(CMS_KEYS.hero, hero),
        cmsPut(CMS_KEYS.brands, brands),
      ]);

      setMsg({ kind: "ok", text: "Saved ✅" });
    } catch (e: any) {
      setMsg({ kind: "err", text: e?.message || "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  const updateBrand = (id: string, patch: Partial<BrandCardItem>) => {
    setBrands((prev) => ({
      items: prev.items.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  };

  const addBrand = () => {
    const it: BrandCardItem = {
      id: newId("brand"),
      key: "",
      title: "New Brand",
      desc: "",
      logoSrc: "",
      href: "",
    };
    setBrands((prev) => ({ items: [it, ...prev.items] }));
    setNewBrandId(it.id);

    setTimeout(() => {
      const el = scrollRefs.current[it.id];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const removeBrand = (id: string) => {
    setBrands((prev) => ({ items: prev.items.filter((x) => x.id !== id) }));
  };

  const moveBrand = (from: number, to: number) => {
    setBrands((prev) => {
      const next = [...prev.items];
      if (from < 0 || from >= next.length || to < 0 || to >= next.length) {
        return prev;
      }
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return { items: next };
    });
  };

  const toggleSection = (key: typeof openSection) => {
    setOpenSection((prev) => (prev === key ? null : key));
    setNewBrandId(null);
  };

  const siteLabelSafe = siteLabel || "PMG";

  if (loading) {
    return (
      <div className="cms-root">
        <div className="cms-shell">
          <div className="cms-header cms-header--fluid">
            <div className="cms-title">Admin PMG CMS: {siteLabelSafe}</div>
          </div>

          <div className="cms-loading">Loading CMS…</div>
        </div>
      </div>
    );
  }

  const heroText = Array.isArray(hero.lines) ? hero.lines.join("\n") : "";

  return (
    <div className="cms-root">
      <div className="cms-shell">
        <div className="cms-header">
          <div>
            <div className="cms-title">Admin CMS: {siteLabelSafe}</div>
            <div className="cms-subtitle">Purple Music Group</div>
          </div>

          <div className="cms-actions">
            <select
              className="cms-select"
              value={site}
              onChange={(e) => {
                const next = e.target.value;
                setSite(next as any);

                if (next === "purple-music-group") {
                  navigate(`/admin/pmg?site=${encodeURIComponent(next)}`);
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

            <button
              className="cms-btn cms-btn--primary"
              onClick={saveAll}
              disabled={saving}
              type="button"
            >
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
          <AccordionHeader
            title="Hero"
            open={openSection === "hero"}
            onToggle={() => toggleSection("hero")}
          />
          {openSection === "hero" && (
            <div className="cms-panel">
              <Field label="Hero title (H1)">
                <input
                  className="cms-input"
                  value={hero.title}
                  onChange={(e) =>
                    setHero((p) => ({
                      ...p,
                      title: e.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Hero text (full paragraph with line breaks)">
                <textarea
                  className="cms-textarea"
                  value={heroText}
                  onChange={(e) => {
                    const value = e.target.value;
                    const linesArray = value.split(/\r?\n/);
                    setHero((p) => ({
                      ...p,
                      lines: linesArray,
                    }));
                  }}
                />
              </Field>

              <Field label="Locations (cities / countries)">
                <input
                  className="cms-input"
                  value={hero.locations}
                  onChange={(e) =>
                    setHero((p) => ({
                      ...p,
                      locations: e.target.value,
                    }))
                  }
                />
              </Field>
            </div>
          )}

          <AccordionHeader
            title="Brands (PMG)"
            open={openSection === "brands"}
            onToggle={() => toggleSection("brands")}
          />
          {openSection === "brands" && (
            <div className="cms-panel">
              <div className="cms-block__head">
                <div>
                  <div className="cms-block__title">Brand cards</div>
                  <div className="cms-block__desc">
                    These map 1:1 to BrandCarousel cards on the PMG homepage
                    (key, title, description, logo, href).
                  </div>
                </div>
                <button
                  className="cms-btn cms-btn--primary"
                  onClick={addBrand}
                  type="button"
                >
                  + Add brand
                </button>
              </div>

              <div className="cms-list">
                {brands.items.map((b, i) => {
                  const isNew = newBrandId === b.id;

                  return (
                    <div
                      key={b.id}
                      ref={(el) => {
                        scrollRefs.current[b.id] = el;
                      }}
                      className={`cms-card ${isNew ? "is-new" : ""}`}
                      onAnimationEnd={() => {
                        if (isNew) setNewBrandId(null);
                      }}
                    >
                      <div className="cms-card__head">
                        <div className="cms-card__title">
                          <div className="cms-card__index">#{i + 1}</div>
                          <div className="cms-card__name">
                            {b.title || "Brand"}
                          </div>
                        </div>

                        <div className="cms-card__actions">
                          <button
                            className="cms-iconbtn"
                            disabled={i === 0}
                            onClick={() => moveBrand(i, i - 1)}
                            type="button"
                          >
                            ↑
                          </button>
                          <button
                            className="cms-iconbtn"
                            disabled={i === brands.items.length - 1}
                            onClick={() => moveBrand(i, i + 1)}
                            type="button"
                          >
                            ↓
                          </button>
                          <button
                            className="cms-btn cms-btn--danger"
                            onClick={() => removeBrand(b.id)}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="cms-card__body">
                        {b.logoSrc ? (
                          <div className="cms-logoPreview">
                            <img
                              src={b.logoSrc}
                              alt={`${b.title || b.key || "Brand"} logo preview`}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }}
                            />
                          </div>
                        ) : null}

                        <div className="cms-grid3">
                          <Field label="Key (stable identifier)">
                            <input
                              className="cms-input"
                              value={b.key}
                              onChange={(e) =>
                                updateBrand(b.id, { key: e.target.value })
                              }
                              placeholder="e.g. records / pmg / publishing"
                            />
                          </Field>
                          <Field label="Title">
                            <input
                              className="cms-input"
                              value={b.title}
                              onChange={(e) =>
                                updateBrand(b.id, { title: e.target.value })
                              }
                            />
                          </Field>
                          <Field label="Href">
                            <input
                              className="cms-input"
                              value={b.href}
                              onChange={(e) =>
                                updateBrand(b.id, { href: e.target.value })
                              }
                              placeholder="https://…"
                            />
                          </Field>
                        </div>

                        <Field label="Description">
                          <textarea
                            className="cms-textarea"
                            value={b.desc}
                            onChange={(e) =>
                              updateBrand(b.id, { desc: e.target.value })
                            }
                          />
                        </Field>

                        <div className="cms-grid2">
                          <Field label="Logo src (URL or dataURL)">
                            <input
                              className="cms-input"
                              value={b.logoSrc}
                              onChange={(e) =>
                                updateBrand(b.id, { logoSrc: e.target.value })
                              }
                              placeholder="/record.png or uploaded URL"
                            />
                          </Field>
                          <Field label="Upload logo">
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

                                  const res = await fetch(
                                    buildApiUrl(`/api/uploads/file`),
                                    {
                                      method: "POST",
                                      headers: {
                                        Authorization: `Bearer ${token}`,
                                      },
                                      body: fd,
                                    }
                                  );

                                  if (res.ok) {
                                    const data = await res.json().catch(() => null as any);
                                    const url =
                                      data?.url ||
                                      data?.path ||
                                      data?.filePath ||
                                      data?.publicUrl ||
                                      "";
                                    const normalizePublicUrl = (u: string) => {
                                    if (!u) return "";
                                  
                                    if (/^https?:\/\//i.test(u)) return u;

                                    const withSlash = u.startsWith("/") ? u : `/${u}`;
                                    return buildApiUrl(withSlash);
                                  };

                                  const publicUrl = normalizePublicUrl(url);
                                  if (publicUrl) updateBrand(b.id, { logoSrc: publicUrl });
                                  }
                                } catch {
                                  
                                }
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
