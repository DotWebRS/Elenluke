import { ThreeLogo } from "../components/ThreeLogo";
import HomeHeroTitle from "../components/HomeHeroTitle";
import "../style/Home.css";

export default function Home() {
  return (
    <section className="home" id="home">
      <ThreeLogo />

      <div className="home-content">
        <HomeHeroTitle />
      </div>
    </section>
  );
}
