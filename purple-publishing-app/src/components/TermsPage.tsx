import { useEffect, useMemo, useState } from "react";
import Container from "react-bootstrap/Container";
import { Link, useNavigate } from "react-router-dom";
import Footer from "./Footer";
import "../styles/TermsPage.css";

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
  const parts = text.split(/(\[\[cookie-policy\]\]|\[\[privacy-policy\]\])/g);

  return parts.map((p, i) => {
    if (p === "[[cookie-policy]]") {
      return (
        <Link key={i} className="terms-inline-link" to="/cookie-policy">
          Cookie Policy
        </Link>
      );
    }

    if (p === "[[privacy-policy]]") {
      return (
        <Link key={i} className="terms-inline-link" to="/privacy-policy">
          Privacy Policy
        </Link>
      );
    }

    return <span key={i}>{p}</span>;
  });
}

type Block =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

type Doc = {
  heroTitle: string;
  heroAccent: string;
  subtitle: string;
  headerText: string;
  blocks: Block[];
};

const DOC_DE: Doc = {
  heroTitle: "NUTZUNGS",
  heroAccent: "BEDINGUNGEN",
  subtitle: "Stand: 28. Januar 2026",
  headerText:
    "Diese Nutzungsbedingungen regeln die Nutzung der Website www.purplecrunchpublishing.com („Website“). Betreiber der Website ist:\nPurple Media Group GmbH\nAm Kreuzbach 12, 91083 Baiersdorf, Germany\nMit dem Zugriff auf die Website erklären Sie sich mit diesen Nutzungsbedingungen einverstanden.",
  blocks: [
    {
      type: "p",
      text:
        "1. Zweck der Website\nDie Website dient der Information über unsere Publishing-Aktivitäten sowie der Möglichkeit für Künstler:innen und Rechteinhaber:innen, Musikdemos und Informationen zur Prüfung einzureichen und Sync-Anfragen zu stellen.",
    },
    {
      type: "p",
      text:
        "2. Zulässige Nutzung\nSie verpflichten sich, die Website nur im Rahmen der geltenden Gesetze zu nutzen. Insbesondere ist es untersagt:",
    },
    {
      type: "ul",
      items: [
        "Sicherheitsmechanismen zu umgehen, die Website zu stören oder unbefugt auf Systeme/Daten zuzugreifen,",
        "automatisierte Abrufe (Scraping/Bots) ohne unsere Zustimmung einzusetzen,",
        "rechtswidrige, beleidigende, diskriminierende, schädliche oder sonst unzulässige Inhalte zu übermitteln,",
        "Inhalte hochzuladen, an denen Sie nicht über die erforderlichen Rechte verfügen.",
      ],
    },
    {
      type: "p",
      text:
        "3. Uploads von Demos und Inhalten\nWenn Sie Inhalte (z. B. Audio-Demos, Texte, Metadaten, Cover, EPK) über Formulare oder Upload-Funktionen einreichen („Uploads“), gilt:",
    },
    {
      type: "p",
      text:
        "3.1 Ihre Verantwortung\nSie sichern zu, dass Sie Inhaber:in aller erforderlichen Rechte sind oder über entsprechende Nutzungsrechte/Einwilligungen verfügen (z. B. von Miturheber:innen, Interpret:innen, Labels, Verlagen) und dass keine Rechte Dritter verletzt werden.",
    },
    {
      type: "p",
      text:
        "3.2 Rechte zur Prüfung (Lizenz)\nMit dem Einreichen von Uploads räumen Sie uns ein nicht-exklusives, weltweites, unentgeltliches, widerrufliches Recht ein, die Uploads",
    },
    {
      type: "ul",
      items: [
        "zu speichern, zu vervielfältigen und technisch zu verarbeiten (z. B. Umwandlung/Streaming),",
        "intern zu prüfen, zu bewerten und zu archivieren,",
        "im Rahmen einer Sync-/Pitch-Prüfung ausgewählten Geschäftspartnern (z. B. Supervisor:innen, Labels, Agenturen, Produzent:innen) zugänglich zu machen, sofern dies zur Prüfung einer möglichen Zusammenarbeit erforderlich ist.",
      ],
    },
    {
      type: "p",
      text:
        "Eine darüber hinausgehende Nutzung (z. B. Veröffentlichung, kommerzielle Verwertung) erfolgt nur auf Grundlage gesonderter Vereinbarungen.",
    },
    {
      type: "p",
      text:
        "3.3 Keine Einreichungsvergütung / keine Annahmepflicht\nDas Einreichen von Uploads begründet keinen Anspruch auf Vergütung, Vertragsabschluss oder Rückmeldung. Wir sind nicht verpflichtet, Uploads zu prüfen oder zu beantworten.",
    },
    {
      type: "p",
      text:
        "3.4 Vertraulichkeit\nWir behandeln Uploads grundsätzlich vertraulich im Rahmen üblicher geschäftlicher Abläufe. Bitte beachten Sie jedoch: Eine vollständige Vertraulichkeit gegenüber allen Dritten kann nicht garantiert werden, wenn Sie Inhalte aktiv zur Prüfung einreichen und diese – wie oben beschrieben – zur Pitch-/Prüfung weitergegeben werden müssen.",
    },
    {
      type: "p",
      text:
        "3.5 Entfernung von Uploads\nSie können die Löschung Ihrer Uploads jederzeit anfragen (siehe Kontakt). Gesetzliche Aufbewahrungspflichten bleiben unberührt. Zudem behalten wir uns vor, Uploads zu entfernen, wenn Anhaltspunkte für Rechtsverletzungen bestehen oder Inhalte gegen diese Bedingungen verstoßen.",
    },
    {
      type: "p",
      text:
        "4. Keine Beratung / keine Zusagen\nInformationen auf der Website stellen keine rechtliche oder geschäftliche Beratung dar. Sync- oder Publishing-Deals kommen ausschließlich durch separate schriftliche Vereinbarungen zustande.",
    },
    {
      type: "p",
      text:
        "5. Links und Inhalte Dritter\nSoweit die Website Links oder eingebettete Inhalte Dritter enthält, sind wir für deren Inhalte und Datenschutzpraktiken nicht verantwortlich.",
    },
    {
      type: "p",
      text:
        "6. Verfügbarkeit\nWir bemühen uns um eine hohe Verfügbarkeit, schulden jedoch keine ununterbrochene Erreichbarkeit. Wartungen, Weiterentwicklungen oder Störungen können zu Ausfällen führen.",
    },
    {
      type: "p",
      text:
        "7. Haftung\nWir haften unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie bei Verletzung von Leben, Körper oder Gesundheit.\nBei leichter Fahrlässigkeit haften wir nur bei Verletzung wesentlicher Vertragspflichten und begrenzt auf den vorhersehbaren, typischen Schaden. Zwingende gesetzliche Haftung bleibt unberührt.",
    },
    {
      type: "p",
      text:
        "8. Datenschutz\nInformationen zur Verarbeitung personenbezogener Daten finden Sie in unserer Datenschutzerklärung: [[privacy-policy]].\nInformationen zu Cookies finden Sie in unserer Cookie-Richtlinie: [[cookie-policy]].",
    },
    {
      type: "p",
      text:
        "9. Änderungen dieser Nutzungsbedingungen\nWir können diese Nutzungsbedingungen ändern, wenn dies erforderlich ist (z. B. bei rechtlichen Änderungen oder neuen Funktionen). Die aktuelle Fassung ist auf der Website verfügbar.",
    },
    {
      type: "p",
      text:
        "10. Anwendbares Recht\nEs gilt das Recht der Bundesrepublik Deutschland. Zwingende Verbraucherschutzvorschriften des Landes, in dem Sie sich gewöhnlich aufhalten, bleiben unberührt (soweit anwendbar).",
    },
  ],
};

