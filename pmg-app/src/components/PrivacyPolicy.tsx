import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";


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

export default function PrivacyPolicy() {
  const [lang, setLang] = useState<Lang>(() => getInitialLang());

  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("legalLang", lang);
  }, [lang]);

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
                  {lang === "EN" ? "Privacy Policy" : "Datenschutzerklärung"}
                </h1>
                <p className="legal__subtitle">
                  {lang === "EN"
                    ? "Last updated: 28 January 2026"
                    : "Stand: 28. Januar 2026"}
                </p>
              </div>

              <LangToggle lang={lang} onChange={setLang} />
            </div>
          </header>

          <div className="legal__card">
            {lang === "EN" ? (
              <>
                <div className="legal__section">
                  <h2 className="legal__h2">1. Controller</h2>
                  <address className="legal__address">
                    <div className="legal__strong">Purple Media Group GmbH</div>
                    <div>Am Kreuzbach 12</div>
                    <div>91083 Baiersdorf</div>
                    <div>Germany</div>
                  </address>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">2. Overview of processing</h2>
                  <p className="legal__p">
                    We process personal data only when necessary to: provide and
                    secure the website, respond to inquiries, and—where you
                    consent—measure website usage (analytics) and/or support
                    marketing activities.
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">3. Your rights</h2>
                  <p className="legal__p">
                    Under the GDPR, you may have the right to: access,
                    rectification, erasure, restriction of processing, data
                    portability, object to processing based on legitimate
                    interests, withdraw consent at any time (where processing is
                    based on consent). You also have the right to lodge a
                    complaint with a supervisory authority.
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">4. Hosting and server log files</h2>
                  <p className="legal__p">
                    When you access our website, technical data may be processed
                    in server logs (e.g., IP address, date/time, requested page,
                    referrer URL, browser/device information). This is necessary
                    to deliver the site securely and reliably (e.g.,
                    troubleshooting and protection against attacks).
                  </p>
                  <p className="legal__p">
                    Legal basis: Art. 6(1)(f) GDPR (legitimate interest in secure
                    and stable operation)
                  </p>
                  <p className="legal__p">Retention: [e.g., 7–30 days]</p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">5. Contacting us</h2>
                  <p className="legal__p">
                    If you contact us (e.g., by contact form), we process your
                    information to respond.
                  </p>
                  <p className="legal__p">
                    Data: name, email address, message content, and any other
                    information you provide
                  </p>
                  <p className="legal__p">
                    Legal basis: Art. 6(1)(b) GDPR (pre-contractual/contract) or
                    Art. 6(1)(f) GDPR (handling general inquiries)
                  </p>
                  <p className="legal__p">
                    Retention: as long as needed to handle the request; longer
                    if required by legal obligations
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">6. Cookies and consent management</h2>
                  <p className="legal__p">
                    We use cookies and similar technologies. Where required, we
                    ask for your consent before placing non-essential cookies
                    (e.g., analytics). Strictly necessary cookies may be used
                    without consent.
                  </p>
                  <p className="legal__p">
                    Cookie Settings: [cookie settings link – provided by your
                    cookie banner/consent tool]
                  </p>
                  <p className="legal__p">
                    Cookie Policy:{" "}
                    <Link className="legal__link" to="/cookies">
                      Cookie Policy
                    </Link>
                  </p>
                  <p className="legal__p">
                    You can change or withdraw your consent at any time via
                    Cookie Settings.
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">7. Google Analytics 4 (example)</h2>
                  <p className="legal__p">
                    We use Google Analytics 4 (GA4) to understand how visitors
                    use our website and to improve our services.
                  </p>

                  <h3 className="legal__h3">Provider</h3>
                  <p className="legal__p">
                    Google Ireland Limited, Gordon House, Barrow Street, Dublin
                    4, Ireland (Depending on processing, Google LLC (USA) may
                    also be involved.)
                  </p>

                  <h3 className="legal__h3">Data that may be processed</h3>
                  <p className="legal__p">
                    usage and interaction data (e.g., page views, clicks,
                    session information), device/browser information, approximate
                    location (derived from IP), identifiers such as cookies and
                    similar technologies (depending on your consent and
                    configuration)
                  </p>

                  <h3 className="legal__h3">Purpose</h3>
                  <p className="legal__p">
                    Website analytics, reporting, and improving website content
                    and performance.
                  </p>

                  <h3 className="legal__h3">Legal basis</h3>
                  <p className="legal__p">
                    Consent: Art. 6(1)(a) GDPR. Cookies/device access (Germany):
                    consent where required under applicable ePrivacy rules
                  </p>

                  <h3 className="legal__h3">International transfers</h3>
                  <p className="legal__p">
                    Analytics data may be processed outside the EU/EEA (e.g., in
                    the United States). Where this occurs, we rely on
                    appropriate safeguards (e.g., Standard Contractual Clauses
                    and/or other legally recognized mechanisms, depending on
                    Google’s configuration).
                  </p>

                  <h3 className="legal__h3">Retention</h3>
                  <p className="legal__p">
                    [insert your GA4 retention period, e.g., 2 months / 14
                    months]
                  </p>

                  <h3 className="legal__h3">How to withdraw consent</h3>
                  <p className="legal__p">
                    You can withdraw your consent at any time via Cookie
                    Settings: [link]
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">
                    8. Embedded third-party content (optional)
                  </h2>
                  <p className="legal__p">
                    If we embed third-party content (e.g., videos, maps, social
                    media posts), your data may be transmitted to those
                    providers when the content loads. Where possible, we load
                    embedded content only after activation/consent.
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">9. Retention</h2>
                  <p className="legal__p">
                    We store personal data only as long as necessary for the
                    purposes described above and/or as required by law.
                    Afterwards, data is deleted or anonymized.
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">10. Changes to this Privacy Policy</h2>
                  <p className="legal__p">
                    We may update this Privacy Policy to reflect changes to the
                    website, tools, or legal requirements. The latest version is
                    always available on www.purplecrunchpublishing.com.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="legal__section">
                  <h2 className="legal__h2">1. Verantwortlicher</h2>
                  <address className="legal__address">
                    <div className="legal__strong">Purple Media Group GmbH</div>
                    <div>Am Kreuzbach 12</div>
                    <div>91083 Baiersdorf</div>
                    <div>Germany</div>
                  </address>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">
                    2. Allgemeine Hinweise zur Datenverarbeitung
                  </h2>
                  <p className="legal__p">
                    Wir verarbeiten personenbezogene Daten nur, soweit dies
                    erforderlich ist, um: die Website bereitzustellen und sicher
                    zu betreiben, Anfragen zu beantworten, sowie – sofern Sie
                    einwilligen – die Nutzung der Website zu messen (Analytics)
                    und ggf. Marketingmaßnahmen zu unterstützen.
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">3. Ihre Rechte</h2>
                  <p className="legal__p">
                    Sie haben nach der DSGVO – je nach Voraussetzungen –
                    insbesondere das Recht auf: Auskunft, Berichtigung, Löschung,
                    Einschränkung der Verarbeitung, Datenübertragbarkeit,
                    Widerspruch gegen Verarbeitungen auf Basis berechtigter
                    Interessen, Widerruf einer Einwilligung mit Wirkung für die
                    Zukunft (wenn Verarbeitung auf Einwilligung beruht).
                    Außerdem haben Sie das Recht, sich bei einer
                    Datenschutzaufsichtsbehörde zu beschweren.
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">4. Hosting und Server-Logfiles</h2>
                  <p className="legal__p">
                    Beim Aufruf unserer Website werden technisch notwendige Daten
                    verarbeitet (z. B. IP-Adresse, Datum/Uhrzeit, aufgerufene
                    Seite, Referrer-URL, Browser-/Geräteinformationen). Dies ist
                    erforderlich, um die Website auszuliefern, die Sicherheit zu
                    gewährleisten und Fehler zu analysieren.
                  </p>
                  <p className="legal__p">
                    Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
                    Interesse an sicherem und stabilem Betrieb)
                  </p>
                  <p className="legal__p">Speicherdauer: [z. B. 7–30 Tage]</p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">5. Kontaktaufnahme</h2>
                  <p className="legal__p">
                    Wenn Sie uns per Kontaktformular kontaktieren, verarbeiten
                    wir Ihre Angaben zur Bearbeitung der Anfrage.
                  </p>
                  <p className="legal__p">
                    Daten: Name, E-Mail-Adresse, Nachricht, ggf. weitere Angaben
                  </p>
                  <p className="legal__p">
                    Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO
                    (vorvertraglich/vertraglich) oder Art. 6 Abs. 1 lit. f DSGVO
                    (Beantwortung allgemeiner Anfragen)
                  </p>
                  <p className="legal__p">
                    Speicherdauer: bis Abschluss der Bearbeitung; ggf. darüber
                    hinaus, wenn gesetzliche Aufbewahrungsfristen bestehen
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">6. Cookies und Einwilligungsmanagement</h2>
                  <p className="legal__p">
                    Wir verwenden Cookies und ähnliche Technologien. Soweit diese
                    nicht technisch erforderlich sind (z. B. Analyse-Cookies),
                    setzen wir sie erst nach Ihrer Einwilligung ein.
                  </p>
                  <p className="legal__p">
                    Cookie-Einstellungen: [Link zu Cookie-Einstellungen – wird
                    vom Cookie-Banner/Consent-Tool bereitgestellt]
                  </p>
                  <p className="legal__p">
                    Cookie-Richtlinie:{" "}
                    <Link className="legal__link" to="/cookies">
                      Cookie Policy
                    </Link>
                  </p>
                  <p className="legal__p">
                    Sie können Ihre Einwilligung jederzeit über die
                    Cookie-Einstellungen ändern oder widerrufen.
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">7. Google Analytics 4 (Beispiel)</h2>
                  <p className="legal__p">
                    Wir verwenden Google Analytics 4 (GA4), um zu verstehen, wie
                    Besucher unsere Website nutzen, und um unser Angebot zu
                    verbessern.
                  </p>

                  <h3 className="legal__h3">Anbieter</h3>
                  <p className="legal__p">
                    Google Ireland Limited, Gordon House, Barrow Street, Dublin
                    4, Irland (Je nach Verarbeitung kann auch Google LLC, USA,
                    beteiligt sein.)
                  </p>

                  <h3 className="legal__h3">Welche Daten können verarbeitet werden</h3>
                  <p className="legal__p">
                    Nutzungs- und Interaktionsdaten (z. B. Seitenaufrufe, Klicks,
                    Sitzungsinformationen) Geräte-/Browserinformationen,
                    ungefähre Standortinformationen (z. B. abgeleitet aus IP),
                    Kennungen/Cookies (abhängig von Einwilligung und Konfiguration)
                  </p>

                  <h3 className="legal__h3">Zweck</h3>
                  <p className="legal__p">
                    Reichweitenmessung, Erstellung von Reports, Optimierung von
                    Website-Inhalten und Performance.
                  </p>

                  <h3 className="legal__h3">Rechtsgrundlage</h3>
                  <p className="legal__p">
                    Einwilligung: Art. 6 Abs. 1 lit. a DSGVO. Cookies/Endgerätezugriff:
                    Einwilligung, soweit erforderlich (deutsche ePrivacy-Regeln)
                  </p>

                  <h3 className="legal__h3">Drittlandübermittlung</h3>
                  <p className="legal__p">
                    Dabei kann es zu einer Verarbeitung außerhalb der EU/des EWR
                    kommen (z. B. USA). In diesen Fällen setzen wir geeignete
                    Schutzmaßnahmen ein (z. B. Standardvertragsklauseln und/oder
                    weitere zulässige Mechanismen – abhängig von Googles
                    Konfiguration).
                  </p>

                  <h3 className="legal__h3">Speicherdauer</h3>
                  <p className="legal__p">
                    [Bitte eure GA4-Aufbewahrungsdauer einsetzen, z. B. 2 Monate
                    oder 14 Monate]
                  </p>

                  <h3 className="legal__h3">Widerruf</h3>
                  <p className="legal__p">
                    Sie können Ihre Einwilligung jederzeit über die
                    Cookie-Einstellungen widerrufen: [Link]
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">8. Eingebettete Inhalte Dritter (optional)</h2>
                  <p className="legal__p">
                    Wenn wir Inhalte Dritter einbetten (z. B. Videos, Karten,
                    Social-Media-Posts), kann beim Laden des Inhalts eine
                    Datenübertragung an den jeweiligen Anbieter stattfinden.
                    Soweit möglich, laden wir solche Inhalte erst nach
                    Aktivierung/Einwilligung.
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">9. Speicherdauer</h2>
                  <p className="legal__p">
                    Wir speichern personenbezogene Daten nur so lange, wie es
                    für die genannten Zwecke erforderlich ist, und löschen oder
                    anonymisieren sie anschließend, sofern keine gesetzlichen
                    Aufbewahrungspflichten entgegenstehen.
                  </p>
                </div>

                <div className="legal__section">
                  <h2 className="legal__h2">
                    10. Änderungen dieser Datenschutzerklärung
                  </h2>
                  <p className="legal__p">
                    Wir können diese Datenschutzerklärung anpassen, wenn sich
                    Website, Tools oder rechtliche Anforderungen ändern. Die
                    jeweils aktuelle Version finden Sie auf
                    www.purplecrunchpublishing.com.
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
