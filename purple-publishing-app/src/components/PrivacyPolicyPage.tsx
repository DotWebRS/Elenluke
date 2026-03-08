import { useEffect, useMemo, useState } from "react";
import Container from "react-bootstrap/Container";
import { Link, useNavigate } from "react-router-dom";
import Footer from "./Footer";
import "../styles/PrivacyPolicyPage.css";

type Language = "EN" | "DE";
const LS_LANG_KEY = "pcp_lang";

function readLang(): Language {
  const v = (localStorage.getItem(LS_LANG_KEY) || "").toUpperCase();
  return v === "DE" ? "DE" : "EN";
}

function writeLang(lang: Language) {
  localStorage.setItem(LS_LANG_KEY, lang);
}

function renderTextWithLinks(text: string) {
  const parts = text.split(/(\[\[cookie-settings\]\]|\[\[cookie-policy\]\]|\[\[privacy-policy\]\])/g);

  return parts.map((p, i) => {
    if (p === "[[cookie-settings]]") {
      return (
        <Link key={i} className="privacy-inline-link" to="/cookie-policy">
          Cookie Settings
        </Link>
      );
    }

    if (p === "[[cookie-policy]]") {
      return (
        <Link key={i} className="privacy-inline-link" to="/cookie-policy">
          Cookie Policy
        </Link>
      );
    }

    if (p === "[[privacy-policy]]") {
      return (
        <Link key={i} className="privacy-inline-link" to="/privacy-policy">
          Privacy Policy
        </Link>
      );
    }

    return <span key={i}>{p}</span>;
  });
}

type Section = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

type Doc = {
  heroTitle: string;
  heroAccent: string;
  subtitle: string;
  lead: string;
  sections: Section[];
};

