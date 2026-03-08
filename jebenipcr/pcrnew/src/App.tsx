import BottomNav from "./components/BottomNav";
import Snow from "./components/Snow";

import HomeSection from "./components/HomeSection";
import AboutSection from "./components/AboutSection";
import ReleasesTrendsSection from "./components/ReleasesTrendsSection";
import TiktokTrendsSection from "./components/TiktokTrendsSection";
import PartnersSection from "./components/PartnersSection";
import SyncSection from "./components/SyncSection";
import TeamSection from "./components/TeamSection";
import ContactSection from "./components/ContactSection";

import "./style/style.css";

export default function App() {
  return (
    <div className="app">
      
      <BottomNav />

      <Snow className="snow-bg" />

      <main className="main">
        <HomeSection />
        <AboutSection />
        <ReleasesTrendsSection />
        <TiktokTrendsSection />
        <PartnersSection />
        <SyncSection />
        <TeamSection />
        <ContactSection />
      </main>
    </div>
  );
}
