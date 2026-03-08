import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/App.tsx
import { useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThreeLogo } from "./components/ThreeLogo";
import BottomNav from "./components/BottomNav";
import Home from "./pages/Home";
import About from "./pages/About";
import ReleasesAndTrends from "./pages/ReleasesAndTrends";
import TikTokTrends from "./pages/TikTokTrends";
import Partners from "./pages/Partners";
import Sync from "./pages/Sync";
import Services from "./pages/Services";
import Team from "./pages/Team";
import Footer from "./pages/Footer";
import Cookies from "./components/Cookies";
import Privacy from "./components/PrivacyPolicy";
import Terms from "./components/TermsOfUse";
import Impressum from "./components/Impressum";
import ReleasesAndTrendsPage from "./pages/ReleasesAndTrendsPage";
import PcrContactForm from "./pages/ContactPCR";
import ArtistInformationSubmission from "./pages/ArtistInformationSubmission";
export default function App() {
    const location = useLocation();
    const isStandalone = location.pathname === "/cookies" ||
        location.pathname === "/privacy" ||
        location.pathname === "/terms" ||
        location.pathname === "/impressum" ||
        location.pathname === "/releases-trends" ||
        location.pathname === "/contact" ||
        location.pathname === "/artist-information";
    if (isStandalone) {
        return (_jsxs(_Fragment, { children: [_jsx(BottomNav, {}), _jsx(ThreeLogo, {}), _jsx("div", { className: "global-fade", "aria-hidden": "true" }), _jsxs(Routes, { children: [_jsx(Route, { path: "/cookies", element: _jsx(Cookies, {}) }), _jsx(Route, { path: "/privacy", element: _jsx(Privacy, {}) }), _jsx(Route, { path: "/terms", element: _jsx(Terms, {}) }), _jsx(Route, { path: "/impressum", element: _jsx(Impressum, {}) }), _jsx(Route, { path: "/releases-trends", element: _jsx(ReleasesAndTrendsPage, {}) }), _jsx(Route, { path: "/contact", element: _jsx(PcrContactForm, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) }), _jsx(Route, { path: "/artist-information", element: _jsx(ArtistInformationSubmission, {}) })] })] }));
    }
    const homeSpacerRef = useRef(null);
    const aboutSpacerRef = useRef(null);
    const releasesSpacerRef = useRef(null);
    const tiktokSpacerRef = useRef(null);
    const partnersSpacerRef = useRef(null);
    const syncSpacerRef = useRef(null);
    const servicesSpacerRef = useRef(null);
    const teamSpacerRef = useRef(null);
    const footerSpacerRef = useRef(null);
    const [active, setActive] = useState("home");
    const [leaving, setLeaving] = useState(null);
    const DURATION = 650;
    const getDistToCenter = (el, centerY) => {
        const r = el.getBoundingClientRect();
        return Math.abs(r.top + r.height / 2 - centerY);
    };
    const getActiveByScroll = () => {
        const els = [
            { key: "home", el: homeSpacerRef.current },
            { key: "about", el: aboutSpacerRef.current },
            { key: "releases", el: releasesSpacerRef.current },
            { key: "tiktok", el: tiktokSpacerRef.current },
            { key: "partners", el: partnersSpacerRef.current },
            { key: "sync", el: syncSpacerRef.current },
            { key: "services", el: servicesSpacerRef.current },
            { key: "team", el: teamSpacerRef.current },
            { key: "footer", el: footerSpacerRef.current },
        ];
        if (els.some((x) => !x.el))
            return;
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const centerY = vh * 0.5;
        const rects = els.map(({ key, el }) => ({
            key,
            dist: getDistToCenter(el, centerY),
        }));
        rects.sort((a, b) => a.dist - b.dist);
        return rects[0]?.key;
    };
    useEffect(() => {
        let raf = null;
        const onScroll = () => {
            if (raf)
                return;
            raf = requestAnimationFrame(() => {
                raf = null;
                const next = getActiveByScroll();
                if (!next || next === active)
                    return;
                const prev = active;
                setLeaving(prev);
                setActive(next);
                window.setTimeout(() => {
                    setLeaving((cur) => (cur === prev ? null : cur));
                }, DURATION);
            });
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            if (raf)
                cancelAnimationFrame(raf);
        };
    }, [active]);
    const renderOverlay = (key, node) => {
        if (!(active === key || leaving === key))
            return null;
        const anim = active === key
            ? "animate__animated animate__slideInRight"
            : "animate__animated animate__slideOutLeft";
        return (_jsx("div", { className: "overlay " + anim, style: { animationDuration: `${DURATION}ms` }, children: node }));
    };
    return (_jsxs(_Fragment, { children: [_jsx(BottomNav, {}), _jsx(ThreeLogo, {}), _jsx("div", { className: "global-fade", "aria-hidden": "true" }), _jsxs("div", { className: "overlay-root", children: [renderOverlay("home", _jsx(Home, { refEl: homeSpacerRef, isActive: active === "home" })), renderOverlay("about", _jsx(About, { isActive: active === "about" })), renderOverlay("releases", _jsx(ReleasesAndTrends, { isActive: active === "releases" })), renderOverlay("tiktok", _jsx(TikTokTrends, { isActive: active === "tiktok" })), renderOverlay("partners", _jsx(Partners, { isActive: active === "partners" })), renderOverlay("sync", _jsx(Sync, { isActive: active === "sync" })), renderOverlay("services", _jsx(Services, { isActive: active === "services" })), renderOverlay("team", _jsx(Team, { isActive: active === "team" })), renderOverlay("footer", _jsx(Footer, {}))] }), _jsx("section", { ref: homeSpacerRef, className: "spacer", id: "home" }), _jsx("section", { ref: aboutSpacerRef, className: "spacer", id: "about" }), _jsx("section", { ref: releasesSpacerRef, className: "spacer", id: "releases-trends" }), _jsx("section", { ref: tiktokSpacerRef, className: "spacer", id: "tiktok-trends" }), _jsx("section", { ref: partnersSpacerRef, className: "spacer", id: "partners" }), _jsx("section", { ref: syncSpacerRef, className: "spacer", id: "sync" }), _jsx("section", { ref: servicesSpacerRef, className: "spacer", id: "services" }), _jsx("section", { ref: teamSpacerRef, className: "spacer", id: "team" }), _jsx("section", { ref: footerSpacerRef, className: "spacer", id: "footer" })] }));
}
