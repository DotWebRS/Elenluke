import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/pages/ReleasesAndTrendsFullPage.tsx
import { useEffect, useMemo, useState } from "react";
import ReleasesFooterBar from "../components/ReleasesFooterBar";
import { buildApiUrl } from "../config/apiBase";
// -------------------- CMS --------------------
const CMS_SITE_KEY = "purple-crunch-records";
const CMS_KEY_RELEASES_HUB = "pcr.releasesHub.items";
function safeJsonParse(raw, fallback) {
    try {
        if (!raw)
            return fallback;
        if (typeof raw === "string")
            return JSON.parse(raw);
        return raw;
    }
    catch {
        return fallback;
    }
}
function ensureItems(payload) {
    const items = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
    return items
        .map((x) => ({
        id: String(x?.id ?? "").trim() || `rh_${Math.random().toString(16).slice(2)}_${Date.now()}`,
        imageSrc: String(x?.imageSrc ?? "").trim(),
        artist: String(x?.artist ?? "").trim(),
        title: String(x?.title ?? "").trim(),
        dateISO: String(x?.dateISO ?? "").trim(),
        platformLabel: String(x?.platformLabel ?? "").trim() || undefined,
        url: String(x?.url ?? "").trim() || undefined,
    }))
        .filter((x) => x.artist || x.title || x.imageSrc || x.dateISO || x.url);
}
// -------------------- DATE HELPERS --------------------
function isoToDate(iso) {
    const [y, m, d] = String(iso || "")
        .split("-")
        .map((x) => parseInt(x, 10));
    return new Date(y || 1970, (m || 1) - 1, d || 1, 12, 0, 0);
}
// format: DD MMM YYYY
function formatDateShort(iso) {
    const dt = isoToDate(iso);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dd = String(dt.getDate()).padStart(2, "0");
    const m = months[dt.getMonth()] || "—";
    return `${dd} ${m} ${dt.getFullYear()}`;
}
function isUpcoming(iso) {
    const now = new Date();
    const dt = isoToDate(iso);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    return dt.getTime() > today.getTime();
}
function sortDescByDate(a, b) {
    return isoToDate(b.dateISO).getTime() - isoToDate(a.dateISO).getTime();
}
function sortAscByDate(a, b) {
    return isoToDate(a.dateISO).getTime() - isoToDate(b.dateISO).getTime();
}
// -------------------- SPOTIFY EMBED HELPERS --------------------
function getSpotifyEmbedSrc(url) {
    if (!url)
        return null;
    const m = url.match(/open\.spotify\.com\/(track|album|playlist|episode|show)\/([A-Za-z0-9]+)/i);
    if (!m)
        return null;
    const type = m[1].toLowerCase();
    const id = m[2];
    return `https://open.spotify.com/embed/${type}/${id}`;
}
export default function ReleasesAndTrendsFullPage({ isActive = true }) {
    const [phase, setPhase] = useState("in");
    const [filter, setFilter] = useState("latest");
    const [query, setQuery] = useState("");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => setPhase(isActive ? "in" : "out"), [isActive]);
    useEffect(() => {
        let alive = true;
        const load = async () => {
            try {
                setLoading(true);
                const url = buildApiUrl(`/api/cms?siteKey=${encodeURIComponent(CMS_SITE_KEY)}&key=${encodeURIComponent(CMS_KEY_RELEASES_HUB)}&ts=${Date.now()}`);
                const res = await fetch(url);
                if (res.status === 404) {
                    if (alive)
                        setItems([]);
                    return;
                }
                const text = await res.text().catch(() => "");
                if (!res.ok) {
                    if (alive)
                        setItems([]);
                    return;
                }
                const dto = safeJsonParse(text, {});
                const payload = dto?.json;
                const parsed = safeJsonParse(payload, payload);
                const nextItems = ensureItems(parsed);
                if (alive)
                    setItems(nextItems);
            }
            catch {
                if (alive)
                    setItems([]);
            }
            finally {
                if (alive)
                    setLoading(false);
            }
        };
        load();
        return () => {
            alive = false;
        };
    }, []);
    const cls = "page " +
        (phase === "in"
            ? "animate__animated animate__slideInRight"
            : "animate__animated animate__slideOutLeft");
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        let base = [...items];
        if (filter === "upcoming") {
            base = base.filter((x) => x.dateISO && isUpcoming(x.dateISO)).sort(sortAscByDate);
        }
        else if (filter === "latest") {
            base = base.sort(sortDescByDate);
        }
        else {
            base = base.sort(sortDescByDate);
        }
        if (q) {
            base = base.filter((x) => {
                const a = (x.artist || "").toLowerCase();
                const t = (x.title || "").toLowerCase();
                const d = (x.dateISO || "").toLowerCase();
                return a.includes(q) || t.includes(q) || d.includes(q);
            });
        }
        return base;
    }, [filter, query, items]);
    return (_jsxs(_Fragment, { children: [_jsxs("section", { className: cls, style: { animationDuration: "650ms" }, id: "releases-trends-full", children: [_jsx("div", { className: "rtFull-bg", "aria-hidden": "true" }), _jsx("div", { className: "rtFull-content", children: _jsxs("div", { className: "rtFull-inner", children: [_jsxs("header", { className: "rtFull-head", children: [_jsxs("h2", { className: "rtFull-title", children: [_jsx("span", { className: "rtFull-titleLight", children: "RELEASES" }), " ", _jsx("span", { className: "rtFull-titleGrad", children: "HUB" })] }), _jsxs("div", { className: "rtFull-controls", role: "region", "aria-label": "Filters", children: [_jsxs("div", { className: "rtEq", role: "tablist", "aria-label": "Release filter", children: [_jsxs("button", { type: "button", className: ["rtEq-btn", filter === "latest" ? "is-active" : ""].join(" "), onClick: () => setFilter("latest"), role: "tab", "aria-selected": filter === "latest", children: [_jsxs("span", { className: "rtEq-bars", "aria-hidden": "true", children: [_jsx("i", {}), _jsx("i", {}), _jsx("i", {}), _jsx("i", {})] }), "Latest"] }), _jsxs("button", { type: "button", className: ["rtEq-btn", filter === "upcoming" ? "is-active" : ""].join(" "), onClick: () => setFilter("upcoming"), role: "tab", "aria-selected": filter === "upcoming", children: [_jsxs("span", { className: "rtEq-bars", "aria-hidden": "true", children: [_jsx("i", {}), _jsx("i", {}), _jsx("i", {}), _jsx("i", {})] }), "Upcoming"] }), _jsxs("button", { type: "button", className: ["rtEq-btn", filter === "all" ? "is-active" : ""].join(" "), onClick: () => setFilter("all"), role: "tab", "aria-selected": filter === "all", children: [_jsxs("span", { className: "rtEq-bars", "aria-hidden": "true", children: [_jsx("i", {}), _jsx("i", {}), _jsx("i", {}), _jsx("i", {})] }), "All"] })] }), _jsx("div", { className: "rtFull-search", children: _jsx("input", { className: "rtFull-input", value: query, onChange: (e) => setQuery(e.target.value), placeholder: "Search artist, title, date\u2026", "aria-label": "Search releases" }) })] })] }), _jsxs("div", { className: "rtFull-grid", role: "list", "aria-label": "Releases list", children: [!loading && filtered.length === 0 ? _jsx("div", { className: "rtFull-empty", children: "No items yet." }) : null, filtered.map((it) => {
                                            const embedSrc = getSpotifyEmbedSrc(it.url);
                                            return (_jsxs("article", { className: "rtFull-card", role: "listitem", children: [_jsxs("a", { className: "rtFull-media", href: it.url || "#", target: it.url ? "_blank" : undefined, rel: it.url ? "noreferrer" : undefined, style: { ["--bg"]: `url("${it.imageSrc}")` }, "aria-label": `${it.artist} - ${it.title}`, children: [_jsx("div", { className: "rtFull-bgImg", "aria-hidden": "true" }), _jsx("div", { className: "rtFull-gloss", "aria-hidden": "true" })] }), _jsxs("div", { className: "rtFull-info", children: [_jsxs("div", { className: "rtFull-meta", children: [_jsx("div", { className: "rtFull-artist", children: it.artist }), _jsx("div", { className: "rtFull-name", children: it.title })] }), _jsxs("div", { className: "rtFull-row", children: [_jsxs("div", { className: "rtFull-date", children: [_jsx("span", { className: "rtFull-pill", children: it.dateISO && isUpcoming(it.dateISO) ? "UPCOMING" : "RELEASED" }), _jsx("span", { className: "rtFull-dateTxt", children: it.dateISO ? formatDateShort(it.dateISO) : "—" })] }), _jsxs("a", { className: "rtFull-link", href: it.url || "#", target: "_blank", rel: "noreferrer", children: [_jsx("span", { className: "rtFull-linkTxt", children: "Open on" }), _jsx("span", { className: "rtFull-spotifyMark", "aria-label": "Spotify", children: _jsx("svg", { viewBox: "0 0 24 24", width: "18", height: "18", "aria-hidden": "true", children: _jsx("path", { fill: "currentColor", d: "M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Zm4.589 14.507a.75.75 0 0 1-1.032.247c-2.828-1.73-6.39-2.122-10.59-1.164a.75.75 0 1 1-.333-1.463c4.61-1.05 8.56-.6 11.706 1.323a.75.75 0 0 1 .249 1.057Zm1.474-3.276a.9.9 0 0 1-1.238.297c-3.238-1.99-8.172-2.567-11.995-1.405a.9.9 0 0 1-.523-1.722c4.369-1.328 9.79-.684 13.46 1.57a.9.9 0 0 1 .296 1.26Zm.127-3.412C14.34 7.49 8.01 7.276 4.69 8.29a1.05 1.05 0 0 1-.61-2.009c3.84-1.173 10.79-.92 15.36 1.8a1.05 1.05 0 0 1-1.08 1.738Z" }) }) })] })] })] }), embedSrc ? (_jsx("div", { className: "rtFull-strip", "aria-label": "Player", children: _jsx("iframe", { className: "rtFull-stripFrame", src: embedSrc, width: "100%", height: "80", allow: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture", loading: "lazy", title: `${it.artist} - ${it.title} player` }) })) : null] }, it.id));
                                        })] }), _jsx("footer", { className: "rtFull-foot", children: _jsx("div", { className: "rtFull-count", children: loading ? "Loading…" : `${filtered.length} items` }) })] }) }), _jsx("style", { children: `
          .rtFull-strip{
            width:100%;
            margin-top:12px;
            overflow:hidden;
          }
          .rtFull-stripFrame{
            display:block;
            width:100%;
            height:80px;
            border:0;
            filter: grayscale(1) saturate(0) contrast(1.08) brightness(0.95);
          }
          
         


        ` })] }), _jsx(ReleasesFooterBar, {})] }));
}
