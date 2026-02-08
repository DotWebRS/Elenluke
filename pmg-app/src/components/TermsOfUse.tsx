import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

type Lang = "DE" | "EN";

/* default = EN */
function getInitialLang(): Lang {
  const v = localStorage.getItem("legalLang");
  return v === "DE" ? "DE" : "EN";
}

function LangToggle({
  lang,
  onChange,
}: {
  lang: Lang;
  onChange: (l: Lang) => void;
}) {
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

export default function TermsOfUse() {
  const [lang, setLang] = useState<Lang>(() => getInitialLang());

  useEffect(() => {
    localStorage.setItem("legalLang", lang);
  }, [lang]);

  const navigate = useNavigate();

  return (
    <main className="page">
      <section className="legal">
        <div className="legal__bg" aria-hidden="true" />
        <div className="legal__fadeTop" aria-hidden="true" />
        <div className="legal__fadeBottom" aria-hidden="true" />

        <div className="legal__inner">
          <header className="legal__header">
            <div className="legal__headerRow">
              <button
                type="button"
                className="legal__back"
                onClick={() => navigate(-1)}
                aria-label="Go back"
              >
                ← Back
              </button>
              <div>
                <h1 className="legal__title">
                  {lang === "EN" ? "Terms of Use" : "Nutzungsbedingungen"}
                </h1>
                <p className="legal__subtitle">
                  {lang === "EN" ? "Last updated: 28 January 2026" : "Stand: 28. Januar 2026"}
                </p>
              </div>

              <LangToggle lang={lang} onChange={setLang} />
            </div>
          </header>

          <div className="legal__card">
            {lang === "EN" ? (
              <>
                <p className="legal__p">
                  These Terms of Use govern access to and use of www.purplecrunchpublishing.com (the “Website”). The Website is operated by:
                </p>

                <address className="legal__address">
                  <div className="legal__strong">Purple Media Group GmbH</div>
                  <div>Am Kreuzbach 12</div>
                  <div>91083 Baiersdorf</div>
                  <div>Germany</div>
                </address>

                <p className="legal__p">
                  By accessing or using the Website, you agree to these Terms.
                </p>

                <div className="legal__section">
                  <h2 className="legal__h2">1. Purpose of the Website</h2>
                  <p className="legal__p">
                    The Website provides information about our publishing activities and allows artists and rights holders to submit music demos and information for review and to send sync-related inquiries.
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">2. Acceptable use</h2>
                  <p className="legal__p">
                    You agree to use the Website in compliance with applicable laws. You must not:
                    interfere with the Website’s operation or security, or attempt unauthorized access,
                    use automated tools (bots/scrapers) without our permission,
                    submit unlawful, harmful, abusive, discriminatory, or otherwise prohibited content,
                    upload content unless you have the necessary rights and permissions.
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">3. Demo submissions and uploads</h2>

                  <h3 className="legal__h3">3.1 Your responsibility</h3>
                  <p className="legal__p">
                    You represent and warrant that you own or control all necessary rights and permissions (including from co-writers, performers, labels, publishers) and that your Submissions do not infringe third-party rights.
                  </p>

                  <h3 className="legal__h3">3.2 License for review and pitching</h3>
                  <p className="legal__p">
                    By submitting Submissions, you grant us a non-exclusive, worldwide, royalty-free, revocable license to:
                    store, reproduce, and technically process the Submissions (e.g., transcoding/streaming),
                    review, evaluate, and archive the Submissions internally,
                    make the Submissions available to selected business partners (e.g., music supervisors, agencies, producers) to the extent reasonably necessary to evaluate a potential sync/publishing collaboration.
                    Any use beyond review/pitching (e.g., publication, commercial exploitation) will occur only under a separate written agreement.
                  </p>

                  <h3 className="legal__h3">3.3 No obligation / no compensation</h3>
                  <p className="legal__p">
                    Submitting Submissions does not create any entitlement to payment, a deal, or a response. We are not obligated to review or reply to submissions.
                  </p>

                  <h3 className="legal__h3">3.4 Confidentiality</h3>
                  <p className="legal__p">
                    We generally treat Submissions as confidential within normal business processes. However, full confidentiality cannot be guaranteed where Submissions must be shared with relevant partners for evaluation as described above.
                  </p>

                  <h3 className="legal__h3">3.5 Removal of submissions</h3>
                  <p className="legal__p">
                    You may request deletion of your Submissions at any time (see Contact). Legal retention obligations may still apply. We may remove Submissions if we suspect rights violations or breaches of these Terms.
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">4. No advice; no commitments</h2>
                  <p className="legal__p">
                    Information on the Website is for general informational purposes only and does not constitute legal or business advice. Any sync or publishing deal will be formed only through a separate written agreement.
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">5. Third-party links and content</h2>
                  <p className="legal__p">
                    If the Website contains links to or embedded content from third parties, we are not responsible for their content or privacy practices.
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">6. Availability</h2>
                  <p className="legal__p">
                    We aim to keep the Website available but do not guarantee uninterrupted access. Downtime may occur due to maintenance, updates, or technical issues.
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">7. Liability</h2>
                  <p className="legal__p">
                    We are liable without limitation for intent and gross negligence and for injury to life, body, or health.
                    For slight negligence, we are liable only for breach of essential obligations and limited to foreseeable, typical damages. Mandatory statutory liability remains unaffected.
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">8. Privacy</h2>
                  <p className="legal__p">
                    For details on how we process personal data, see our{" "}
                    <Link className="legal__link" to="/privacy">Privacy Policy</Link>.
                  </p>
                  <p className="legal__p">
                    For cookies and similar technologies, see our{" "}
                    <Link className="legal__link" to="/cookies">Cookie Policy</Link>.
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">9. Changes to these Terms</h2>
                  <p className="legal__p">
                    We may update these Terms where necessary (e.g., changes in law or functionality). The current version will always be available on the Website.
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">10. Governing law</h2>
                  <p className="legal__p">
                    These Terms are governed by the laws of Germany. Mandatory consumer protection rules of your country of residence remain unaffected where applicable.
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="legal__p">
                  Diese Nutzungsbedingungen regeln die Nutzung der Website www.purplecrunchpublishing.com („Website“). Betreiber der Website ist:
                </p>

                <address className="legal__address">
                  <div className="legal__strong">Purple Media Group GmbH</div>
                  <div>Am Kreuzbach 12</div>
                  <div>91083 Baiersdorf</div>
                  <div>Germany</div>
                </address>

                <p className="legal__p">
                  Mit dem Zugriff auf die Website erklären Sie sich mit diesen Nutzungsbedingungen einverstanden.
                </p>

                <div className="legal__section">
                  <h2 className="legal__h2">1. Zweck der Website</h2>
                  <p className="legal__p">
                    Die Website dient der Information über unsere Publishing-Aktivitäten sowie der Möglichkeit für Künstler:innen und Rechteinhaber:innen, Musikdemos und Informationen zur Prüfung einzureichen und Sync-Anfragen zu stellen.
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">2. Zulässige Nutzung</h2>
                  <p className="legal__p">
                    Sie verpflichten sich, die Website nur im Rahmen der geltenden Gesetze zu nutzen. Insbesondere ist es untersagt:
                    Sicherheitsmechanismen zu umgehen, die Website zu stören oder unbefugt auf Systeme/Daten zuzugreifen,
                    automatisierte Abrufe (Scraping/Bots) ohne unsere Zustimmung einzusetzen,
                    rechtswidrige, beleidigende, diskriminierende, schädliche oder sonst unzulässige Inhalte zu übermitteln,
                    Inhalte hochzuladen, an denen Sie nicht über die erforderlichen Rechte verfügen.
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">3. Uploads von Demos und Inhalten</h2>

                  <h3 className="legal__h3">3.1 Ihre Verantwortung</h3>
                  <p className="legal__p">
                    Sie sichern zu, dass Sie Inhaber:in aller erforderlichen Rechte sind oder über entsprechende Nutzungsrechte/Einwilligungen verfügen (z. B. von Miturheber:innen, Interpret:innen, Labels, Verlagen) und dass keine Rechte Dritter verletzt werden.
                  </p>

                  <h3 className="legal__h3">3.2 Rechte zur Prüfung (Lizenz)</h3>
                  <p className="legal__p">
                    Mit dem Einreichen von Uploads räumen Sie uns ein nicht-exklusives, weltweites, unentgeltliches, widerrufliches Recht ein, die Uploads zu speichern, zu vervielfältigen und technisch zu verarbeiten (z. B. Umwandlung/Streaming), intern zu prüfen, zu bewerten und zu archivieren, im Rahmen einer Sync-/Pitch-Prüfung ausgewählten Geschäftspartnern zugänglich zu machen, sofern dies zur Prüfung einer möglichen Zusammenarbeit erforderlich ist. Eine darüber hinausgehende Nutzung erfolgt nur auf Grundlage gesonderter Vereinbarungen.
                  </p>

                  <h3 className="legal__h3">3.3 Keine Einreichungsvergütung / keine Annahmepflicht</h3>
                  <p className="legal__p">
                    Das Einreichen von Uploads begründet keinen Anspruch auf Vergütung, Vertragsabschluss oder Rückmeldung. Wir sind nicht verpflichtet, Uploads zu prüfen oder zu beantworten.
                  </p>

                  <h3 className="legal__h3">3.4 Vertraulichkeit</h3>
                  <p className="legal__p">
                    Wir behandeln Uploads grundsätzlich vertraulich im Rahmen üblicher geschäftlicher Abläufe. Bitte beachten Sie jedoch: Eine vollständige Vertraulichkeit gegenüber allen Dritten kann nicht garantiert werden, wenn Sie Inhalte aktiv zur Prüfung einreichen und diese – wie beschrieben – zur Pitch-/Prüfung weitergegeben werden müssen.
                  </p>

                  <h3 className="legal__h3">3.5 Entfernung von Uploads</h3>
                  <p className="legal__p">
                    Sie können die Löschung Ihrer Uploads jederzeit anfragen (siehe Kontakt). Gesetzliche Aufbewahrungspflichten bleiben unberührt. Zudem behalten wir uns vor, Uploads zu entfernen, wenn Anhaltspunkte für Rechtsverletzungen bestehen oder Inhalte gegen diese Bedingungen verstoßen.
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">4. Keine Beratung / keine Zusagen</h2>
                  <p className="legal__p">
                    Informationen auf der Website stellen keine rechtliche oder geschäftliche Beratung dar. Sync- oder Publishing-Deals kommen ausschließlich durch separate schriftliche Vereinbarungen zustande.
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">5. Links und Inhalte Dritter</h2>
                  <p className="legal__p">
                    Soweit die Website Links oder eingebettete Inhalte Dritter enthält, sind wir für deren Inhalte und Datenschutzpraktiken nicht verantwortlich.
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">6. Verfügbarkeit</h2>
                  <p className="legal__p">
                    Wir bemühen uns um eine hohe Verfügbarkeit, schulden jedoch keine ununterbrochene Erreichbarkeit. Wartungen, Weiterentwicklungen oder Störungen können zu Ausfällen führen.
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">7. Haftung</h2>
                  <p className="legal__p">
                    Wir haften unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie bei Verletzung von Leben, Körper oder Gesundheit.
                    Bei leichter Fahrlässigkeit haften wir nur bei Verletzung wesentlicher Vertragspflichten und begrenzt auf den vorhersehbaren, typischen Schaden. Zwingende gesetzliche Haftung bleibt unberührt.
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">8. Datenschutz</h2>
                  <p className="legal__p">
                    Informationen zur Verarbeitung personenbezogener Daten finden Sie in unserer{" "}
                    <Link className="legal__link" to="/privacy">Datenschutzerklärung</Link>.
                  </p>
                  <p className="legal__p">
                    Informationen zu Cookies finden Sie in unserer{" "}
                    <Link className="legal__link" to="/cookies">Cookie-Richtlinie</Link>.
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">9. Änderungen dieser Nutzungsbedingungen</h2>
                  <p className="legal__p">
                    Wir können diese Nutzungsbedingungen ändern, wenn dies erforderlich ist (z. B. bei rechtlichen Änderungen oder neuen Funktionen). Die aktuelle Fassung ist auf der Website verfügbar.
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">10. Anwendbares Recht</h2>
                  <p className="legal__p">
                    Es gilt das Recht der Bundesrepublik Deutschland. Zwingende Verbraucherschutzvorschriften des Landes, in dem Sie sich gewöhnlich aufhalten, bleiben unberührt (soweit anwendbar).
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
