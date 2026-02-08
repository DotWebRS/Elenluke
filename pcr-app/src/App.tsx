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

type Key =
  | "home"
  | "about"
  | "releases"
  | "tiktok"
  | "partners"
  | "sync"
  | "services"
  | "team"
  | "footer";

export default function App() {
  const location = useLocation();

  const isStandalone =
    location.pathname === "/cookies" ||
    location.pathname === "/privacy" ||
    location.pathname === "/terms" ||
    location.pathname === "/impressum" ||
    location.pathname === "/releases-trends" ||
    location.pathname === "/contact"||
    location.pathname === "/artist-information"; 

  if (isStandalone) {
    return (
      <>
        <BottomNav />
        <ThreeLogo />
        <div className="global-fade" aria-hidden="true" />

        <Routes>
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/releases-trends" element={<ReleasesAndTrendsPage />} />
          <Route path="/contact" element={<PcrContactForm />} />

          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/artist-information" element={<ArtistInformationSubmission />} />
        </Routes>
      </>
    );
  }

  const homeSpacerRef = useRef<HTMLElement | null>(null);
  const aboutSpacerRef = useRef<HTMLElement | null>(null);
  const releasesSpacerRef = useRef<HTMLElement | null>(null);
  const tiktokSpacerRef = useRef<HTMLElement | null>(null);
  const partnersSpacerRef = useRef<HTMLElement | null>(null);
  const syncSpacerRef = useRef<HTMLElement | null>(null);
  const servicesSpacerRef = useRef<HTMLElement | null>(null);
  const teamSpacerRef = useRef<HTMLElement | null>(null);
  const footerSpacerRef = useRef<HTMLElement | null>(null);

  const [active, setActive] = useState<Key>("home");
  const [leaving, setLeaving] = useState<Key | null>(null);

  const DURATION = 650;

  const getDistToCenter = (el: HTMLElement, centerY: number) => {
    const r = el.getBoundingClientRect();
    return Math.abs(r.top + r.height / 2 - centerY);
  };

  const getActiveByScroll = (): Key | undefined => {
    const els: Array<{ key: Key; el: HTMLElement | null }> = [
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

    if (els.some((x) => !x.el)) return;

    const vh = window.innerHeight || document.documentElement.clientHeight;
    const centerY = vh * 0.5;

    const rects = els.map(({ key, el }) => ({
      key,
      dist: getDistToCenter(el as HTMLElement, centerY),
    }));

    rects.sort((a, b) => a.dist - b.dist);
    return rects[0]?.key;
  };

  useEffect(() => {
    let raf: number | null = null;

    const onScroll = () => {
      if (raf) return;

      raf = requestAnimationFrame(() => {
        raf = null;

        const next = getActiveByScroll();
        if (!next || next === active) return;

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
      if (raf) cancelAnimationFrame(raf);
    };
  }, [active]);

  const renderOverlay = (key: Key, node: React.ReactNode) => {
    if (!(active === key || leaving === key)) return null;

    const anim =
      active === key
        ? "animate__animated animate__slideInRight"
        : "animate__animated animate__slideOutLeft";

    return (
      <div className={"overlay " + anim} style={{ animationDuration: `${DURATION}ms` }}>
        {node}
      </div>
    );
  };

  return (
    <>
      <BottomNav />
      <ThreeLogo />
      <div className="global-fade" aria-hidden="true" />

      <div className="overlay-root">
        {renderOverlay("home", <Home refEl={homeSpacerRef} isActive={active === "home"} />)}
        {renderOverlay("about", <About isActive={active === "about"} />)}
        {renderOverlay("releases", <ReleasesAndTrends isActive={active === "releases"} />)}
        {renderOverlay("tiktok", <TikTokTrends isActive={active === "tiktok"} />)}
        {renderOverlay("partners", <Partners isActive={active === "partners"} />)}
        {renderOverlay("sync", <Sync isActive={active === "sync"} />)}
        {renderOverlay("services", <Services isActive={active === "services"} />)}
        {renderOverlay("team", <Team isActive={active === "team"} />)}
        {renderOverlay("footer", <Footer />)}
      </div>

      <section ref={homeSpacerRef} className="spacer" id="home" />
      <section ref={aboutSpacerRef} className="spacer" id="about" />
      <section ref={releasesSpacerRef} className="spacer" id="releases-trends" />
      <section ref={tiktokSpacerRef} className="spacer" id="tiktok-trends" />
      <section ref={partnersSpacerRef} className="spacer" id="partners" />
      <section ref={syncSpacerRef} className="spacer" id="sync" />
      <section ref={servicesSpacerRef} className="spacer" id="services" />
      <section ref={teamSpacerRef} className="spacer" id="team" />
      <section ref={footerSpacerRef} className="spacer" id="footer" />
    </>
  );
}
