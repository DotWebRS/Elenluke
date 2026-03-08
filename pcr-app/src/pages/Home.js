import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "../config/apiBase";
const CMS_SITE_KEY = "purple-crunch-records";
const CMS_KEY_HERO = "pcr.home.hero";
const DEFAULT_HERO = {
    titleLight: "LET'S BE",
    rotateWords: ["TIMELESS", "UNIGNORABLE"],
    subLines: ["YOUR SOUND. YOUR VISION. AMPLIFIED.", "MUSIC THAT DEFINES THE DIGITAL GENERATION"],
    buttons: {
        primaryLabel: "Submit Demo",
        primaryHref: "/contact?type=DemoUpload",
        secondaryLabel: "Playlist Pitch",
        secondaryScrollTo: "contact?type=PlaylistPitch",
    },
};
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
function useTypeRotate(words, speed = 70, holdMs = 1000, eraseMs = 24) {
    const list = useMemo(() => (words?.length ? words : ["TIMELESS"]), [words]);
    const [wordIndex, setWordIndex] = useState(0);
    const [typed, setTyped] = useState("");
    const [mode, setMode] = useState("typing");
    useEffect(() => {
        setWordIndex(0);
        setTyped("");
        setMode("typing");
    }, [list.join("|")]);
    useEffect(() => {
        const full = list[wordIndex] || "";
        let t;
        if (mode === "typing") {
            if (typed.length < full.length)
                t = window.setTimeout(() => setTyped(full.slice(0, typed.length + 1)), speed);
            else
                setMode("holding");
        }
        else if (mode === "holding") {
            t = window.setTimeout(() => setMode("erasing"), holdMs);
        }
        else {
            if (typed.length > 0)
                t = window.setTimeout(() => setTyped(full.slice(0, typed.length - 1)), eraseMs);
            else {
                setMode("typing");
                setWordIndex((p) => (p + 1) % list.length);
            }
        }
        return () => {
            if (t)
                window.clearTimeout(t);
        };
    }, [typed, mode, wordIndex, list, speed, holdMs, eraseMs]);
    return typed;
}
function normalizeHeroFromCms(payload) {
    // if CMS still sends old "/submitform", force to /contact demo
    const primaryHrefRaw = String(payload?.buttons?.primaryHref ?? DEFAULT_HERO.buttons.primaryHref);
    const primaryHref = primaryHrefRaw === "/submitform" || primaryHrefRaw === "/submit" ? "/contact?type=DemoUpload" : primaryHrefRaw;
    // if CMS sends old secondaryScrollTo (spotify-playlist), force playlist contact
    const secondaryScrollToRaw = String(payload?.buttons?.secondaryScrollTo ?? DEFAULT_HERO.buttons.secondaryScrollTo);
    const secondaryScrollTo = secondaryScrollToRaw === "spotify-playlist" || secondaryScrollToRaw === "playlist"
        ? "contact?type=PlaylistPitch"
        : secondaryScrollToRaw;
    return {
        titleLight: String(payload?.titleLight ?? DEFAULT_HERO.titleLight),
        rotateWords: Array.isArray(payload?.rotateWords) && payload.rotateWords.length ? payload.rotateWords : DEFAULT_HERO.rotateWords,
        subLines: Array.isArray(payload?.subLines) && payload.subLines.length ? payload.subLines : DEFAULT_HERO.subLines,
        buttons: {
            primaryLabel: String(DEFAULT_HERO.buttons.primaryLabel),
            primaryHref,
            secondaryLabel: String(DEFAULT_HERO.buttons.secondaryLabel),
            secondaryScrollTo,
        },
    };
}
export default function Home({ isActive = true }) {
    const navigate = useNavigate();
    const [phase, setPhase] = useState("in");
    const [hero, setHero] = useState(DEFAULT_HERO);
    useEffect(() => {
        setPhase(isActive ? "in" : "out");
    }, [isActive]);
    useEffect(() => {
        let alive = true;
        const load = async () => {
            try {
                const url = buildApiUrl(`/api/cms?siteKey=${encodeURIComponent(CMS_SITE_KEY)}&key=${encodeURIComponent(CMS_KEY_HERO)}&ts=${Date.now()}`);
                const res = await fetch(url);
                if (res.status === 404)
                    return;
                const text = await res.text().catch(() => "");
                if (!res.ok)
                    return;
                const dto = safeJsonParse(text, {});
                const payload = safeJsonParse(dto?.json, DEFAULT_HERO);
                const normalized = normalizeHeroFromCms(payload);
                if (alive)
                    setHero(normalized);
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
    const typed = useTypeRotate(hero.rotateWords, 70, 1000, 24);
    const cls = "page " +
        (phase === "in"
            ? "animate__animated animate__slideInRight"
            : "animate__animated animate__slideOutLeft");
    const goContact = (type) => {
        navigate(`/contact?type=${encodeURIComponent(type)}`);
    };
    return (_jsxs("section", { className: cls, style: { animationDuration: "650ms" }, id: "hero", children: [_jsx("div", { className: "hero-bg", "aria-hidden": "true" }), _jsxs("div", { className: "hero-content hero-content--lower", children: [_jsx("h1", { className: "hero-title", children: _jsxs("span", { className: "hero-title-line", children: [_jsx("span", { className: "hero-title-light", children: hero.titleLight }), " ", _jsx("span", { className: "hero-title-bold", children: _jsx("span", { className: "typeword", children: typed }) })] }) }), _jsx("p", { className: "hero-sub", children: (hero.subLines?.length ? hero.subLines : DEFAULT_HERO.subLines).map((line, i) => (_jsx("span", { children: line }, i))) }), _jsxs("div", { className: "hero-actions", children: [_jsx("button", { type: "button", className: "hero-btn hero-btn-primary", onClick: () => goContact("DemoUpload"), children: hero.buttons.primaryLabel }), _jsxs("button", { type: "button", className: "hero-btn hero-btn-spotify", onClick: () => goContact("PlaylistPitch"), "aria-label": "Open contact form (playlisting)", children: [_jsx("span", { className: "spotify-ico", "aria-hidden": "true", children: _jsx("svg", { viewBox: "0 0 24 24", width: "18", height: "18", children: _jsx("path", { fill: "currentColor", d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.58 14.36c-.2.33-.63.43-.96.23-2.62-1.6-5.92-1.96-9.82-1.08-.38.09-.76-.15-.85-.53-.09-.38.15-.76.53-.85 4.27-.97 7.94-.55 10.9 1.26.33.2.43.63.23.97zm1.37-3.05c-.25.41-.78.54-1.19.29-3-1.84-7.57-2.37-11.11-1.3-.46.14-.95-.12-1.09-.58-.14-.46.12-.95.58-1.09 4.05-1.23 9.1-.63 12.56 1.49.41.25.54.78.25 1.19zm.12-3.18c-3.6-2.14-9.55-2.34-13-1.29-.55.17-1.14-.14-1.31-.7-.17-.55.14-1.14.7-1.31 3.96-1.2 10.55-.97 14.7 1.5.5.3.66.96.36 1.46-.3.5-.96.66-1.46.36z" }) }) }), hero.buttons.secondaryLabel] })] })] })] }));
}
