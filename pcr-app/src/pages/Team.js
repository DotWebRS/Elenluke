import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { buildApiUrl } from "../config/apiBase";
const CMS_SITE_KEY = "purple-crunch-records";
const CMS_KEY_TEAM = "pcr.team.text";
function safeJsonParse(value, fallback) {
    try {
        if (value == null || value === "")
            return fallback;
        if (typeof value === "string")
            return JSON.parse(value);
        return value;
    }
    catch {
        return fallback;
    }
}
function normalizeEscapes(text) {
    const s = String(text ?? "");
    return s
        .replace(/\\r\\n/g, "\n")
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\n")
        .replace(/\\t/g, "  ");
}
function splitToParagraphs(text) {
    return String(text || "")
        .split(/\n\s*\n/g)
        .map((p) => p.trim())
        .filter(Boolean);
}
function extractText(payload) {
    // payload može biti:
    // - string (sa \n ili \\n)
    // - JSON string (stringifikovan)
    // - objekat { text: "..." } / { value: "..." } / slično
    if (payload == null)
        return "";
    if (typeof payload === "string") {
        // probaj da parsiraš ako je JSON-string
        const maybeParsed = safeJsonParse(payload, null);
        if (typeof maybeParsed === "string")
            return maybeParsed;
        if (typeof maybeParsed?.text === "string")
            return maybeParsed.text;
        if (typeof maybeParsed?.value === "string")
            return maybeParsed.value;
        return payload;
    }
    if (typeof payload?.text === "string")
        return payload.text;
    if (typeof payload?.value === "string")
        return payload.value;
    // last resort
    return String(payload);
}
export default function Team({ isActive = true }) {
    const [phase, setPhase] = useState("in");
    const [teamText, setTeamText] = useState("");
    useEffect(() => {
        setPhase(isActive ? "in" : "out");
    }, [isActive]);
    useEffect(() => {
        let alive = true;
        const controller = new AbortController();
        (async () => {
            try {
                const url = buildApiUrl(`/api/cms?siteKey=${encodeURIComponent(CMS_SITE_KEY)}&key=${encodeURIComponent(CMS_KEY_TEAM)}&ts=${Date.now()}`);
                const res = await fetch(url, {
                    signal: controller.signal,
                    headers: {
                        Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
                        "Cache-Control": "no-cache",
                        Pragma: "no-cache",
                    },
                    cache: "no-store",
                });
                if (!alive)
                    return;
                if (res.status === 404) {
                    setTeamText("");
                    return;
                }
                if (!res.ok) {
                    setTeamText("");
                    return;
                }
                const raw = await res.text().catch(() => "");
                if (!alive)
                    return;
                const dto = safeJsonParse(raw, {});
                const extracted = extractText(dto?.json);
                const cleaned = normalizeEscapes(extracted).trim();
                setTeamText(cleaned);
            }
            catch {
                if (!alive)
                    return;
                setTeamText("");
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
    const paragraphs = splitToParagraphs(normalizeEscapes(teamText));
    // ako nema teksta iz baze, ne renderuj telo (nema “\n” problem, nema jump)
    return (_jsxs("section", { className: cls, style: { animationDuration: "650ms" }, id: "team", children: [_jsx("div", { className: "about-bg", "aria-hidden": "true" }), _jsxs("div", { className: "about-content", children: [_jsxs("h2", { className: "about-title", children: [_jsx("span", { className: "about-title-light", children: "OUR" }), " ", _jsx("span", { className: "about-title-grad", children: "TEAM" })] }), paragraphs.length > 0 && (_jsx("div", { className: "about-body", children: paragraphs.map((p, i) => (_jsx("p", { children: p }, i))) }))] })] }));
}
