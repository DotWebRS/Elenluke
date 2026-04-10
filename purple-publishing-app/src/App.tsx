import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { AdminLogin } from "./components/admin/AdminLogin";
import AdminSubmissions from "./components/admin/AdminSubmissions";
import AdminCms from "./components/admin/AdminCms";
import AdminUsers from "./components/admin/AdminUsers";
import AdminPMG from "./components/admin/AdminPMG";
import AdminPCR from "./components/admin/AdminPCR";
import PortalChat from "./components/admin/PortalChat";
import AdminBackups from "./components/admin/AdminBackups";

import "./styles/admin.css";
import "animate.css";
import "./NewStyle_clean.css";

import BottomNav from "./components/BottomNav";
import Hero from "./components/Hero";
import About from "./components/About";
import Partners from "./components/Partners";
import ArtistsPreview from "./components/ArtistsPreview";
import ArtistsPage from "./components/ArtistsPage";
import Services from "./components/Services";
import SyncSection from "./components/SyncSection";
import { FAQ } from "./components/FAQ";
import Footer from "./components/Footer";
import WhatIsPublishingPage from "./components/WhatIsPublishingPage";
import SyncLicensingPage from "./components/SyncLicensingPage";
import SubmitForm from "./components/SubmitForm";
import PrivacyPolicyPage from "./components/PrivacyPolicyPage";
import TermsPage from "./components/TermsPage";
import CookiePolicyPage from "./components/CookiePolicyPage";
import ScrollToTop from "./components/ScrollToTop";
import ImpressumPage from "./components/ImpressumPage";
import { AdminNotificationsProvider } from "./components/admin/AdminNotificationsProvider";

export type Theme = "dark" | "light";
export type Language = "EN" | "DE";

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

function AdminLayout({
  theme,
  children,
}: {
  theme: Theme;
  children: React.ReactNode;
}) {
  return (
    <div className={`app app--${theme} app--admin`}>
      <main className="app-main app-main--admin">{children}</main>
    </div>
  );
}

function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <ArtistsPreview />
      <Services />
      <SyncSection />
      <Partners />
      <FAQ />
      <Footer />
    </>
  );
}

function RequireRole({
  allowed,
  children,
}: {
  allowed: string[];
  children: React.ReactNode;
}) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role") || "";

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!allowed.includes(role)) {
    if (role === "PortalUser") {
      return <Navigate to="/portal/chat" replace />;
    }

    if (role === "Admin" || role === "Editor") {
      return <Navigate to="/admin/submissions" replace />;
    }

    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const [theme] = useState<Theme>("dark");

  return (
    <AdminNotificationsProvider>
      <ScrollToTop />

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
          path="/artists"
          element={
            <PublicLayout theme={theme}>
              <ArtistsPage />
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
          path="/what-is-publishing"
          element={
            <PublicLayout theme={theme}>
              <WhatIsPublishingPage />
            </PublicLayout>
          }
        />

        <Route
          path="/submitform"
          element={
            <PublicLayout theme={theme}>
              <SubmitForm />
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
          path="/impressum"
          element={
            <PublicLayout theme={theme}>
              <ImpressumPage />
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
          path="/admin/login"
          element={
            <AdminLayout theme={theme}>
              <AdminLogin />
            </AdminLayout>
          }
        />

        <Route
          path="/portal/chat"
          element={
            <AdminLayout theme={theme}>
              <RequireRole allowed={["PortalUser"]}>
                <PortalChat />
              </RequireRole>
            </AdminLayout>
          }
        />

        <Route
          path="/admin/submissions"
          element={
            <AdminLayout theme={theme}>
              <RequireRole allowed={["Admin", "Editor"]}>
                <AdminSubmissions />
              </RequireRole>
            </AdminLayout>
          }
        />

        <Route
          path="/admin/users"
          element={
            <AdminLayout theme={theme}>
              <RequireRole allowed={["Admin"]}>
                <AdminUsers />
              </RequireRole>
            </AdminLayout>
          }
        />

        <Route
          path="/admin/cms"
          element={
            <AdminLayout theme={theme}>
              <RequireRole allowed={["Admin", "Editor"]}>
                <AdminCms />
              </RequireRole>
            </AdminLayout>
          }
        />

        <Route
          path="/admin/pmg"
          element={
            <AdminLayout theme={theme}>
              <RequireRole allowed={["Admin", "Editor"]}>
                <AdminPMG />
              </RequireRole>
            </AdminLayout>
          }
        />

        <Route
          path="/admin/pcr"
          element={
            <AdminLayout theme={theme}>
              <RequireRole allowed={["Admin", "Editor"]}>
                <AdminPCR />
              </RequireRole>
            </AdminLayout>
          }
        />

        <Route
          path="/admin/backups"
          element={
            <AdminLayout theme={theme}>
              <RequireRole allowed={["Admin"]}>
                <AdminBackups />
              </RequireRole>
            </AdminLayout>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AdminNotificationsProvider>
  );
}

export default App;