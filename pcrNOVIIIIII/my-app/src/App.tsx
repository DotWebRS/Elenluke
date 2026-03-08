import BottomNav from "./components/BottomNav";
import Home from "./pages/Home";
import Snow from "./components/Snow";
import "./App.css";
import About from "./pages/About";
import TikTokTrends from "./pages/TikTokTrends";
import Partners from "./pages/Partners";
import Team from "./pages/Team";
import Services from "./pages/Services";
import FAQ from "./pages/faq";


export default function App() {
  return (
    <div className="app-shell">
      <Snow />
      <BottomNav />

      <main className="app-main">
        <section id="home"><Home /></section>
        <section id="about"><About /></section>
        <section id="tiktok-trends"><TikTokTrends /></section>
        <section id="partners"><Partners /></section>
        <section id="team"><Team /></section>
        <section id="services"><Services /></section>
        <section id="faq"><FAQ /></section>
        
      </main>
    </div>
  );
}
