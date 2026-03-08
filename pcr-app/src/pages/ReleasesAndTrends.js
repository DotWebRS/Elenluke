import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/ReleasesAndTrends.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { buildApiUrl } from "../config/apiBase";
// CMS
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
function ensureHubItems(payload) {
    const arr = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
    return arr
        .map((x) => ({
        id: String(x?.id ?? "").trim() || `rh_${Math.random().toString(16).slice(2)}_${Date.now()}`,
        imageSrc: String(x?.imageSrc ?? "").trim(),
        artist: String(x?.artist ?? "").trim(),
        title: String(x?.title ?? "").trim(),
        dateISO: String(x?.dateISO ?? "").trim(),
        platformLabel: String(x?.platformLabel ?? "").trim() || undefined,
        url: String(x?.url ?? "").trim() || undefined,
    }))
        .filter((x) => x.imageSrc || x.artist || x.title || x.url || x.dateISO);
}
function isoToDate(iso) {
    const [y, m, d] = String(iso || "")
        .split("-")
        .map((n) => parseInt(n, 10));
    return new Date(y || 1970, (m || 1) - 1, d || 1, 12, 0, 0);
}
function sortDescByDate(a, b) {
    return isoToDate(b.dateISO).getTime() - isoToDate(a.dateISO).getTime();
}
export default function ReleasesAndTrends({ isActive = true }) {
    const [phase, setPhase] = useState("in");
    useEffect(() => setPhase(isActive ? "in" : "out"), [isActive]);
    const cls = "page " +
        (phase === "in"
            ? "animate__animated animate__slideInRight"
            : "animate__animated animate__slideOutLeft");
    const [hubItems, setHubItems] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        let alive = true;
        const load = async () => {
            try {
                setLoading(true);
                const url = buildApiUrl(`/api/cms?siteKey=${encodeURIComponent(CMS_SITE_KEY)}&key=${encodeURIComponent(CMS_KEY_RELEASES_HUB)}&ts=${Date.now()}`);
                const res = await fetch(url);
                if (res.status === 404) {
                    if (alive)
                        setHubItems([]);
                    return;
                }
                const text = await res.text().catch(() => "");
                if (!res.ok) {
                    if (alive)
                        setHubItems([]);
                    return;
                }
                const dto = safeJsonParse(text, {});
                const parsed = safeJsonParse(dto?.json, dto?.json);
                const items = ensureHubItems(parsed);
                if (alive)
                    setHubItems(items);
            }
            catch {
                if (alive)
                    setHubItems([]);
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
    const cards = useMemo(() => {
        const base = [...hubItems].sort(sortDescByDate);
        return base.slice(0, 9).map((x) => ({
            id: x.id,
            imageSrc: x.imageSrc,
            tiktokArtist: x.artist || "",
            trackName: x.title || "",
            trackUrl: x.url || "#",
        }));
    }, [hubItems]);
    const count = cards.length;
    return (_jsxs("section", { className: cls, style: { animationDuration: "650ms" }, id: "releases-trends", children: [_jsx("div", { className: "rt-bg", "aria-hidden": "true" }), _jsx("div", { className: "rt-content", children: _jsxs("div", { className: "rt-stack", children: [_jsxs("h2", { className: "rt-title", children: [_jsx("span", { className: "rt-title-light", children: "RELEASES AND" }), " ", _jsx("span", { className: "rt-title-grad", children: "TRENDS" })] }), _jsx("div", { className: "rt-carousel-wrap", children: _jsx("div", { className: "rt-entire", children: _jsxs("div", { className: "rt-carrousel", style: { ["--count"]: count }, "aria-label": "3D carousel", children: [cards.map((it, idx) => (_jsxs("figure", { className: "rt-fig rt-shadow", style: { ["--i"]: idx, ["--bg"]: `url("${it.imageSrc}")` }, children: [_jsxs("div", { className: "rt-cardMedia", "aria-hidden": "true", children: [_jsx("div", { className: "rt-cardBg" }), _jsx("div", { className: "rt-cardOverlay" })] }), _jsxs("div", { className: "rt-cardInfo", children: [_jsxs("div", { className: "rt-meta", children: [_jsx("div", { className: "rt-ttArtist", children: it.tiktokArtist }), _jsx("div", { className: "rt-trackName", children: it.trackName })] }), _jsx("a", { className: "rt-openSpotify", href: it.trackUrl || "#", target: it.trackUrl && it.trackUrl !== "#" ? "_blank" : undefined, rel: it.trackUrl && it.trackUrl !== "#" ? "noreferrer" : undefined, children: "Open in Spotify" })] })] }, `${it.id}_${idx}`))), !loading && cards.length === 0 ? null : null] }) }) }), _jsx("div", { className: "rt-footer", children: _jsx(Link, { className: "rt-seeAll", to: "/releases-trends", children: "SEE ALL RELEASES" }) })] }) })] }));
}
