import { useNavigate } from "react-router-dom";

export default function Impressum() {
  const navigate = useNavigate();
  return (
    <main className="page">
      <section className="impressum">
        <div className="impressum__bg" aria-hidden="true" />
        <div className="impressum__fadeTop" aria-hidden="true" />
        <div className="impressum__fadeBottom" aria-hidden="true" />
        
        <div className="impressum__inner">
          <header className="impressum__header">
             <button
                type="button"
                className="legal__back"
                onClick={() => navigate(-1)}
                aria-label="Go back"
              >
                ← Back
              </button>
            <h1 className="impressum__title">Impressum</h1>
            <p className="impressum__subtitle">
              Angaben gemäß § 5 TMG
            </p>
          </header>

          <div className="impressum__card">
            <h2 className="impressum__h2">Unternehmen</h2>

            <address className="impressum__address">
              <div className="impressum__strong">Purple Media Group GmbH</div>
              <div>Am Kreuzbach 12</div>
              <div>91083 Baiersdorf</div>
              <div>Deutschland</div>
            </address>

            <div className="impressum__section">
              <h3 className="impressum__h3">Vertreten durch die Geschäftsführer</h3>
              <p className="impressum__p">Michael Lotter, Johannes Lotter</p>
            </div>

            <div className="impressum__section">
              <h3 className="impressum__h3">Kontakt</h3>
              <p className="impressum__p">
                E-Mail:{" "}
                <a className="impressum__link" href="mailto:info@purplemusicgroup.com">
                  info@purplemusicgroup.com
                </a>
              </p>
            </div>

            <div className="impressum__section">
              <h3 className="impressum__h3">Registereintrag</h3>
              <dl className="impressum__dl">
                <div className="impressum__dlRow">
                  <dt>Eintragung im Handelsregister</dt>
                  <dd>&nbsp;</dd>
                </div>
                <div className="impressum__dlRow">
                  <dt>Registergericht</dt>
                  <dd>Fürth</dd>
                </div>
                <div className="impressum__dlRow">
                  <dt>Registernummer</dt>
                  <dd>HRB 22170</dd>
                </div>
              </dl>
            </div>

            <div className="impressum__section">
              <h3 className="impressum__h3">Umsatzsteuer-ID</h3>
              <p className="impressum__p">
                Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:{" "}
                <span className="impressum__mono">DE458018407</span>
              </p>
            </div>

            <div className="impressum__section">
              <h3 className="impressum__h3">
                Inhaltlich verantwortlich (redaktionelle Inhalte)
              </h3>
              <p className="impressum__p">
                Inhaltlich verantwortlich gemäß § 18 Abs. 2 MStV:
              </p>
              <address className="impressum__address">
                <div className="impressum__strong">Michael Lotter, Johannes Lotter</div>
                <div>Am Kreuzbach 12</div>
                <div>91083 Baiersdorf</div>
                <div>Deutschland</div>
              </address>
            </div>

            <div className="impressum__section">
              <h3 className="impressum__h3">
                Verbraucherstreitbeilegung / Schlichtung
              </h3>
              <p className="impressum__p">
                Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren
                vor einer Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </div>

            <div className="impressum__section">
              <h3 className="impressum__h3">
                Hinweis zur Online-Streitbeilegung (OS-Plattform)
              </h3>
              <p className="impressum__p">
                Die EU-Online-Streitbeilegungsplattform (OS) wurde zum 20. Juli 2025
                eingestellt; eine Verlinkung ist daher nicht mehr erforderlich.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
