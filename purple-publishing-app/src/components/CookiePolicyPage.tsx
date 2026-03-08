import { useEffect, useMemo, useState } from "react";
import Container from "react-bootstrap/Container";
import Modal from "react-bootstrap/Modal";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Publishing.css";
import Footer from "./Footer";

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
    "Ich stimme zu, dass Cookies verwendet werden dürfen, um mir geeignete Produktvorschläge zu machen und mir personalisierte Werbung auf ausgewählten Plattformen von Marketingpartnern zu zeigen, z. B. Google, Facebook oder Instagram, und zu diesem Zweck Informationen an diese Partner weiterzugeben.",
  functionalLabel: "Funktional",
  functionalText:
    "Ich stimme zu, dass Cookies für Analysen, Performance- und Designverbesserungen sowie für ein personalisiertes Nutzungserlebnis verwendet werden dürfen.",
  note:
    "Mir ist bekannt, dass ich meine Zustimmung jederzeit über die Cookie-Einstellungen widerrufen kann. Wenn du nicht möchtest, dass Purple Crunch Publishing Cookies wie oben beschrieben verwendet, deaktiviere einfach die Kontrollkästchen und bestätige nur die erforderlichen Cookies.",
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
    "I agree that cookies may be used to show me relevant suggestions and personalized advertising on selected marketing partners’ platforms, such as Google, Facebook, or Instagram, and to share information with those partners for this purpose.",
  functionalLabel: "Functional / Analytics",
  functionalText:
    "I agree that cookies may be used to run analytics, improve functionality and performance, and enable a more personalized browsing experience.",
  note:
    "I understand that I can withdraw my consent at any time via Cookie Settings. If you do not want Purple Crunch Publishing to use cookies as described above, simply disable the checkboxes and accept only strictly necessary cookies.",
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

Diese Cookie-Richtlinie erklärt, wie Purple Crunch Publishing Cookies und ähnliche Technologien verwendet.

1. Was sind Cookies?
Cookies sind kleine Textdateien, die auf Ihrem Endgerät gespeichert werden. Sie helfen dabei, eine Website bereitzustellen, sicher zu betreiben und Funktionen sowie Analysen zu ermöglichen.

2. Welche Arten von Cookies verwenden wir?
a) Essenzielle Cookies
Erforderlich für den Betrieb der Website.

b) Funktionale Cookies
Ermöglichen Komfortfunktionen und eine verbesserte Nutzererfahrung.

c) Statistik- / Analyse-Cookies
Helfen uns zu verstehen, wie Besucher die Website nutzen.

d) Marketing-Cookies
Dienen dazu, Inhalte und Anzeigen zu personalisieren und Kampagnen zu messen.

3. Einwilligung und Widerruf
Sie können Ihre Auswahl jederzeit ändern oder widerrufen.

4. Drittanbieter
Wenn wir Dienste von Drittanbietern einsetzen, können diese eigene Cookies setzen und Daten verarbeiten.

5. Speicherdauer
Cookies werden entweder nur für die Sitzung oder für einen definierten Zeitraum gespeichert.
`;

const COOKIE_POLICY_EN = `Cookie Policy
Last updated: 28 January 2026

This Cookie Policy explains how Purple Crunch Publishing uses cookies and similar technologies.

1. What are cookies?
Cookies are small text files stored on your device. They help operate a website, keep it secure, and enable features and analytics.

2. What types of cookies do we use?
a) Strictly necessary cookies
Required to operate the website.

b) Functional cookies
Enable enhanced functionality and a better user experience.

c) Analytics cookies
Help us understand how visitors use the site.

d) Marketing cookies
Used to personalize content and advertising and measure campaigns.

3. Consent and withdrawal
You can change or withdraw your consent at any time.

4. Third-party cookies
If we use third-party services, they may set cookies and process data.

5. Retention
Cookies may be session-based or stored for a defined period.
`;

export default function CookiePolicyPage() {
  const navigate = useNavigate();

  const [lang, setLang] = useState<Language>("EN");
  const [showPolicy, setShowPolicy] = useState(false);
  const [toast, setToast] = useState("");
  const [prefs, setPrefs] = useState<ConsentState>({
    marketing: true,
    functional: true,
  });

  useEffect(() => {
    setLang(readLang());
  }, []);

  useEffect(() => {
    writeLang(lang);
  }, [lang]);

  useEffect(() => {
    const defaults: ConsentState = {
      marketing: true,
      functional: true,
    };

    setPrefs(defaults);

    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({
        ...defaults,
        necessary: true,
        updatedAt: new Date().toISOString(),
      })
    );
  }, []);

  const t = useMemo(() => (lang === "DE" ? TRACKING_DE : TRACKING_EN), [lang]);

  const save = (next: ConsentState, toastMsg: string) => {
    setPrefs(next);

    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({
        ...next,
        necessary: true,
        updatedAt: new Date().toISOString(),
      })
    );

    setToast(toastMsg);
    window.setTimeout(() => setToast(""), 2600);
  };

  return (
    <section className="publishing-page legal-page cookie-page">
      <div className="publishing-hero legal-hero">
        <Container>
          <div className="legal-hero-topbar legal-hero-topbar--center">
            <button
              type="button"
              className="artists-link artists-link--back legal-back-btn"
              onClick={() => navigate(-1)}
            >
              BACK
            </button>
          </div>

          <div className="legal-hero-center">
            <h1 className="about-title about-title-centered legal-main-title">
              {t.heroTitle} <span className="about-us-animated">{t.heroAccent}</span>
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
                checked={prefs.marketing}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, marketing: e.target.checked }))
                }
              />
              <div className="cookie-row-body">
                <div className="cookie-row-title">{t.marketingLabel}</div>
                <div className="cookie-row-text">{t.marketingText}</div>
              </div>
            </label>

            <label className="cookie-row">
              <input
                type="checkbox"
                checked={prefs.functional}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, functional: e.target.checked }))
                }
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
                onClick={() =>
                  save({ marketing: false, functional: false }, t.toastNecessary)
                }
              >
                {t.necessaryOnly}
              </button>
            </div>

            {toast ? <div className="cookie-toast">{toast}</div> : null}
          </div>
        </Container>
      </div>

      <Footer/>


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