const DOC_DE: Doc = {
  heroTitle: "DATENSCHUTZ",
  heroAccent: "ERKLÄRUNG",
  subtitle: "Stand: 28. Januar 2026",
  lead:
    "Diese Datenschutzerklärung informiert Sie darüber, wie Purple Media Group GmbH („wir“, „uns“) personenbezogene Daten bei der Nutzung unserer Website www.purplecrunchpublishing.com verarbeitet.",
  sections: [
    {
      title: "1. Verantwortlicher",
      paragraphs: ["Purple Media Group GmbH\nAm Kreuzbach 12\n91083 Baiersdorf\nGermany"],
    },
    {
      title: "2. Allgemeine Hinweise zur Datenverarbeitung",
      paragraphs: ["Wir verarbeiten personenbezogene Daten nur, soweit dies erforderlich ist, um:"],
      bullets: [
        "die Website bereitzustellen und sicher zu betreiben,",
        "Anfragen zu beantworten,",
        "sowie – sofern Sie einwilligen – die Nutzung der Website zu messen (Analytics) und ggf. Marketingmaßnahmen zu unterstützen.",
      ],
    },
    {
      title: "3. Ihre Rechte",
      paragraphs: ["Sie haben nach der DSGVO – je nach Voraussetzungen – insbesondere das Recht auf:"],
      bullets: [
        "Auskunft,",
        "Berichtigung,",
        "Löschung,",
        "Einschränkung der Verarbeitung,",
        "Datenübertragbarkeit,",
        "Widerspruch gegen Verarbeitungen auf Basis berechtigter Interessen,",
        "Widerruf einer Einwilligung mit Wirkung für die Zukunft (wenn Verarbeitung auf Einwilligung beruht).",
      ],
    },
    {
      title: "3. Ihre Rechte – Hinweis",
      paragraphs: ["Außerdem haben Sie das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren."],
    },
    {
      title: "4. Hosting und Server-Logfiles",
      paragraphs: [
        "Beim Aufruf unserer Website werden technisch notwendige Daten verarbeitet (z. B. IP-Adresse, Datum/Uhrzeit, aufgerufene Seite, Referrer-URL, Browser-/Geräteinformationen). Dies ist erforderlich, um die Website auszuliefern, die Sicherheit zu gewährleisten und Fehler zu analysieren.",
        "Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an sicherem und stabilem Betrieb)\nSpeicherdauer: [z. B. 7–30 Tage]",
      ],
    },
    {
      title: "5. Kontaktaufnahme",
      paragraphs: [
        "Wenn Sie uns per Kontaktformular kontaktieren, verarbeiten wir Ihre Angaben zur Bearbeitung der Anfrage.",
        "Daten: Name, E-Mail-Adresse, Nachricht, ggf. weitere Angaben\nRechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (vorvertraglich/vertraglich) oder Art. 6 Abs. 1 lit. f DSGVO (Beantwortung allgemeiner Anfragen)\nSpeicherdauer: bis Abschluss der Bearbeitung; ggf. darüber hinaus, wenn gesetzliche Aufbewahrungsfristen bestehen",
      ],
    },
    {
      title: "6. Cookies und Einwilligungsmanagement",
      paragraphs: [
        "Wir verwenden Cookies und ähnliche Technologien. Soweit diese nicht technisch erforderlich sind (z. B. Analyse-Cookies), setzen wir sie erst nach Ihrer Einwilligung ein.",
        "Cookie-Einstellungen: [[cookie-settings]]\nCookie-Richtlinie: [[cookie-policy]]\nSie können Ihre Einwilligung jederzeit über die Cookie-Einstellungen ändern oder widerrufen.",
      ],
    },
    {
      title: "7. Google Analytics 4 (Beispiel)",
      paragraphs: [
        "Wir verwenden Google Analytics 4 (GA4), um zu verstehen, wie Besucher unsere Website nutzen, und um unser Angebot zu verbessern.",
        "Anbieter\nGoogle Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland\n(Je nach Verarbeitung kann auch Google LLC, USA, beteiligt sein.)",
        "Welche Daten können verarbeitet werden",
      ],
      bullets: [
        "Nutzungs- und Interaktionsdaten (z. B. Seitenaufrufe, Klicks, Sitzungsinformationen)",
        "Geräte-/Browserinformationen",
        "ungefähre Standortinformationen (z. B. abgeleitet aus IP)",
        "Kennungen/Cookies (abhängig von Einwilligung und Konfiguration)",
      ],
    },
    {
      title: "7. Google Analytics 4 (Beispiel) – Zweck, Rechtsgrundlage, Drittlandübermittlung",
      paragraphs: [
        "Zweck\nReichweitenmessung, Erstellung von Reports, Optimierung von Website-Inhalten und Performance.",
        "Rechtsgrundlage\nEinwilligung: Art. 6 Abs. 1 lit. a DSGVO\nCookies/Endgerätezugriff: Einwilligung, soweit erforderlich (deutsche ePrivacy-Regeln)",
        "Drittlandübermittlung\nDabei kann es zu einer Verarbeitung außerhalb der EU/des EWR kommen (z. B. USA). In diesen Fällen setzen wir geeignete Schutzmaßnahmen ein (z. B. Standardvertragsklauseln und/oder weitere zulässige Mechanismen – abhängig von Googles Konfiguration).",
        "Speicherdauer\n[Bitte eure GA4-Aufbewahrungsdauer einsetzen, z. B. 2 Monate oder 14 Monate]\nWiderruf\nSie können Ihre Einwilligung jederzeit über die Cookie-Einstellungen widerrufen: [[cookie-settings]]",
      ],
    },
    {
      title: "8. Eingebettete Inhalte Dritter (optional)",
      paragraphs: [
        "Wenn wir Inhalte Dritter einbetten (z. B. Videos, Karten, Social-Media-Posts), kann beim Laden des Inhalts eine Datenübertragung an den jeweiligen Anbieter stattfinden. Soweit möglich, laden wir solche Inhalte erst nach Aktivierung/Einwilligung.",
      ],
    },
    {
      title: "9. Speicherdauer",
      paragraphs: [
        "Wir speichern personenbezogene Daten nur so lange, wie es für die genannten Zwecke erforderlich ist, und löschen oder anonymisieren sie anschließend, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.",
      ],
    },
    {
      title: "10. Änderungen dieser Datenschutzerklärung",
      paragraphs: [
        "Wir können diese Datenschutzerklärung anpassen, wenn sich Website, Tools oder rechtliche Anforderungen ändern. Die jeweils aktuelle Version finden Sie auf www.purplecrunchpublishing.com.",
      ],
    },
  ],
};

