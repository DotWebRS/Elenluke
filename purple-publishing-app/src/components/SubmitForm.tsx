import { useMemo, useState, type FormEvent } from "react";
import BottomNav from "./BottomNav";
import Footer from "./Footer";
import { Link } from "react-router-dom";

import { API_BASE } from "../config/apiBase";

type SubmissionType =
  | "SyncRequest"
  | "GeneralContactInquiry"
  | "SupportForm"
  | "ArtistInformation"
  | "SongwriterInformation";

type ExtraFields = Record<string, string>;

function buildUrl(path: string) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return base ? `${base}/${p}` : `/${p}`;
}

const DISCLAIMER =
  "We carefully review all submissions and evaluate if they fit our network or not. Due to the high amount of submissions we can’t guarantee that all submissions will be answered. If accepted we will get back to you shortly.";

function looksLikeFullName(v: string) {
  const parts = (v || "").trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
  return parts.length >= 2;
}

function calcAgeFromISO(dobIso: string): number | null {
  const s = (dobIso || "").trim();
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function isAllowedImage(file: File) {
  const n = (file.name || "").toLowerCase();
  const extOk = n.endsWith(".png") || n.endsWith(".jpg") || n.endsWith(".jpeg");
  const t = (file.type || "").toLowerCase();
  const typeOk = t === "image/png" || t === "image/jpeg";
  return extOk || typeOk;
}

const SubmitForm = () => {
  // Type MUST be selected (mandatory) -> start empty and force selection
  const [type, setType] = useState<SubmissionType | "">("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [message, setMessage] = useState("");

  // Privacy policy must be filled/accepted
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const [fields, setFields] = useState<ExtraFields>({
    company: "",
    phone: "",

    productionName: "",
    songTitle: "",
    mediaType: "",
    term: "",
    territory: "",

    issueType: "",

    // ArtistInformation
    fullLegalName: "",
    streetNumber: "",
    zipCode: "",
    city: "",
    country: "",
    dayOfBirth: "",
    instagram: "",
    businessEmail: "",
    spotifyUrl: "",
    appleArtistId: "",
    downtownEmail: "",
    pro: "",
    ipi: "",
    publisher: "",
    publisherIpiCae: "",
    genre: "",

    // Guardian (only if under 18)
    guardianFullLegalName: "",
    guardianEmail: "",

    // SongwriterInformation
    origin: "",
    age: "",
    yearsMakingMusic: "",
    biography: "",
    notableAchievements: "",
    songwriterLinks: "",
  });

  // Publishing: DemoUpload removed. Upload only relevant here is songwriter photo.
  const [files, setFiles] = useState<File[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [okId, setOkId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const isSongwriter = type === "SongwriterInformation";
  const needsFiles = isSongwriter;

  const ageFromDob = useMemo(() => calcAgeFromISO(fields.dayOfBirth), [fields.dayOfBirth]);
  const isMinor = type === "ArtistInformation" && typeof ageFromDob === "number" && ageFromDob < 18;

  const visibleFieldKeys = useMemo(() => {
    switch (type) {
      case "SyncRequest":
        return ["company", "phone", "productionName", "songTitle", "mediaType", "term", "territory"];
      case "GeneralContactInquiry":
        return ["company", "phone"];
      case "SupportForm":
        return ["issueType"]; // projectUrl removed
      case "ArtistInformation":
        return [
          "fullLegalName",
          "streetNumber",
          "zipCode",
          "city",
          "country",
          "dayOfBirth",
          "instagram", // optional
          "businessEmail",
          "spotifyUrl",
          "appleArtistId",
          "downtownEmail",
          "pro",
          "ipi",
          "publisher",
          "publisherIpiCae",
          "genre",
        ];
      case "SongwriterInformation":
        return [
          "fullLegalName",
          "origin",
          "age",
          "yearsMakingMusic",
          "genre",
          "biography",
          "notableAchievements",
          "songwriterLinks",
        ];
      default:
        return [];
    }
  }, [type]);

  const setField = (key: string, value: string) => {
    setFields((p) => ({ ...p, [key]: value }));
  };

  const onFilesChange = (list: FileList | null) => {
    if (!list) {
      setFiles([]);
      return;
    }
    setFiles(Array.from(list));
  };

  const totalBytes = useMemo(() => files.reduce((s, f) => s + (f?.size || 0), 0), [files]);

  const validate = () => {
    const n = name.trim();
    const e = email.trim();
    const msg = message.trim();

    if (!type) return "Submission Type is required.";
    if (!n || !e) return "Name and Email are required.";
    if (!looksLikeFullName(n)) return "In Name box enter First name Last name.";
    if (!privacyAccepted) return "Privacy policy must be accepted.";

    // Message mandatory: General Contact + Support
    if ((type === "GeneralContactInquiry" || type === "SupportForm") && !msg)
      return "Message is required.";

    if (totalBytes > 20 * 1024 * 1024) return "Total upload size must be 20MB or less.";

    if (type === "ArtistInformation") {
      const required = [
        "fullLegalName",
        "streetNumber",
        "zipCode",
        "city",
        "country",
        "dayOfBirth",
        "businessEmail",
        "spotifyUrl",
        "appleArtistId",
      ];

      for (const k of required) {
        if (!(fields[k] ?? "").trim()) return `${labelFor(k)} is required.`;
      }

      const legal = (fields.fullLegalName ?? "").trim();
      if (!looksLikeFullName(legal)) return "Full legal name must be First Name Last name.";

      const apple = (fields.appleArtistId ?? "").trim();
      if (apple && !/^\d{10}$/.test(apple)) return "Apple Artist ID must be exactly 10 digits.";

      // Under 18: guardian full legal name + email mandatory
      if (isMinor) {
        const gName = (fields.guardianFullLegalName ?? "").trim();
        const gEmail = (fields.guardianEmail ?? "").trim();
        if (!gName) return "Guardian full legal name is required for minors.";
        if (!looksLikeFullName(gName)) return "Guardian full legal name must be First Name Last name.";
        if (!gEmail) return "Guardian email address is required for minors.";
      }
    }

    if (type === "SongwriterInformation") {
      const required = ["fullLegalName", "origin", "age", "yearsMakingMusic", "genre", "biography", "notableAchievements"];
      for (const k of required) {
        if (!(fields[k] ?? "").trim()) return `${labelFor(k)} is required.`;
      }

      const legal = (fields.fullLegalName ?? "").trim();
      if (!looksLikeFullName(legal)) return "Full legal name must be First Name Last name.";

      if (!files || files.length === 0) return "Photo upload is required.";
      if (files.length > 1) return "Please upload only one photo.";

      const f = files[0];
      if (!isAllowedImage(f)) return "Images must be png or jpg.";
    }

    return null;
  };

  const buildFieldsJson = () => {
    const obj: Record<string, string> = {};
    const keys = [...visibleFieldKeys];

    if (isMinor) keys.push("guardianFullLegalName", "guardianEmail");

    for (const k of keys) {
      const v = (fields[k] ?? "").trim();
      if (v) obj[k] = v;
    }
    return JSON.stringify(obj);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOkId(null);

    const v = validate();
    if (v) {
      setErr(v);
      return;
    }

    setIsSubmitting(true);
    try {
      const fd = new FormData();

      fd.append("Type", String(type));
      fd.append("Domain", window.location.hostname || "");
      fd.append("Name", name.trim());
      fd.append("Email", email.trim());

      // required by spec + enforced by backend
      fd.append("PrivacyAccepted", privacyAccepted ? "true" : "false");

      // message mandatory only for some, but ok to send always if present
      if (message.trim()) fd.append("Message", message.trim());

      const fieldsJson = buildFieldsJson();
      if (fieldsJson && fieldsJson !== "{}") fd.append("FieldsJson", fieldsJson);

      if (needsFiles) {
        for (const f of files) fd.append("Files", f);
      }

      const res = await fetch(buildUrl("/api/submissions/form"), {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Submit failed.");
      }

      const data = await res.json().catch(() => null);
      setOkId(data?.id ?? "submitted");

      setMessage("");
      setFiles([]);
    } catch (ex: any) {
      setErr(ex?.message || "Submit failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="submitform-page">
      <BottomNav />

      <section className="submitform-wrap">
        <header className="submitform-head">
          <h1 className="submitform-title">
            CONTACT <span className="submitform-titleGrad">US</span>
          </h1>
          <p className="submitform-sub">Use this page to contact us or submit a request.</p>
        </header>

        <form className="submitform-card" onSubmit={onSubmit}>
          <div className="submitform-grid">
            <label className="submitform-field">
              <span className="submitform-label">SUBMISSION TYPE*</span>
              <select
                className="submitform-control"
                value={type}
                onChange={(ev) => {
                  const next = ev.target.value as SubmissionType | "";
                  setType(next);
                  setFiles([]);
                }}
              >
                <option value="">Select…</option>
                <option value="SyncRequest">Sync Request</option>
                <option value="GeneralContactInquiry">General Contact</option>
                <option value="SupportForm">Support</option>
                <option value="ArtistInformation">Artist Information</option>
                <option value="SongwriterInformation">Songwriter Information</option>
              </select>
            </label>

            <div className="submitform-divider" />

            

            <label className="submitform-field">
              <span className="submitform-label">NAME*</span>
              <input
                className="submitform-control"
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                placeholder="First name Last name"
              />
            </label>

            <label className="submitform-field">
              <span className="submitform-label">EMAIL*</span>
              <input
                className="submitform-control"
                type="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                placeholder="name@email.com"
              />
            </label>

            {type === "SyncRequest" && (
              <>
                <label className="submitform-field">
                  <span className="submitform-label">COMPANY</span>
                  <input
                    className="submitform-control"
                    value={fields.company}
                    onChange={(ev) => setField("company", ev.target.value)}
                    placeholder="Company / Studio"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">TELEPHONE</span>
                  <input
                    className="submitform-control"
                    value={fields.phone}
                    onChange={(ev) => setField("phone", ev.target.value)}
                    placeholder="+1 ..."
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">PRODUCTION NAME</span>
                  <input
                    className="submitform-control"
                    value={fields.productionName}
                    onChange={(ev) => setField("productionName", ev.target.value)}
                    placeholder="Production name"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">SONG TITLE</span>
                  <input
                    className="submitform-control"
                    value={fields.songTitle}
                    onChange={(ev) => setField("songTitle", ev.target.value)}
                    placeholder="Song title (if selected)"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">MEDIA TYPE</span>
                  <select
                    className="submitform-control"
                    value={fields.mediaType}
                    onChange={(ev) => setField("mediaType", ev.target.value)}
                  >
                    <option value="">Select</option>
                    <option>Film</option>
                    <option>TV</option>
                    <option>Advertising</option>
                    <option>Gaming</option>
                    <option>Digital</option>
                    <option>Social</option>
                  </select>
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">TERM</span>
                  <select
                    className="submitform-control"
                    value={fields.term}
                    onChange={(ev) => setField("term", ev.target.value)}
                  >
                    <option value="">Select</option>
                    <option>3 months</option>
                    <option>6 months</option>
                    <option>12 months</option>
                    <option>24 months</option>
                    <option>Perpetuity</option>
                  </select>
                </label>

                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">TERRITORY</span>
                  <select
                    className="submitform-control"
                    value={fields.territory}
                    onChange={(ev) => setField("territory", ev.target.value)}
                  >
                    <option value="">Select</option>
                    <option>Worldwide</option>
                    <option>Europe</option>
                    <option>North America</option>
                    <option>LATAM</option>
                    <option>Asia</option>
                    <option>Custom</option>
                  </select>
                </label>
              </>
            )}

            {type === "GeneralContactInquiry" && (
              <>
                <label className="submitform-field">
                  <span className="submitform-label">COMPANY</span>
                  <input
                    className="submitform-control"
                    value={fields.company}
                    onChange={(ev) => setField("company", ev.target.value)}
                    placeholder="Company (optional)"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">TELEPHONE</span>
                  <input
                    className="submitform-control"
                    value={fields.phone}
                    onChange={(ev) => setField("phone", ev.target.value)}
                    placeholder="Phone (optional)"
                  />
                </label>
              </>
            )}

            {type === "SupportForm" && (
              <>
                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">ISSUE TYPE</span>
                  <select
                    className="submitform-control"
                    value={fields.issueType}
                    onChange={(ev) => setField("issueType", ev.target.value)}
                  >
                    <option value="">Select</option>
                    <option>Account / Login</option>
                    <option>Website bug</option>
                    <option>Payments / Invoices</option>
                    <option>Rights / Claims</option>
                    <option>Other</option>
                  </select>
                </label>

                {/* PAGE / URL removed */}
              </>
            )}

            {type === "ArtistInformation" && (
              <>
                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">FULL LEGAL NAME* (First Name Last name)</span>
                  <input
                    className="submitform-control"
                    value={fields.fullLegalName}
                    onChange={(ev) => setField("fullLegalName", ev.target.value)}
                    placeholder="First Name Last name"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">STREET &amp; NUMBER*</span>
                  <input
                    className="submitform-control"
                    value={fields.streetNumber}
                    onChange={(ev) => setField("streetNumber", ev.target.value)}
                    placeholder="Street and number"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">ZIP CODE*</span>
                  <input
                    className="submitform-control"
                    value={fields.zipCode}
                    onChange={(ev) => setField("zipCode", ev.target.value)}
                    placeholder="ZIP code"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">CITY*</span>
                  <input
                    className="submitform-control"
                    value={fields.city}
                    onChange={(ev) => setField("city", ev.target.value)}
                    placeholder="City"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">COUNTRY*</span>
                  <input
                    className="submitform-control"
                    value={fields.country}
                    onChange={(ev) => setField("country", ev.target.value)}
                    placeholder="Country"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">DATE OF BIRTH*</span>
                  <input
                    className="submitform-control"
                    type="date"
                    value={fields.dayOfBirth}
                    onChange={(ev) => setField("dayOfBirth", ev.target.value)}
                  />
                </label>

                {isMinor && (
                  <>
                    <label className="submitform-field submitform-span2">
                      <span className="submitform-label">GUARDIAN FULL LEGAL NAME* (First Name Last name)</span>
                      <input
                        className="submitform-control"
                        value={fields.guardianFullLegalName}
                        onChange={(ev) => setField("guardianFullLegalName", ev.target.value)}
                        placeholder="First Name Last name"
                      />
                    </label>

                    <label className="submitform-field submitform-span2">
                      <span className="submitform-label">GUARDIAN EMAIL ADDRESS*</span>
                      <input
                        className="submitform-control"
                        type="email"
                        value={fields.guardianEmail}
                        onChange={(ev) => setField("guardianEmail", ev.target.value)}
                        placeholder="guardian@email.com"
                      />
                    </label>
                  </>
                )}

                <label className="submitform-field">
                  <span className="submitform-label">INSTAGRAM (optional)</span>
                  <input
                    className="submitform-control"
                    value={fields.instagram}
                    onChange={(ev) => setField("instagram", ev.target.value)}
                    placeholder="@instagram"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">BUSINESS EMAIL*</span>
                  <input
                    className="submitform-control"
                    type="email"
                    value={fields.businessEmail}
                    onChange={(ev) => setField("businessEmail", ev.target.value)}
                    placeholder="business@email.com"
                  />
                </label>

                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">SPOTIFY URL*</span>
                  <input
                    className="submitform-control"
                    value={fields.spotifyUrl}
                    onChange={(ev) => setField("spotifyUrl", ev.target.value)}
                    placeholder="https://open.spotify.com/artist/..."
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">APPLE ARTIST ID (10 DIGITS)*</span>
                  <input
                    className="submitform-control"
                    value={fields.appleArtistId}
                    onChange={(ev) => setField("appleArtistId", ev.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                    placeholder="1234567890"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">DOWNTOWN MUSIC ACCOUNT EMAIL (optional)</span>
                  <input
                    className="submitform-control"
                    type="email"
                    value={fields.downtownEmail}
                    onChange={(ev) => setField("downtownEmail", ev.target.value)}
                    placeholder="account@email.com"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">PRO (optional)</span>
                  <input
                    className="submitform-control"
                    value={fields.pro}
                    onChange={(ev) => setField("pro", ev.target.value)}
                    placeholder="GEMA / PRS / ASCAP / BMI / ..."
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">IPI NUMBER (optional)</span>
                  <input
                    className="submitform-control"
                    value={fields.ipi}
                    onChange={(ev) => setField("ipi", ev.target.value)}
                    placeholder="IPI / CAE"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">PUBLISHER (optional)</span>
                  <input
                    className="submitform-control"
                    value={fields.publisher}
                    onChange={(ev) => setField("publisher", ev.target.value)}
                    placeholder="Publisher"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">PUBLISHER IPI/CAE# (optional)</span>
                  <input
                    className="submitform-control"
                    value={fields.publisherIpiCae}
                    onChange={(ev) => setField("publisherIpiCae", ev.target.value)}
                    placeholder="Publisher IPI/CAE"
                  />
                </label>

                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">GENRES (optional)</span>
                  <input
                    className="submitform-control"
                    value={fields.genre}
                    onChange={(ev) => setField("genre", ev.target.value)}
                    placeholder="Genres (comma separated)"
                  />
                </label>
              </>
            )}

            {type === "SongwriterInformation" && (
              <>
                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">FULL LEGAL NAME* (First Name Last name)</span>
                  <input
                    className="submitform-control"
                    value={fields.fullLegalName}
                    onChange={(ev) => setField("fullLegalName", ev.target.value)}
                    placeholder="First Name Last name"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">ORIGIN*</span>
                  <input
                    className="submitform-control"
                    value={fields.origin}
                    onChange={(ev) => setField("origin", ev.target.value)}
                    placeholder="Origin / nationality"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">AGE*</span>
                  <input
                    className="submitform-control"
                    value={fields.age}
                    onChange={(ev) => setField("age", ev.target.value)}
                    placeholder="Age"
                  />
                </label>

                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">HOW LONG HAVE YOU BEEN MAKING MUSIC? *</span>
                  <input
                    className="submitform-control"
                    value={fields.yearsMakingMusic}
                    onChange={(ev) => setField("yearsMakingMusic", ev.target.value)}
                    placeholder="e.g. 5 years"
                  />
                </label>

                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">GENRES*</span>
                  <input
                    className="submitform-control"
                    value={fields.genre}
                    onChange={(ev) => setField("genre", ev.target.value)}
                    placeholder="Genres (comma separated)"
                  />
                </label>

                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">ARTIST BIOGRAPHY*</span>
                  <textarea
                    className="submitform-control submitform-textarea"
                    rows={6}
                    value={fields.biography}
                    onChange={(ev) => setField("biography", ev.target.value)}
                    placeholder="Short biography..."
                  />
                </label>

                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">NOTABLE ACHIEVEMENTS*</span>
                  <textarea
                    className="submitform-control submitform-textarea"
                    rows={5}
                    value={fields.notableAchievements}
                    onChange={(ev) => setField("notableAchievements", ev.target.value)}
                    placeholder="Achievements, releases, placements, awards..."
                  />
                </label>

                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">LINKS (optional)</span>
                  <input
                    className="submitform-control"
                    value={fields.songwriterLinks}
                    onChange={(ev) => setField("songwriterLinks", ev.target.value)}
                    placeholder="Works / playlists / socials / website"
                  />
                </label>

                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">PHOTO* (.png or .jpg, max 20MB)</span>
                  <input
                    className="submitform-control submitform-file"
                    type="file"
                    accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                    onChange={(ev) => onFilesChange(ev.target.files)}
                  />
                </label>
              </>
            )}

            <label className="submitform-field submitform-span2">
              <span className="submitform-label">
                MESSAGE{type === "GeneralContactInquiry" || type === "SupportForm" ? "*" : ""}
              </span>
              <textarea
                className="submitform-control submitform-textarea"
                rows={7}
                value={message}
                onChange={(ev) => setMessage(ev.target.value)}
                placeholder="Project details, references, deadlines, budget notes..."
              />
            </label>

            {/* Privacy checkbox (mandatory) */}
            <label className="submitform-field submitform-span2 submitform-privacy">
              <span> <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(ev) => setPrivacyAccepted(ev.target.checked)}
              />
              
                 &nbsp;&nbsp;I agree to the{" "}
                <Link className="submitform-link" to="/privacy-policy">
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link className="submitform-link" to="/cookie-policy">
                  Cookie Policy
                </Link>
                .
              </span>
            </label>
            <div className="submitform-field submitform-span2">
              <div className="submitform-note--disclaimer">{DISCLAIMER}</div>
            </div>
          </div>

          {err && <div className="submitform-alert submitform-alert--err">{err}</div>}
          {okId && (
            <div className="submitform-alert submitform-alert--ok">
              Submitted successfully. Reference ID: <span className="submitform-mono">{okId}</span>
            </div>
          )}

          <div className="submitform-foot">
            <button className="submitform-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "SENDING..." : "SEND"}
            </button>
          </div>
        </form>
      </section>

      <Footer />
    </main>
  );
};

export default SubmitForm;

function labelFor(k: string) {
  const m: Record<string, string> = {
    fullLegalName: "Full legal name",
    streetNumber: "Street & Number",
    zipCode: "ZIP Code",
    city: "City",
    country: "Country",
    dayOfBirth: "Date of birth",
    guardianFullLegalName: "Guardian full legal name",
    guardianEmail: "Guardian email address",
    instagram: "Instagram",
    businessEmail: "Business email",
    spotifyUrl: "Spotify URL",
    appleArtistId: "Apple Artist ID",
    downtownEmail: "Downtown Music account email",
    origin: "Origin",
    age: "Age",
    yearsMakingMusic: "How long have you been making music?",
    genre: "Genres",
    biography: "Artist Biography",
    notableAchievements: "Notable Achievements",
    issueType: "Issue type",
  };
  return m[k] || k;
}