const DOC_EN: Doc = {
  heroTitle: "TERMS",
  heroAccent: "OF USE",
  subtitle: "Last updated: 28 January 2026",
  headerText:
    "These Terms of Use govern access to and use of www.purplecrunchpublishing.com (the “Website”). The Website is operated by:\nPurple Media Group GmbH\nAm Kreuzbach 12, 91083 Baiersdorf, Germany\nBy accessing or using the Website, you agree to these Terms.",
  blocks: [
    {
      type: "p",
      text:
        "1. Purpose of the Website\nThe Website provides information about our publishing activities and allows artists and rights holders to submit music demos and information for review and to send sync-related inquiries.",
    },
    {
      type: "p",
      text:
        "2. Acceptable use\nYou agree to use the Website in compliance with applicable laws. You must not:",
    },
    {
      type: "ul",
      items: [
        "interfere with the Website’s operation or security, or attempt unauthorized access,",
        "use automated tools (bots/scrapers) without our permission,",
        "submit unlawful, harmful, abusive, discriminatory, or otherwise prohibited content,",
        "upload content unless you have the necessary rights and permissions.",
      ],
    },
    {
      type: "p",
      text:
        "3. Demo submissions and uploads\nIf you submit content (e.g., audio demos, lyrics, metadata, artwork, EPK) via forms or upload functionality (“Submissions”), the following applies:",
    },
    {
      type: "p",
      text:
        "3.1 Your responsibility\nYou represent and warrant that you own or control all necessary rights and permissions (including from co-writers, performers, labels, publishers) and that your Submissions do not infringe third-party rights.",
    },
    {
      type: "p",
      text:
        "3.2 License for review and pitching\nBy submitting Submissions, you grant us a non-exclusive, worldwide, royalty-free, revocable license to:",
    },
    {
      type: "ul",
      items: [
        "store, reproduce, and technically process the Submissions (e.g., transcoding/streaming),",
        "review, evaluate, and archive the Submissions internally,",
        "make the Submissions available to selected business partners (e.g., music supervisors, agencies, producers) to the extent reasonably necessary to evaluate a potential sync/publishing collaboration.",
      ],
    },
    {
      type: "p",
      text:
        "Any use beyond review/pitching (e.g., publication, commercial exploitation) will occur only under a separate written agreement.",
    },
    {
      type: "p",
      text:
        "3.3 No obligation / no compensation\nSubmitting Submissions does not create any entitlement to payment, a deal, or a response. We are not obligated to review or reply to submissions.",
    },
    {
      type: "p",
      text:
        "3.4 Confidentiality\nWe generally treat Submissions as confidential within normal business processes. However, full confidentiality cannot be guaranteed where Submissions must be shared with relevant partners for evaluation as described above.",
    },
    {
      type: "p",
      text:
        "3.5 Removal of submissions\nYou may request deletion of your Submissions at any time (see Contact). Legal retention obligations may still apply. We may remove Submissions if we suspect rights violations or breaches of these Terms.",
    },
    {
      type: "p",
      text:
        "4. No advice; no commitments\nInformation on the Website is for general informational purposes only and does not constitute legal or business advice. Any sync or publishing deal will be formed only through a separate written agreement.",
    },
    {
      type: "p",
      text:
        "5. Third-party links and content\nIf the Website contains links to or embedded content from third parties, we are not responsible for their content or privacy practices.",
    },
    {
      type: "p",
      text:
        "6. Availability\nWe aim to keep the Website available but do not guarantee uninterrupted access. Downtime may occur due to maintenance, updates, or technical issues.",
    },
    {
      type: "p",
      text:
        "7. Liability\nWe are liable without limitation for intent and gross negligence and for injury to life, body, or health.\nFor slight negligence, we are liable only for breach of essential obligations and limited to foreseeable, typical damages. Mandatory statutory liability remains unaffected.",
    },
    {
      type: "p",
      text:
        "8. Privacy\nFor details on how we process personal data, see our Privacy Policy: [[privacy-policy]].\nFor cookies and similar technologies, see our Cookie Policy: [[cookie-policy]].",
    },
    {
      type: "p",
      text:
        "9. Changes to these Terms\nWe may update these Terms where necessary (e.g., changes in law or functionality). The current version will always be available on the Website.",
    },
    {
      type: "p",
      text:
        "10. Governing law\nThese Terms are governed by the laws of Germany. Mandatory consumer protection rules of your country of residence remain unaffected where applicable.",
    },
  ],
};

