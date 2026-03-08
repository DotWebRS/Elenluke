import Section from "../components/Section";

export default function AboutSection() {
  return (
    <Section id="about-us" title="ABOUT US" tone="default">
      <div className="cardGrid">
        <div className="card">Blok 1</div>
        <div className="card">Blok 2</div>
        <div className="card">Blok 3</div>
      </div>
    </Section>
  );
}
