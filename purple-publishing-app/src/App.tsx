import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { AdminLogin } from "./components/admin/AdminLogin";
import AdminSubmissions from "./components/admin/AdminSubmissions";
import AdminCms from "./components/admin/AdminCms";
import AdminSubmissionDetails from "./components/admin/AdminSubmissionDetails";
import AdminUsers from "./components/admin/AdminUsers";

import "./App.css";
import "./styles/admin.css";

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

import "animate.css";
import PrivacyPolicyPage from "./components/PrivacyPolicyPage";
import TermsPage from "./components/TermsPage";
import CookiePolicyPage from "./components/CookiePolicyPage";

import AdminPMG from "./components/admin/AdminPMG";

export type Theme = "dark" | "light";
export type Language = "EN" | "DE";

import ScrollToTop from "./components/ScrollToTop";

/** Public layout wrapper da ne ponavljaš isti markup svuda */
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
      <main className="app-main">{children}</main>
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

function App() {
  const [theme] = useState<Theme>("dark");

  return (
    <>
    <ScrollToTop />
    <Routes>
      {/* PUBLIC */}
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

      {/* ADMIN */}
      <Route
        path="/admin/login"
        element={
          <div className={`app app--${theme}`}>
            <main className="app-main">
              <AdminLogin />
            </main>
          </div>
        }
      />

      <Route
        path="/admin/submissions"
        element={
          <div className={`app app--${theme}`}>
            <main className="app-main">
              <AdminSubmissions />
            </main>
          </div>
        }
      />

     
      <Route
        path="/admin/users"
        element={
          <div className={`app app--${theme}`}>
            <main className="app-main">
              <AdminUsers />
            </main>
          </div>
        }
      />

      <Route
        path="/admin/cms"
        element={
          <div className={`app app--${theme}`}>
            <main className="app-main">
              <AdminCms />
            </main>
          </div>
        }
      />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />

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
        path="/admin/pmg"
        element={
          <div className={`app app--${theme}`}>
            <main className="app-main">
              <AdminPMG />
            </main>
          </div>
        }
      />



      
    </Routes>
    </>
  );
}

export default App;
