// src/pages/Cookies.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/Publishing.css";
import ReleasesFooterBar from "./ReleasesFooterBar";

type Lang = "DE" | "EN";

/* default = EN */
function getInitialLang(): Lang {
  const v = localStorage.getItem("legalLang");
  return v === "DE" ? "DE" : "EN";
}

function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="legal__lang" aria-label="Language">
      <button
        type="button"
        className={["legal__langBtn", lang === "EN" ? "is-active" : ""].join(" ")}
        onClick={() => onChange("EN")}
        aria-pressed={lang === "EN"}
        disabled={lang === "EN"}
      >
        EN
      </button>

      <button
        type="button"
        className={["legal__langBtn", lang === "DE" ? "is-active" : ""].join(" ")}
        onClick={() => onChange("DE")}
        aria-pressed={lang === "DE"}
        disabled={lang === "DE"}
      >
        DE
      </button>
    </div>
  );
}

export default function Cookies() {
  const [lang, setLang] = useState<Lang>(() => getInitialLang());
  const navigate = useNavigate();

  const [marketing, setMarketing] = useState(true);
  const [functional, setFunctional] = useState(true);
  const [openPolicy, setOpenPolicy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    localStorage.setItem("legalLang", lang);
  }, [lang]);

  const cookieHint = useMemo(() => {
    if (lang === "DE") {
      return `Mir ist bekannt, dass ich meine Zustimmung jederzeit über die „Cookie-Einstellungen“ ganz unten auf der adidas Website widerrufen kann. Wenn du nicht möchtest, dass Purple Crunch Publishing Cookies wie oben beschrieben verwendet, dann lass einfach die Kontrollkästchen deaktiviert und klicke auf „ICH AKZEPTIERE DIE AUSGEWÄHLTEN COOKIES“. Wir verwenden dann nur erforderliche Cookies, die für die grundlegende Funktionalität unserer Websites und Apps notwendig sind.`;
    }
    return `You can change or withdraw your consent at any time via Cookie Settings. If you do not want Purple Crunch Publishing to use cookies as described above, simply untick the boxes and click “ACCEPT SELECTED COOKIES”. We will then only use strictly necessary cookies required for basic functionality.`;
  }, [lang]);

  const savedMsg = useMemo(() => (lang === "DE" ? "Gespeichert ✅" : "Saved ✅"), [lang]);

  function acceptSelected() {
    localStorage.setItem("cookie.marketing", marketing ? "1" : "0");
    localStorage.setItem("cookie.functional", functional ? "1" : "0");

    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  return (
    <main className="page">
      <section className="legal">
        <div className="legal__bg" aria-hidden="true" />
        <div className="legal__fadeTop" aria-hidden="true" />
        <div className="legal__fadeBottom" aria-hidden="true" />

        <div className="legal__inner">
          <header className="legal__header">
            <button
                  type="button"
                  className="legal__back"
                  onClick={() => navigate(-1)}
                  aria-label="Go back"
                >
                  ← Back
                </button>
            <div className="legal__headerRow">
              <div>
                <h1 className="legal__title">
                  <br/>
                  {lang === "DE" ? "Cookie-Einstellungen" : "Cookie Settings"}
                </h1>
                <p className="legal__subtitle">
                  {lang === "DE" ? "TRACKING VERWALTEN" : "MANAGE TRACKING"}
                </p>
              </div>

              <div className="legal__actions">
                

                <LangToggle lang={lang} onChange={setLang} />
              </div>
            </div>
          </header>

          <div className="legal__card">
            <p className="legal__p">
              {lang === "DE"
                ? "Wähle deine bevorzugten Tracking-Einstellungen:"
                : "Choose your preferred tracking settings:"}
            </p>

            <div className="cookie__group">
              <div className="cookie__row">
                <label className="cookie__label">
                  <input
                    className="cookie__check"
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                  />
                  <span className="cookie__name">{lang === "DE" ? "Marketing" : "Marketing"}</span>
                </label>
              </div>

              <p className="cookie__text">
                {lang === "DE"
                  ? "Ich stimme zu, dass Cookies verwendet werden dürfen, um mir geeignete Produktvorschläge zu machen und mir personalisierte Werbung auf adidas Websites und Apps sowie auf Plattformen ausgewählter Marketingpartner anzuzeigen, z. B. auf sozialen Netzwerken wie Google, Facebook oder Instagram, und zu diesem Zweck Informationen an diese Werbepartner weiterzugeben."
                  : "I agree that cookies may be used to show me suitable product suggestions and personalized advertising on adidas websites and apps and on selected marketing partners’ platforms (e.g., Google, Facebook, Instagram), and to share information with these advertising partners for this purpose."}
              </p>
            </div>

            <div className="cookie__divider" />

            <div className="cookie__group">
              <div className="cookie__row">
                <label className="cookie__label">
                  <input
                    className="cookie__check"
                    type="checkbox"
                    checked={functional}
                    onChange={(e) => setFunctional(e.target.checked)}
                  />
                  <span className="cookie__name">{lang === "DE" ? "Funktional" : "Functional"}</span>
                </label>
              </div>

              <p className="cookie__text">
                {lang === "DE"
                  ? "Ich stimme zu, dass Cookies verwendet werden dürfen, um Analysen zum besseren Verständnis der Nutzung der adidas Websites und Apps durchzuführen, um notwendige und funktionale Leistungs- und Designverbesserungen auf den Websites und Apps vorzunehmen und um ein personalisiertes Surf- und Einkaufserlebnis zu ermöglichen sowie Informationen zu diesen Zwecken an Partner weiterzugeben."
                  : "I agree that cookies may be used to run analytics to better understand how the adidas websites and apps are used, to make necessary functional performance and design improvements, and to enable a personalized browsing and shopping experience, including sharing information with partners for these purposes."}
              </p>
            </div>

            <div className="cookie__divider" />

            <p className="cookie__hint">{cookieHint}</p>

            <div className="cookie__actions">
              <button type="button" className="legal__btn" onClick={acceptSelected}>
                {lang === "DE"
                  ? "ICH AKZEPTIERE DIE AUSGEWÄHLTEN COOKIES"
                  : "ACCEPT SELECTED COOKIES"}
              </button>

              <button
                type="button"
                className="legal__btn legal__btn--ghost"
                onClick={() => setOpenPolicy(true)}
              >
                {lang === "DE" ? "COOKIE HINWEIS" : "COOKIE NOTICE"}
              </button>

              {saved ? (
                <div className="cookie__saved" role="status" aria-live="polite">
                  {savedMsg}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {openPolicy ? (
          <div className="modal" role="dialog" aria-modal="true" aria-label="Cookie Policy">
            <button
              className="modal__backdrop"
              onClick={() => setOpenPolicy(false)}
              aria-label="Close"
            />
            <div className="modal__panel">
              <div className="modal__top">
                <div className="modal__title">
                  {lang === "DE" ? "Cookie Policy" : "Cookie Policy"}
                </div>
                <button
                  className="modal__close"
                  onClick={() => setOpenPolicy(false)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="modal__body">
                {lang === "DE" ? (
                  <div className="modal__block">
                    <div className="modal__h">Cookie Policy (DE)</div>
                    <div className="modal__p">Stand: 28. Januar 2026</div>
                    <div className="modal__p">
                      Diese Cookie-Richtlinie erklärt, wie Purple Media Group („wir“, „uns“) Cookies und ähnliche
                      Technologien auf [www.purplecrunchpublishing.com] einsetzt.
                    </div>

                    <div className="modal__h2">1. Was sind Cookies?</div>
                    <div className="modal__p">
                      Cookies sind kleine Textdateien, die auf Ihrem Endgerät gespeichert werden. Sie helfen, eine Website
                      bereitzustellen, sicher zu betreiben und Funktionen sowie Analysen zu ermöglichen.
                    </div>

                    <div className="modal__h2">2. Welche Arten von Cookies verwenden wir?</div>
                    <div className="modal__p">Wir setzen je nach Einsatz folgende Kategorien ein:</div>

                    <div className="modal__h3">a) Essenzielle Cookies (notwendig)</div>
                    <div className="modal__p">
                      Diese Cookies sind erforderlich, damit die Website funktioniert (z. B. Seitennavigation, Sicherheit,
                      Spracheinstellungen). Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem
                      technisch fehlerfreien Betrieb) und – soweit einschlägig – § 25 Abs. 2 Nr. 2 TTDSG.
                    </div>

                    <div className="modal__h3">b) Funktionale Cookies (optional)</div>
                    <div className="modal__p">
                      Ermöglichen Komfortfunktionen (z. B. bevorzugte Einstellungen). Rechtsgrundlage: Einwilligung,
                      Art. 6 Abs. 1 lit. a DSGVO i.V.m. § 25 Abs. 1 TTDSG.
                    </div>

                    <div className="modal__h3">c) Statistik/Analyse Cookies (optional)</div>
                    <div className="modal__p">
                      Helfen uns zu verstehen, wie Besucher die Website nutzen (z. B. Seitenaufrufe, Verweildauer).
                      Rechtsgrundlage: Einwilligung, Art. 6 Abs. 1 lit. a DSGVO i.V.m. § 25 Abs. 1 TTDSG.
                    </div>

                    <div className="modal__h3">d) Marketing Cookies (optional)</div>
                    <div className="modal__p">
                      Dienen dazu, Inhalte/Anzeigen zu personalisieren und Kampagnen zu messen. Rechtsgrundlage:
                      Einwilligung, Art. 6 Abs. 1 lit. a DSGVO i.V.m. § 25 Abs. 1 TTDSG.
                    </div>

                    <div className="modal__h2">3. Einwilligung und Widerruf</div>
                    <div className="modal__p">
                      Beim ersten Besuch fragen wir Sie (sofern erforderlich) nach Ihrer Einwilligung. Sie können Ihre
                      Auswahl jederzeit ändern oder widerrufen über: [Link zu Cookie-Einstellungen].
                    </div>

                    <div className="modal__h2">4. Cookies von Drittanbietern</div>
                    <div className="modal__p">
                      Wenn wir Dienste von Drittanbietern einsetzen (z. B. Analyse- oder Marketingtools), können diese
                      eigene Cookies setzen und Daten verarbeiten. Details finden Sie in den Cookie-Einstellungen und in
                      unserer Datenschutzerklärung.
                    </div>

                    <div className="modal__h2">5. Speicherdauer</div>
                    <div className="modal__p">
                      Cookies werden entweder nur für die Sitzung gespeichert (Session Cookies) oder bleiben für eine
                      definierte Zeit auf Ihrem Gerät (Persistente Cookies). Die jeweilige Dauer sehen Sie in den
                      Cookie-Einstellungen.
                    </div>
                  </div>
                ) : (
                  <div className="modal__block">
                    <div className="modal__h">Cookie Policy (EN) – Germany/EU aligned</div>
                    <div className="modal__p">Last updated: 28 January 2026</div>
                    <div className="modal__p">
                      This Cookie Policy explains how [Company Name] (“we”, “us”) uses cookies and similar technologies
                      on [Domain].
                    </div>

                    <div className="modal__h2">1. What are cookies?</div>
                    <div className="modal__p">
                      Cookies are small text files stored on your device. They help operate a website, keep it secure,
                      and enable features, analytics, and marketing (where applicable).
                    </div>

                    <div className="modal__h2">2. What types of cookies do we use?</div>
                    <div className="modal__p">Depending on your choices, we may use:</div>

                    <div className="modal__h3">a) Strictly necessary cookies</div>
                    <div className="modal__p">
                      Required to operate the website (e.g., security, basic functions). Legal basis: Art. 6(1)(f) GDPR
                      and, where applicable, Sec. 25(2) TTDSG.
                    </div>

                    <div className="modal__h3">b) Functional cookies (optional)</div>
                    <div className="modal__p">
                      Enable enhanced functionality and personalization. Legal basis: Consent, Art. 6(1)(a) GDPR + Sec.
                      25(1) TTDSG.
                    </div>

                    <div className="modal__h3">c) Analytics cookies (optional)</div>
                    <div className="modal__p">
                      Help us understand how visitors use the site. Legal basis: Consent, Art. 6(1)(a) GDPR + Sec. 25(1)
                      TTDSG.
                    </div>

                    <div className="modal__h3">d) Marketing cookies (optional)</div>
                    <div className="modal__p">
                      Used to deliver and measure personalized advertising. Legal basis: Consent, Art. 6(1)(a) GDPR + Sec.
                      25(1) TTDSG.
                    </div>

                    <div className="modal__h2">3. Consent and withdrawal</div>
                    <div className="modal__p">
                      Where required, we ask for consent on your first visit. You can change or withdraw consent at any
                      time via: [Cookie settings link].
                    </div>

                    <div className="modal__h2">4. Third-party cookies</div>
                    <div className="modal__p">
                      If we use third-party services (e.g., analytics/marketing providers), they may set cookies and
                      process data. Details are provided in Cookie Settings and our Privacy Policy.
                    </div>

                    <div className="modal__h2">5. Retention</div>
                    <div className="modal__p">
                      Cookies may be session-based or stored for a defined period. Exact retention times are shown in
                      Cookie Settings.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </section>
      <ReleasesFooterBar />
    </main>
  );
}
