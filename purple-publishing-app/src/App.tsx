import { useState } from "react";
import { Routes, Route } from "react-router-dom";

import { AdminLogin } from "./components/admin/AdminLogin";
import AdminSubmissions from "./components/admin/AdminSubmissions";
import AdminCms from "./components/admin/AdminCms";
import AdminSubmissionDetails from "./components/admin/AdminSubmissionDetails";
import AdminUsers from "./components/admin/AdminUsers";

import "./App.css";
import "./styles/admin.css"

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

import 'animate.css';

export type Theme = "dark" | "light";
export type Language = "EN" | "DE";

function App() {
  const [theme] = useState<Theme>("dark");
  const [language] = useState<Language>("EN");

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className={`app app--${theme}`}>
            <BottomNav />
            <main className="app-main">
              <Hero />
              <About />
              <ArtistsPreview />
              <Services />
              <SyncSection />
              <Partners />
              <FAQ />
              <Footer />
            </main>
          </div>
        }
      />

      <Route
        path="/artists"
        element={
          <div className={`app app--${theme}`}>
            <BottomNav />
            <main className="app-main">
              <ArtistsPage />
            </main>
          </div>
        }
      />

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
        path="/admin/submissions/:id"
        element={
          <div className={`app app--${theme}`}>
            <main className="app-main">
              <AdminSubmissionDetails />
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

      <Route path="/sync-licensing" element={<SyncLicensingPage />} />

      <Route path="/what-is-publishing" element={<WhatIsPublishingPage />} />

      <Route path="/admin/users" element={<AdminUsers />} />

      <Route path="/submitform" element={<SubmitForm />} />

    </Routes>
  );
}

export default App;
