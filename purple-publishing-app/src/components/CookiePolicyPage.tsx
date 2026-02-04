import { useEffect, useMemo, useState } from "react";
import Container from "react-bootstrap/Container";
import Modal from "react-bootstrap/Modal";
import { Link } from "react-router-dom";
import "../styles/Publishing.css";

type Language = "EN" | "DE";
const LS_LANG_KEY = "pcp_lang";

function readLang(): Language {
  const v = (localStorage.getItem(LS_LANG_KEY) || "").toUpperCase();
  return v === "DE" ? "DE" : "EN";
}
function writeLang(lang: Language) {
  localStorage.setItem(LS_LANG_KEY, lang);
}

type ConsentState = { marketing: boolean; functional: boolean };
const CONSENT_KEY = "pcp_cookie_consent";

const TRACKING_DE = {
  heroTitle: "COOKIE",
  heroAccent: "POLICY",
  heading: "TRACKING VERWALTEN",
  intro: "Wähle deine bevorzugten Tracking-Einstellungen:",
  marketingLabel: "Marketing",
  marketingText:
    "Ich stimme zu, dass Cookies verwendet werden dürfen, um mir geeignete Produktvorschläge zu machen und mir personalisierte Werbung auf adidas Websites und Apps sowie auf Plattformen ausgewählter Marketingpartner anzuzeigen, z. B. auf sozialen Netzwerken wie Google, Facebook oder Instagram, und zu diesem Zweck Informationen an diese Werbepartner weiterzugeben.",
  functionalLabel: "Funktional",
  functionalText:
    "Ich stimme zu, dass Cookies verwendet werden dürfen, um Analysen zum besseren Verständnis der Nutzung der adidas Websites und Apps durchzuführen, um notwendige und funktionale Leistungs- und Designverbesserungen auf den Websites und Apps vorzunehmen und um ein personalisiertes Surf- und Einkaufserlebnis zu ermöglichen sowie Informationen zu diesen Zwecken an Partner weiterzugeben.",
  note:
    "Mir ist bekannt, dass ich meine Zustimmung jederzeit über die „Cookie-Einstellungen“ ganz unten auf der adidas Website widerrufen kann. Wenn du nicht möchtest, dass Purple Crunch Publishing Cookies wie oben beschrieben verwendet, dann lass einfach die Kontrollkästchen deaktiviert und klicke auf „ICH AKZEPTIERE DIE AUSGEWÄHLTEN COOKIES“. Wir verwenden dann nur erforderliche Cookies, die für die grundlegende Funktionalität unserer Websites und Apps notwendig sind.",
  accept: "ICH AKZEPTIERE DIE AUSGEWÄHLTEN COOKIES",
  necessaryOnly: "NUR ERFORDERLICHE COOKIES",
  hintBtn: "COOKIE HINWEIS",
  updated: "Stand: 28. Januar 2026",
  toastSaved: "Gespeichert.",
  toastNecessary: "Nur erforderliche Cookies gespeichert.",
  modalTitle: "Cookie Policy",
};

const TRACKING_EN = {
  heroTitle: "COOKIE",
  heroAccent: "POLICY",
  heading: "MANAGE TRACKING",
  intro: "Choose your preferred tracking settings:",
  marketingLabel: "Marketing",
  marketingText:
    "I agree that cookies may be used to show me relevant suggestions and personalized advertising on selected marketing partners’ platforms (e.g., Google, Facebook, or Instagram), and to share information with those advertising partners for this purpose.",
  functionalLabel: "Functional / Analytics",
  functionalText:
    "I agree that cookies may be used to run analytics to better understand usage, to make necessary functional performance and design improvements, and to enable a personalized browsing experience, including sharing information with partners for these purposes.",
  note:
    "I understand that I can withdraw my consent at any time via “Cookie Settings” at the bottom of the website. If you do not want Purple Crunch Publishing to use cookies as described above, simply disable the checkboxes and click “ACCEPT SELECTED COOKIES”. In that case, we will only use strictly necessary cookies required for basic functionality.",
  accept: "ACCEPT SELECTED COOKIES",
  necessaryOnly: "STRICTLY NECESSARY ONLY",
  hintBtn: "COOKIE NOTICE",
  updated: "Last updated: 28 January 2026",
  toastSaved: "Saved.",
  toastNecessary: "Saved: strictly necessary only.",
  modalTitle: "Cookie Policy",
};

