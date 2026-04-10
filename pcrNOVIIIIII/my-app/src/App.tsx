import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import "./style/NewStylePcr.css";

import BottomNav from "./components/BottomNav";
import Home from "./pages/Home";
import About from "./pages/About";
import TikTokTrends from "./pages/TikTokTrends";
import Team from "./pages/Team";
import Services from "./pages/Services";
import Footer from "./components/Footer";
import Contact from "./pages/Contact";

import Impressum from "./components/ImpressumPage";
import PrivacyPolicy from "./components/PrivacyPolicyPage";
import CookiePolicy from "./components/CookiePolicyPage";
import Terms from "./components/TermsPage";

import SyncSection from "./pages/SyncSection";
import SyncLicensingPage from "./pages/SyncLicencingPage";
import Partners from "./pages/Partners";
import ReleasesCylinder from "./pages/ReleasesCylinder";
import ReleasesHubPage from "./pages/ReleasesHubPage";
import ArtistInformationPage from "./pages/ArtistInformationPage";

export type Theme = "dark" | "light";

function ScrollToTopAndHash() {
  const location = useLocation();

  useEffect(() => {
    const navHeight = 84;

    const scrollNow = () => {
      if (location.hash) {
        const id = location.hash.replace("#", "");
        const el = document.getElementById(id);

        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - navHeight;

          window.scrollTo({
            top: y,
            left: 0,
            behavior: "smooth",
          });
          return;
        }
      }

      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
    };

    const t = window.setTimeout(scrollNow, 80);
    return () => window.clearTimeout(t);
  }, [location.pathname, location.hash]);

  return null;
}

function PublicLayout({
  theme,
  children,
}: {
  theme: Theme;
  children: React.ReactNode;
}) {
  return (
    <div className={`app app--${theme}`}>
      <BottomNav />
      <main className="app-main app-main--public">{children}</main>
    </div>
  );
}

function HomePage() {
  return (
    <>
      <Home />
      <About />
      <ReleasesCylinder />
      <TikTokTrends />
      <Partners />
      <SyncSection />
      <Services />
      <Team />
      <Footer />
    </>
  );
}

function ContactPage() {
  return <Contact />;
}

function ImpressumPage() {
  return (
    <>
      <Impressum />
      <Footer />
    </>
  );
}

function PrivacyPolicyPage() {
  return (
    <>
      <PrivacyPolicy />
      <Footer />
    </>
  );
}

function CookiePolicyPage() {
  return (
    <>
      <CookiePolicy />
      <Footer />
    </>
  );
}

function TermsPage() {
  return (
    <>
      <Terms />
      <Footer />
    </>
  );
}

function App() {
  const [theme] = useState<Theme>("dark");

  return (
    <>
      <ScrollToTopAndHash />

      <Routes>
        <Route
          path="/"
          element={
            <PublicLayout theme={theme}>
              <HomePage />
            </PublicLayout>
          }
        />

        <Route
          path="/contact"
          element={
            <PublicLayout theme={theme}>
              <ContactPage />
            </PublicLayout>
          }
        />

        <Route
          path="/sync-licensing"
          element={
            <PublicLayout theme={theme}>
              <SyncLicensingPage />
            </PublicLayout>
          }
        />

        <Route
          path="/impressum"
          element={
            <PublicLayout theme={theme}>
              <ImpressumPage />
            </PublicLayout>
          }
        />

        <Route
          path="/privacy-policy"
          element={
            <PublicLayout theme={theme}>
              <PrivacyPolicyPage />
            </PublicLayout>
          }
        />

        <Route
          path="/cookie-policy"
          element={
            <PublicLayout theme={theme}>
              <CookiePolicyPage />
            </PublicLayout>
          }
        />

        <Route
          path="/terms"
          element={
            <PublicLayout theme={theme}>
              <TermsPage />
            </PublicLayout>
          }
        />

        <Route
          path="/releases-hub"
          element={
            <PublicLayout theme={theme}>
              <ReleasesHubPage />
            </PublicLayout>
          }
        />

        <Route
          path="/artist-information"
          element={
            <PublicLayout theme={theme}>
              <ArtistInformationPage />
            </PublicLayout>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;