const DOC_EN: Doc = {
  heroTitle: "PRIVACY",
  heroAccent: "POLICY",
  subtitle: "Last updated: 28 January 2026",
  lead:
    "This Privacy Policy explains how Purple Media Group GmbH (“we”, “us”) processes personal data when you use www.purplecrunchpublishing.com.",
  sections: [
    {
      title: "1. Controller",
      paragraphs: ["Purple Media Group GmbH\nAm Kreuzbach 12\n91083 Baiersdorf\nGermany"],
    },
    {
      title: "2. Overview of processing",
      paragraphs: ["We process personal data only when necessary to:"],
      bullets: [
        "provide and secure the website,",
        "respond to inquiries,",
        "and—where you consent—measure website usage (analytics) and/or support marketing activities.",
      ],
    },
    {
      title: "3. Your rights",
      paragraphs: ["Under the GDPR, you may have the right to:"],
      bullets: [
        "access,",
        "rectification,",
        "erasure,",
        "restriction of processing,",
        "data portability,",
        "object to processing based on legitimate interests,",
        "withdraw consent at any time (where processing is based on consent).",
      ],
    },
    {
      title: "3. Your rights – note",
      paragraphs: ["You also have the right to lodge a complaint with a supervisory authority."],
    },
    {
      title: "4. Hosting and server log files",
      paragraphs: [
        "When you access our website, technical data may be processed in server logs (e.g., IP address, date/time, requested page, referrer URL, browser/device information). This is necessary to deliver the site securely and reliably (e.g., troubleshooting and protection against attacks).",
        "Legal basis: Art. 6(1)(f) GDPR (legitimate interest in secure and stable operation)\nRetention: [e.g., 7–30 days]",
      ],
    },
    {
      title: "5. Contacting us",
      paragraphs: [
        "If you contact us (e.g., by contact form), we process your information to respond.",
        "Data: name, email address, message content, and any other information you provide\nLegal basis: Art. 6(1)(b) GDPR (pre-contractual/contract) or Art. 6(1)(f) GDPR (handling general inquiries)\nRetention: as long as needed to handle the request; longer if required by legal obligations",
      ],
    },
    {
      title: "6. Cookies and consent management",
      paragraphs: [
        "We use cookies and similar technologies. Where required, we ask for your consent before placing non-essential cookies (e.g., analytics). Strictly necessary cookies may be used without consent.",
        "Cookie Settings: [[cookie-settings]]\nCookie Policy: [[cookie-policy]]\nYou can change or withdraw your consent at any time via Cookie Settings.",
      ],
    },
    {
      title: "7. Google Analytics 4 (example)",
      paragraphs: [
        "We use Google Analytics 4 (GA4) to understand how visitors use our website and to improve our services.",
        "Provider\nGoogle Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland\n(Depending on processing, Google LLC (USA) may also be involved.)",
        "Data that may be processed",
      ],
      bullets: [
        "usage and interaction data (e.g., page views, clicks, session information)",
        "device/browser information",
        "approximate location (derived from IP)",
        "identifiers such as cookies and similar technologies (depending on your consent and configuration)",
      ],
    },
    {
      title: "7. Google Analytics 4 (example) – purpose, legal basis, transfers",
      paragraphs: [
        "Purpose\nWebsite analytics, reporting, and improving website content and performance.",
        "Legal basis\nConsent: Art. 6(1)(a) GDPR\nCookies/device access (Germany): consent where required under applicable ePrivacy rules",
        "International transfers\nAnalytics data may be processed outside the EU/EEA (e.g., in the United States). Where this occurs, we rely on appropriate safeguards (e.g., Standard Contractual Clauses and/or other legally recognized mechanisms, depending on Google’s configuration).",
        "Retention\n[insert your GA4 retention period, e.g., 2 months / 14 months]\nHow to withdraw consent\nYou can withdraw your consent at any time via Cookie Settings: [[cookie-settings]]",
      ],
    },
    {
      title: "8. Embedded third-party content (optional)",
      paragraphs: [
        "If we embed third-party content (e.g., videos, maps, social media posts), your data may be transmitted to those providers when the content loads. Where possible, we load embedded content only after activation/consent.",
      ],
    },
    {
      title: "9. Retention",
      paragraphs: [
        "We store personal data only as long as necessary for the purposes described above and/or as required by law. Afterwards, data is deleted or anonymized.",
      ],
    },
    {
      title: "10. Changes to this Privacy Policy",
      paragraphs: [
        "We may update this Privacy Policy to reflect changes to the website, tools, or legal requirements. The latest version is always available on www.purplecrunchpublishing.com.",
      ],
    },
  ],
};

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<Language>("EN");

  useEffect(() => setLang(readLang()), []);
  useEffect(() => writeLang(lang), [lang]);

  const doc = useMemo(() => (lang === "DE" ? DOC_DE : DOC_EN), [lang]);

  return (
    <>
      <section className="privacy-page">
        <div className="privacy-page__bg" />

        <Container className="privacy-page__container">
          <div className="privacy-page__topbar">
            <button
              type="button"
              className="artists-link artists-link--back privacy-back-btn"
              onClick={() => navigate(-1)}
            >
              BACK
            </button>
          </div>

          <div className="privacy-page__hero">
            <h1 className="about-title about-title-centered privacy-main-title">
              {doc.heroTitle} <span className="about-us-animated">{doc.heroAccent}</span>
            </h1>

            <div className="privacy-subtitle">{doc.subtitle}</div>

            <div className="privacy-lang-row">
              <button
                type="button"
                className={`privacy-lang-btn ${lang === "EN" ? "is-active" : ""}`}
                onClick={() => setLang("EN")}
              >
                English
              </button>
              <button
                type="button"
                className={`privacy-lang-btn ${lang === "DE" ? "is-active" : ""}`}
                onClick={() => setLang("DE")}
              >
                Deutsch
              </button>
            </div>

            <p className="privacy-lead" style={{ whiteSpace: "pre-line" }}>
              {doc.lead}
            </p>
          </div>

          <div className="privacy-content">
            {doc.sections.map((s, idx) => (
              <section key={idx} className="privacy-section">
                <h2 className="privacy-h2">{s.title}</h2>

                {s.paragraphs?.map((p, i) => (
                  <p key={i} className="privacy-p" style={{ whiteSpace: "pre-line" }}>
                    {renderTextWithLinks(p)}
                  </p>
                ))}

                {s.bullets?.length ? (
                  <ul className="privacy-list">
                    {s.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                ) : null}

                <div className="privacy-divider" />
              </section>
            ))}

       
          </div>
        </Container>
      </section>

      <Footer />
    </>
  );
}