const COOKIE_POLICY_DE = `Cookie Policy
Stand: 28. Januar 2026
Diese Cookie-Richtlinie erklärt, wie Purple Media Group („wir“, „uns“) Cookies und ähnliche Technologien auf www.purplecrunchpublishing.com einsetzt.

1. Was sind Cookies?
Cookies sind kleine Textdateien, die auf Ihrem Endgerät gespeichert werden. Sie helfen, eine Website bereitzustellen, sicher zu betreiben und Funktionen sowie Analysen zu ermöglichen.

2. Welche Arten von Cookies verwenden wir?
Wir setzen je nach Einsatz folgende Kategorien ein:

a) Essenzielle Cookies (notwendig)
Diese Cookies sind erforderlich, damit die Website funktioniert (z. B. Seitennavigation, Sicherheit, Spracheinstellungen).
Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem technisch fehlerfreien Betrieb) und – soweit einschlägig – § 25 Abs. 2 Nr. 2 TTDSG.

b) Funktionale Cookies (optional)
Ermöglichen Komfortfunktionen (z. B. bevorzugte Einstellungen).
Rechtsgrundlage: Einwilligung, Art. 6 Abs. 1 lit. a DSGVO i.V.m. § 25 Abs. 1 TTDSG.

c) Statistik/Analyse Cookies (optional)
Helfen uns zu verstehen, wie Besucher die Website nutzen (z. B. Seitenaufrufe, Verweildauer).
Rechtsgrundlage: Einwilligung, Art. 6 Abs. 1 lit. a DSGVO i.V.m. § 25 Abs. 1 TTDSG.

d) Marketing Cookies (optional)
Dienen dazu, Inhalte/Anzeigen zu personalisieren und Kampagnen zu messen.
Rechtsgrundlage: Einwilligung, Art. 6 Abs. 1 lit. a DSGVO i.V.m. § 25 Abs. 1 TTDSG.

3. Einwilligung und Widerruf
Beim ersten Besuch fragen wir Sie (sofern erforderlich) nach Ihrer Einwilligung.
Sie können Ihre Auswahl jederzeit ändern oder widerrufen über: [Link zu Cookie-Einstellungen].

4. Cookies von Drittanbietern
Wenn wir Dienste von Drittanbietern einsetzen (z. B. Analyse- oder Marketingtools), können diese eigene Cookies setzen und Daten verarbeiten. Details finden Sie in den Cookie-Einstellungen und in unserer Datenschutzerklärung.

5. Speicherdauer
Cookies werden entweder nur für die Sitzung gespeichert (Session Cookies) oder bleiben für eine definierte Zeit auf Ihrem Gerät (Persistente Cookies). Die jeweilige Dauer sehen Sie in den Cookie-Einstellungen.
`;

const COOKIE_POLICY_EN = `Cookie Policy (EN) – Germany/EU aligned
Last updated: 28 January 2026
This Cookie Policy explains how Purple Media Group GmbH (“we”, “us”) uses cookies and similar technologies on www.purplecrunchpublishing.com.

1. What are cookies?
Cookies are small text files stored on your device. They help operate a website, keep it secure, and enable features, analytics, and marketing (where applicable).

2. What types of cookies do we use?
Depending on your choices, we may use:

a) Strictly necessary cookies
Required to operate the website (e.g., security, basic functions).
Legal basis: Art. 6(1)(f) GDPR and, where applicable, Sec. 25(2) TTDSG.

b) Functional cookies (optional)
Enable enhanced functionality and personalization.
Legal basis: Consent, Art. 6(1)(a) GDPR + Sec. 25(1) TTDSG.

c) Analytics cookies (optional)
Help us understand how visitors use the site.
Legal basis: Consent, Art. 6(1)(a) GDPR + Sec. 25(1) TTDSG.

d) Marketing cookies (optional)
Used to deliver and measure personalized advertising.
Legal basis: Consent, Art. 6(1)(a) GDPR + Sec. 25(1) TTDSG.

3. Consent and withdrawal
Where required, we ask for consent on your first visit. You can change or withdraw consent at any time via: [Cookie settings link].

4. Third-party cookies
If we use third-party services (e.g., analytics/marketing providers), they may set cookies and process data. Details are provided in Cookie Settings and our Privacy Policy.

5. Retention
Cookies may be session-based or stored for a defined period. Exact retention times are shown in Cookie Settings.
`;

