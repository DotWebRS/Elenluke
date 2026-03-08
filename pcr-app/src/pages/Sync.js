import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/pages/Sync.tsx
import { useEffect, useMemo, useState } from "react";
import Container from "react-bootstrap/Container";
const DEFAULT_SYNC = {
    h1: "Sync Made Simple. Music Made Powerful.",
    t1: "We connect your music to film, TV, ads, games, and digital content with smooth clearance and transparent licensing.",
    h2: "Where Music meets Global impact.",
    t2: "Worldwide rights administration and strategic placements that grow your catalog and revenue.",
    h3: "Where premium sound meets viral energy.",
    t3: "From trending digital sounds to bespoke compositions—built for your audience and your brief.",
};
const REMOTE_API_BASE = "https://cms.purplemusicgroup.com";
const REMOTE_SITE_KEY = "purple-crunch-publishing";
const CMS_KEY = "home.syncText";
function safeParseJson(raw, fallback) {
    try {
        if (raw == null)
            return fallback;
        if (typeof raw === "string")
            return JSON.parse(raw);
        return raw;
    }
    catch {
        return fallback;
    }
}
function buildUrl(baseUrl, path) {
    const base = String(baseUrl || "").replace(/\/+$/, "");
    const p = String(path || "").replace(/^\/+/, "");
    return base ? `${base}/${p}` : `/${p}`;
}
async function cmsGet(apiBase, siteKey, key, signal) {
    const ts = Date.now();
    const url = buildUrl(apiBase, `/api/cms?siteKey=${encodeURIComponent(siteKey)}&key=${encodeURIComponent(key)}&ts=${ts}`);
    return fetch(url, {
        signal,
        cache: "no-store",
        headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
        },
    });
}
function txt(v) {
    return String(v ?? "").trim();
}
export default function Sync({ isActive = true }) {
    const [phase, setPhase] = useState("in");
    const [syncText, setSyncText] = useState(DEFAULT_SYNC);
    const [openMobile, setOpenMobile] = useState("card1");
    useEffect(() => {
        setPhase(isActive ? "in" : "out");
    }, [isActive]);
    // reset accordion when page becomes active (optional, but feels good)
    useEffect(() => {
        if (isActive)
            setOpenMobile("card1");
    }, [isActive]);
    useEffect(() => {
        let alive = true;
        const controller = new AbortController();
        (async () => {
            try {
                const res = await cmsGet(REMOTE_API_BASE, REMOTE_SITE_KEY, CMS_KEY, controller.signal);
                if (!alive)
                    return;
                if (res.status === 404 || !res.ok) {
                    setSyncText(DEFAULT_SYNC);
                    return;
                }
                const payload = await res.json().catch(() => null);
                const parsed = safeParseJson(payload?.json, DEFAULT_SYNC);
                const next = {
                    h1: txt(parsed?.h1) || DEFAULT_SYNC.h1,
                    t1: txt(parsed?.t1) || DEFAULT_SYNC.t1,
                    h2: txt(parsed?.h2) || DEFAULT_SYNC.h2,
                    t2: txt(parsed?.t2) || DEFAULT_SYNC.t2,
                    h3: txt(parsed?.h3) || DEFAULT_SYNC.h3,
                    t3: txt(parsed?.t3) || DEFAULT_SYNC.t3,
                };
                if (!alive)
                    return;
                setSyncText(next);
            }
            catch {
                if (!alive)
                    return;
                setSyncText(DEFAULT_SYNC);
            }
        })();
        return () => {
            alive = false;
            controller.abort();
        };
    }, []);
    const cls = "page " +
        (phase === "in"
            ? "animate__animated animate__slideInRight"
            : "animate__animated animate__slideOutLeft");
    const card1Paras = useMemo(() => {
        // u prvoj kartici hoces 3 pasusa: t1, t2, t3
        return [syncText.t1, syncText.t2, syncText.t3].map((s) => txt(s)).filter(Boolean);
    }, [syncText.t1, syncText.t2, syncText.t3]);
    const toggleMobile = (k) => {
        setOpenMobile((cur) => (cur === k ? cur : k)); // "zatvorene" = uvek jedna otvorena
    };
    const renderMobileCard = (k, title, body) => {
        const isOpen = openMobile === k;
        return (_jsxs("article", { className: `syncMCard ${isOpen ? "is-open" : ""}`, children: [_jsxs("button", { type: "button", className: "syncMHead", onClick: () => toggleMobile(k), "aria-expanded": isOpen, children: [_jsx("div", { className: "syncMTitle", children: title }), _jsxs("span", { className: `syncMPlus ${isOpen ? "is-open" : ""}`, "aria-hidden": "true", children: [_jsx("span", {}), _jsx("span", {})] })] }), _jsx("div", { className: "syncMBodyWrap", style: { maxHeight: isOpen ? 560 : 0 }, children: _jsx("div", { className: "syncMBody", children: body }) })] }));
    };
    return (_jsxs("section", { className: cls, style: { animationDuration: "650ms" }, id: "sync", children: [_jsx("div", { className: "about-bg", "aria-hidden": "true" }), _jsx("div", { className: "about-content syncPage", children: _jsxs(Container, { className: "syncFluid", children: [_jsx("div", { className: "syncHead", children: _jsxs("h2", { className: "about-title about-title-centered syncTitle", children: [_jsx("span", { className: "syncTitleWhite", children: "SYNC" }), " ", _jsx("span", { className: "about-us-animated", children: "LICENCING" })] }) }), _jsxs("div", { className: "syncSplit", children: [_jsx("div", { className: "syncLeftCol", children: _jsxs("article", { className: "syncCard syncCardLeftTall", children: [_jsx("h3", { className: "syncCardTitle", children: syncText.h1 }), _jsx("div", { className: "syncCardBody", children: card1Paras.map((p, i) => (_jsx("p", { className: `syncCardText ${i === card1Paras.length - 1 ? "syncCardTextLast" : ""}`, children: p }, i))) })] }) }), _jsxs("div", { className: "syncRightCol", children: [_jsxs("article", { className: "syncCard syncRightTop", children: [_jsx("h3", { className: "syncCardTitle", children: syncText.h2 }), _jsx("p", { className: "syncCardText syncCardTextLast", children: syncText.t2 })] }), _jsxs("article", { className: "syncCard syncRightBottom", children: [_jsx("p", { className: "syncKicker", children: "Commercial Music Licensing" }), _jsx("h3", { className: "syncCardTitle", children: syncText.h3 }), _jsx("p", { className: "syncCardText syncCardTextLast syncClamp", children: syncText.t3 })] })] })] }), _jsxs("div", { className: "syncMobile", children: [renderMobileCard("card1", _jsx("h3", { className: "syncCardTitle syncCardTitle--mobile", children: syncText.h1 }), _jsx(_Fragment, { children: card1Paras.map((p, i) => (_jsx("p", { className: "syncCardText", style: { marginBottom: i === card1Paras.length - 1 ? 0 : 10 }, children: p }, i))) })), renderMobileCard("card2", _jsx("h3", { className: "syncCardTitle syncCardTitle--mobile", children: syncText.h2 }), _jsx("p", { className: "syncCardText", style: { marginBottom: 0 }, children: syncText.t2 })), renderMobileCard("card3", _jsxs(_Fragment, { children: [_jsx("p", { className: "syncKicker", style: { marginBottom: 8 }, children: "Commercial Music Licensing" }), _jsx("h3", { className: "syncCardTitle syncCardTitle--mobile", style: { marginBottom: 0 }, children: syncText.h3 })] }), _jsx("p", { className: "syncCardText", style: { marginBottom: 0 }, children: syncText.t3 }))] })] }) })] }));
}
