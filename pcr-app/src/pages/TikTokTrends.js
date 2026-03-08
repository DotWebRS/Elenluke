import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { buildApiUrl } from "../config/apiBase";
const CMS_SITE_KEY = "purple-crunch-records";
const CMS_KEY_TIKTOK = "pcr.tiktok.items";
const DEFAULT_VIDEOS = [
    "https://www.tiktok.com/@rntyler/video/7496960131242970373?_r=1&_t=ZG-93gu7pmtNs8",
    "https://www.tiktok.com/@championsleague/video/7564775226530221334?_r=1&_t=ZG-93gu2pqMZn7",
    "https://www.tiktok.com/@looooooooch/video/7479530147931032840?_r=1&_t=ZG-93gtAcWTGMq",
];
function safeJsonParse(value, fallback) {
    try {
        if (!value)
            return fallback;
        if (typeof value === "string")
            return JSON.parse(value);
        return value;
    }
    catch {
        return fallback;
    }
}
function getTikTokId(url) {
    const m = String(url || "").match(/\/video\/(\d+)/);
    return m?.[1] ?? "";
}
function normalizeVideos(payload) {
    const parsed = safeJsonParse(payload, { items: [] });
    const urls = (parsed.items || [])
        .map((x) => String(x?.url ?? "").trim())
        .filter(Boolean)
        .slice(0, 3);
    return urls.length ? urls : DEFAULT_VIDEOS;
}
export default function TikTokTrends({ isActive = true }) {
    const [videos, setVideos] = useState(DEFAULT_VIDEOS);
    useEffect(() => {
        let alive = true;
        const load = async () => {
            try {
                const url = buildApiUrl(`/api/cms?siteKey=${encodeURIComponent(CMS_SITE_KEY)}&key=${encodeURIComponent(CMS_KEY_TIKTOK)}&ts=${Date.now()}`);
                const res = await fetch(url);
                if (res.status === 404)
                    return;
                const text = await res.text().catch(() => "");
                if (!res.ok)
                    return;
                const dto = safeJsonParse(text, {});
                const next = normalizeVideos(dto?.json);
                if (alive && next.length)
                    setVideos(next);
            }
            catch {
                //
            }
        };
        load();
        return () => {
            alive = false;
        };
    }, []);
    const list = useMemo(() => (videos.length ? videos : DEFAULT_VIDEOS), [videos]);
    return (_jsx("section", { id: "tiktok-trends", "aria-hidden": !isActive, children: _jsxs("div", { className: "ttr-wrap", children: [_jsxs("h2", { className: "about-title ttr-title", children: [_jsx("span", { className: "about-title-light", children: "TIKTOK" }), " ", _jsx("span", { className: "about-title-grad", children: "TRENDS" })] }), _jsx("div", { className: "ttr-row", children: list.map((url) => {
                        const id = getTikTokId(url);
                        const embedSrc = id ? `https://www.tiktok.com/embed/v2/${id}` : url;
                        return (_jsxs("a", { className: "ttr-card", href: url, target: "_blank", rel: "noreferrer", "aria-label": "Open on TikTok", children: [_jsx("div", { className: "ttr-embed", "aria-hidden": "true", children: _jsx("iframe", { src: embedSrc, title: "TikTok video", scrolling: "no", allow: "encrypted-media; picture-in-picture", referrerPolicy: "strict-origin-when-cross-origin" }) }), _jsx("div", { className: "ttr-foot", children: _jsx("span", { className: "ttr-openLink", children: "Open on TikTok" }) })] }, url));
                    }) })] }) }));
}