export default function CookiePolicyPage() {
  const [lang, setLang] = useState<Language>("EN");
  const [showPolicy, setShowPolicy] = useState(false);
  const [toast, setToast] = useState<string>("");

  useEffect(() => setLang(readLang()), []);
  useEffect(() => writeLang(lang), [lang]);

  const t = useMemo(() => (lang === "DE" ? TRACKING_DE : TRACKING_EN), [lang]);

  const [prefs, setPrefs] = useState<ConsentState>({ marketing: true, functional: true });

  useEffect(() => {
    const defaults: ConsentState = { marketing: true, functional: true };
    setPrefs(defaults);
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ ...defaults, necessary: true, updatedAt: new Date().toISOString() })
    );
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);

      if (!raw) {
        const defaults = { marketing: true, functional: true };
        setPrefs(defaults);
        localStorage.setItem(
          CONSENT_KEY,
          JSON.stringify({ ...defaults, necessary: true, updatedAt: new Date().toISOString() })
        );
        return;
      }

      const parsed = JSON.parse(raw);

      const marketing =
        typeof parsed?.marketing === "boolean" ? parsed.marketing : true;
      const functional =
        typeof parsed?.functional === "boolean" ? parsed.functional : true;

      setPrefs({ marketing, functional });

      // normalize storage if it was missing fields
      if (marketing !== parsed?.marketing || functional !== parsed?.functional) {
        localStorage.setItem(
          CONSENT_KEY,
          JSON.stringify({ marketing, functional, necessary: true, updatedAt: new Date().toISOString() })
        );
      }
    } catch {
      const defaults = { marketing: true, functional: true };
      setPrefs(defaults);
      localStorage.setItem(
        CONSENT_KEY,
        JSON.stringify({ ...defaults, necessary: true, updatedAt: new Date().toISOString() })
      );
    }
  }, []);

  const save = (next: ConsentState, toastMsg: string) => {
    setPrefs(next);
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({
        ...next,
        updatedAt: new Date().toISOString(),
        necessary: true,
      })
    );
    setToast(toastMsg);
    window.setTimeout(() => setToast(""), 2600);
  };

  return (
    <section className="publishing-page legal-page cookie-page">
      <div className="publishing-hero legal-hero">
        <Container>
          <div className="legal-hero-center">
            <h1 className="publishing-h1 legal-h1">
              {t.heroTitle} <span className="publishing-animated">{t.heroAccent}</span>
            </h1>

            <div className="legal-subtitle">{t.updated}</div>

            <div className="legal-lang-row legal-lang-row--center">
              <button
                type="button"
                className={`legal-lang-btn ${lang === "EN" ? "is-active" : ""}`}
                onClick={() => setLang("EN")}
              >
                English
              </button>
              <button
                type="button"
                className={`legal-lang-btn ${lang === "DE" ? "is-active" : ""}`}
                onClick={() => setLang("DE")}
              >
                Deutsch
              </button>
            </div>
          </div>

          <div className="cookie-consent-card">
            <div className="cookie-consent-head">
              <div className="cookie-consent-title">{t.heading}</div>

              <button
                type="button"
                className="cookie-hint-btn"
                onClick={() => setShowPolicy(true)}
              >
                {t.hintBtn}
              </button>
            </div>

            <div className="cookie-consent-intro">{t.intro}</div>

            <label className="cookie-row">
              <input
                type="checkbox"
                checked={!!prefs.marketing}
                onChange={(e) => setPrefs((p) => ({ ...p, marketing: e.target.checked }))}
              />
              <div className="cookie-row-body">
                <div className="cookie-row-title">{t.marketingLabel}</div>
                <div className="cookie-row-text">{t.marketingText}</div>
              </div>
            </label>

            <label className="cookie-row">
              <input
                type="checkbox"
                checked={!!prefs.functional}
                onChange={(e) => setPrefs((p) => ({ ...p, functional: e.target.checked }))}
              />
              <div className="cookie-row-body">
                <div className="cookie-row-title">{t.functionalLabel}</div>
                <div className="cookie-row-text">{t.functionalText}</div>
              </div>
            </label>

            <div className="cookie-note">{t.note}</div>

            <div className="cookie-actions">
              <button
                type="button"
                className="cookie-btn cookie-btn-primary"
                onClick={() => save({ ...prefs }, t.toastSaved)}
              >
                {t.accept}
              </button>

              <button
                type="button"
                className="cookie-btn cookie-btn-ghost"
                onClick={() => save({ marketing: false, functional: false }, t.toastNecessary)}
              >
                {t.necessaryOnly}
              </button>
            </div>

            {toast ? <div className="cookie-toast">{toast}</div> : null}
          </div>
        </Container>
      </div>

      <Container className="publishing-content legal-content">
        <div className="legal-foot-links">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <span className="dot">•</span>
          <Link to="/terms">Terms &amp; Conditions</Link>
        </div>
      </Container>

      <Modal
        show={showPolicy}
        onHide={() => setShowPolicy(false)}
        centered
        size="lg"
        contentClassName="cookie-modal"
        backdropClassName="cookie-backdrop"
      >
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title>{t.modalTitle}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <pre className="cookie-policy-pre">
            {lang === "DE" ? COOKIE_POLICY_DE : COOKIE_POLICY_EN}
          </pre>
        </Modal.Body>
      </Modal>
    </section>
  );
}