function isHeadingLine(line: string) {
  const s = (line || "").trim();
  return /^\d+(\.\d+)?\.\s+/.test(s) || /^Nutzungsbedingungen\b/i.test(s) || /^Terms of Use\b/i.test(s);
}

function splitBlockToElements(text: string, keyBase: string) {
  const raw = String(text || "");
  const lines = raw.split("\n");
  const first = (lines[0] || "").trim();
  const rest = lines.slice(1).join("\n").trim();

  if (isHeadingLine(first)) {
    const isSub = /^\d+\.\d+\.\s+/.test(first);

    return (
      <div key={keyBase} className="terms-block">
        {isSub ? (
          <h3 className="terms-h3">{first}</h3>
        ) : (
          <h2 className="terms-h2">{first}</h2>
        )}

        {rest ? (
          <p className="terms-p" style={{ whiteSpace: "pre-line" }}>
            {renderTextWithLinks(rest)}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <p key={keyBase} className="terms-p" style={{ whiteSpace: "pre-line" }}>
      {renderTextWithLinks(raw)}
    </p>
  );
}

export default function TermsPage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<Language>("EN");

  useEffect(() => setLang(readLang()), []);
  useEffect(() => writeLang(lang), [lang]);

  const doc = useMemo(() => (lang === "DE" ? DOC_DE : DOC_EN), [lang]);

  return (
    <>
      <section className="terms-page">
        <div className="terms-page__bg" />

        <Container className="terms-page__container">
          <div className="terms-page__topbar">
            <button
              type="button"
              className="artists-link artists-link--back terms-back-btn"
              onClick={() => navigate(-1)}
            >
              BACK
            </button>
          </div>

          <div className="terms-page__hero">
            <h1 className="about-title about-title-centered terms-main-title">
              {doc.heroTitle} <span className="about-us-animated">{doc.heroAccent}</span>
            </h1>

            <div className="terms-subtitle">{doc.subtitle}</div>

            <div className="terms-lang-row">
              <button
                type="button"
                className={`terms-lang-btn ${lang === "EN" ? "is-active" : ""}`}
                onClick={() => setLang("EN")}
              >
                English
              </button>
              <button
                type="button"
                className={`terms-lang-btn ${lang === "DE" ? "is-active" : ""}`}
                onClick={() => setLang("DE")}
              >
                Deutsch
              </button>
            </div>

            <p className="terms-lead" style={{ whiteSpace: "pre-line" }}>
              {doc.headerText}
            </p>
          </div>

          <div className="terms-content">
            {doc.blocks.map((b, idx) => {
              if (b.type === "ul") {
                return (
                  <ul key={`ul_${idx}`} className="terms-list">
                    {b.items.map((it, i) => (
                      <li key={`ul_${idx}_${i}`}>{it}</li>
                    ))}
                  </ul>
                );
              }

              return splitBlockToElements(b.text, `p_${idx}`);
            })}

        
          </div>
        </Container>
      </section>

      <Footer />
    </>
  );
}