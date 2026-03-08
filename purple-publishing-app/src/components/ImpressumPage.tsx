import { useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Footer from "./Footer";
import "../styles/ImpressumPage.css";

export default function ImpressumPage() {
  const navigate = useNavigate();

  return (
    <>
      <section className="impressum-page">
        <div className="impressum-page__bg" />

        <Container className="impressum-page__container">
          <div className="impressum-page__topbar">
            <button
              type="button"
              className="artists-link artists-link--back impressum-back-btn"
              onClick={() => navigate(-1)}
            >
              BACK
            </button>
          </div>

          <div className="impressum-page__hero">
            <h1 className="about-title about-title-centered impressum-main-title">
              IMPRES<span className="about-us-animated">SUM</span>
            </h1>

            <div className="impressum-subtitle">
              Angaben gemäß § 5 TMG
            </div>
          </div>

          <div className="impressum-content">
            <section className="impressum-section">
              <h2 className="impressum-h2">Unternehmen</h2>
              <p className="impressum-p">
                Purple Media Group GmbH
                <br />
                Am Kreuzbach 12
                <br />
                91083 Baiersdorf
                <br />
                Deutschland
              </p>
            </section>

            <div className="impressum-divider" />

            <section className="impressum-section">
              <h2 className="impressum-h2">Vertreten durch die Geschäftsführer</h2>
              <p className="impressum-p">
                Michael Lotter, Johannes Lotter
              </p>
            </section>

            <div className="impressum-divider" />

            <section className="impressum-section">
              <h2 className="impressum-h2">Kontakt</h2>
              <p className="impressum-p">
                E-Mail:{" "}
                <a
                  href="mailto:info@purplemusicgroup.com"
                  className="impressum-inline-link"
                >
                  info@purplemusicgroup.com
                </a>
              </p>
            </section>

            <div className="impressum-divider" />

            <section className="impressum-section">
              <h2 className="impressum-h2">Registereintrag</h2>
              <p className="impressum-p">
                Eintragung im Handelsregister
              </p>
              <p className="impressum-p">
                Registergericht
                <br />
                Fürth
              </p>
              <p className="impressum-p">
                Registernummer
                <br />
                HRB 22170
              </p>
            </section>

            <div className="impressum-divider" />

            <section className="impressum-section">
              <h2 className="impressum-h2">Umsatzsteuer-ID</h2>
              <p className="impressum-p">
                Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: DE458018407
              </p>
            </section>

            <div className="impressum-divider" />

            <section className="impressum-section">
              <h2 className="impressum-h2">
                Inhaltlich verantwortlich (redaktionelle Inhalte)
              </h2>
              <p className="impressum-p">
                Inhaltlich verantwortlich gemäß § 18 Abs. 2 MStV:
              </p>
              <p className="impressum-p">
                Michael Lotter, Johannes Lotter
                <br />
                Am Kreuzbach 12
                <br />
                91083 Baiersdorf
                <br />
                Deutschland
              </p>
            </section>

            <div className="impressum-divider" />

            <section className="impressum-section">
              <h2 className="impressum-h2">
                Verbraucherstreitbeilegung / Schlichtung
              </h2>
              <p className="impressum-p">
                Wir sind nicht bereit und nicht verpflichtet, an
                Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
                teilzunehmen.
              </p>
            </section>

            <div className="impressum-divider" />

            <section className="impressum-section">
              <h2 className="impressum-h2">
                Hinweis zur Online-Streitbeilegung (OS-Plattform)
              </h2>
              <p className="impressum-p">
                Die EU-Online-Streitbeilegungsplattform (OS) wurde zum 20. Juli
                2025 eingestellt; eine Verlinkung ist daher nicht mehr
                erforderlich.
              </p>
            </section>
          </div>
        </Container>
      </section>

      <Footer />
    </>
  );
}