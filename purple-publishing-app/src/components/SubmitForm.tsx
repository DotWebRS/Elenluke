import { useMemo, useState } from "react";
import BottomNav from "./BottomNav";
import Footer from "./Footer";

type SubmissionType =
  | "SyncRequest"
  | "GeneralContactInquiry"
  | "SupportForm"
  | "ArtistInformation"
  | "SongwriterInformation"
  | "DemoUpload";

type ExtraFields = Record<string, string>;

const API_BASE = (import.meta as any).env?.VITE_API_BASE || "http://localhost:5284";

const SubmitForm = () => {
  const [type, setType] = useState<SubmissionType>("SyncRequest");

  // global contact (always)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [message, setMessage] = useState("");

  // DemoUpload requires UploadedBy (Artist/Manager)
  const [uploadedBy, setUploadedBy] = useState("");

  // extra fields -> FieldsJson (Dictionary<string,string>)
  const [fields, setFields] = useState<ExtraFields>({
    // common
    company: "",
    phone: "",
    country: "",
    genre: "",

    // SyncRequest
    productionName: "",
    songTitle: "",
    mediaType: "",
    term: "",
    territory: "",

    // Support
    projectUrl: "",
    issueType: "",

    // ArtistInformation (required set)
    artistName: "",
    fullLegalName: "",
    streetNumber: "",
    zipCode: "",
    city: "",
    dayOfBirth: "", // YYYY-MM-DD
    legalAge: "", // "yes" | "no"
    instagram: "",
    businessEmail: "",
    spotifyUrl: "",
    appleArtistId: "", // 10 digits
    downtownEmail: "",
    pro: "",
    ipi: "",
    publisher: "",
    publisherIpiCae: "",

    // SongwriterInformation
    origin: "",
    age: "",
    yearsMakingMusic: "",
    biography: "",
    notableAchievements: "",
    songwriterLinks: "",

    // DemoUpload
    trackTitle: "",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [okId, setOkId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const isDemo = type === "DemoUpload";
  const isSongwriter = type === "SongwriterInformation";
  const needsFiles = isDemo || isSongwriter;

  const visibleFieldKeys = useMemo(() => {
    switch (type) {
      case "SyncRequest":
        return ["company", "phone", "productionName", "songTitle", "mediaType", "term", "territory"];
      case "GeneralContactInquiry":
        return ["company", "phone"];
      case "SupportForm":
        return ["issueType", "projectUrl"];
      case "ArtistInformation":
        return [
          "artistName",
          "fullLegalName",
          "streetNumber",
          "zipCode",
          "city",
          "country",
          "dayOfBirth",
          "legalAge",
          "instagram",
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
          "artistName",
          "fullLegalName",
          "origin",
          "age",
          "yearsMakingMusic",
          "genre",
          "biography",
          "notableAchievements",
          "songwriterLinks",
        ];
      case "DemoUpload":
        return ["artistName", "trackTitle", "country"];
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

    if (!n || !e) return "Name and Email are required.";

    // 20MB total limit (soft check)
    if (totalBytes > 20 * 1024 * 1024) return "Total upload size must be 20MB or less.";

    if (type === "ArtistInformation") {
      const required = [
        "artistName",
        "fullLegalName",
        "streetNumber",
        "zipCode",
        "city",
        "country",
        "dayOfBirth",
        "legalAge",
        "instagram",
        "businessEmail",
        "spotifyUrl",
        "appleArtistId",
      ];
      for (const k of required) {
        if (!(fields[k] ?? "").trim()) return `${labelFor(k)} is required.`;
      }

      const apple = (fields.appleArtistId ?? "").trim();
      if (apple && !/^\d{10}$/.test(apple)) return "Apple Artist ID must be exactly 10 digits.";

      const legalAge = (fields.legalAge ?? "").trim().toLowerCase();
      if (legalAge !== "yes" && legalAge !== "no") return "Are you legal age? is required.";
    }

    if (type === "SongwriterInformation") {
      const required = [
        "artistName",
        "fullLegalName",
        "origin",
        "age",
        "yearsMakingMusic",
        "genre",
        "biography",
        "notableAchievements",
      ];
      for (const k of required) {
        if (!(fields[k] ?? "").trim()) return `${labelFor(k)} is required.`;
      }
      if (!files || files.length === 0) return "Photo upload is required.";
      if (files.length > 1) return "Please upload only one photo.";
      const ct = (files[0]?.type || "").toLowerCase();
      if (!ct.startsWith("image/")) return "Photo must be an image file.";
    }

    if (isDemo) {
      if (!uploadedBy.trim()) return "Uploaded by is required for Demo Upload.";
      if (uploadedBy !== "Artist" && uploadedBy !== "Manager") return "Uploaded by must be Artist or Manager.";
      if (!files || files.length === 0) return "At least one file is required for Demo Upload.";
    }

    return null;
  };

  const buildFieldsJson = () => {
    const obj: Record<string, string> = {};
    for (const k of visibleFieldKeys) {
      const v = (fields[k] ?? "").trim();
      if (v) obj[k] = v;
    }
    return JSON.stringify(obj);
  };

  const onSubmit = async (e: React.FormEvent) => {
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

      fd.append("Type", type);
      fd.append("Domain", window.location.hostname || "");
      fd.append("Name", name.trim());
      fd.append("Email", email.trim());

      if (message.trim()) fd.append("Message", message.trim());
      if (uploadedBy.trim()) fd.append("UploadedBy", uploadedBy.trim());

      const fieldsJson = buildFieldsJson();
      if (fieldsJson && fieldsJson !== "{}") fd.append("FieldsJson", fieldsJson);

      if (needsFiles) {
        for (const f of files) fd.append("Files", f);
      }

      const res = await fetch(`${API_BASE}/api/submissions/form`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Submit failed.");
      }

      const data = await res.json().catch(() => null);
      setOkId(data?.id ?? "submitted");

      // reset
      setMessage("");
      if (!isDemo) setFiles([]);
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
            SUBMIT <span className="submitform-titleGrad">FORM</span>
          </h1>
          <p className="submitform-sub">
            Use this page to contact us or submit a request.
          </p>
        </header>

        <form className="submitform-card" onSubmit={onSubmit}>
          <div className="submitform-grid">
            <label className="submitform-field">
              <span className="submitform-label">SUBMISSION TYPE</span>
              <select
                className="submitform-control"
                value={type}
                onChange={(ev) => {
                  const next = ev.target.value as SubmissionType;
                  setType(next);

                  // clear per-type file state when switching
                  setFiles([]);
                  setUploadedBy("");

                  // optional: keep message/name/email
                }}
              >
                <option value="SyncRequest">Sync Request</option>
                <option value="GeneralContactInquiry">General Contact</option>
                <option value="SupportForm">Support</option>
                <option value="ArtistInformation">Artist Information</option>
                <option value="SongwriterInformation">Songwriter Information</option>
                <option value="DemoUpload">Demo Upload</option>
              </select>
            </label>

            <div className="submitform-divider" />

            <label className="submitform-field">
              <span className="submitform-label">NAME *</span>
              <input className="submitform-control" value={name} onChange={(ev) => setName(ev.target.value)} placeholder="Your name" />
            </label>

            <label className="submitform-field">
              <span className="submitform-label">EMAIL *</span>
              <input
                className="submitform-control"
                type="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                placeholder="name@email.com"
              />
            </label>

            {/* ======================
                SyncRequest
               ====================== */}
            {type === "SyncRequest" && (
              <>
                <label className="submitform-field">
                  <span className="submitform-label">COMPANY</span>
                  <input className="submitform-control" value={fields.company} onChange={(ev) => setField("company", ev.target.value)} placeholder="Company / Studio" />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">TELEPHONE</span>
                  <input className="submitform-control" value={fields.phone} onChange={(ev) => setField("phone", ev.target.value)} placeholder="+1 ..." />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">PRODUCTION NAME</span>
                  <input className="submitform-control" value={fields.productionName} onChange={(ev) => setField("productionName", ev.target.value)} placeholder="Production name" />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">SONG TITLE</span>
                  <input className="submitform-control" value={fields.songTitle} onChange={(ev) => setField("songTitle", ev.target.value)} placeholder="Song title (if selected)" />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">MEDIA TYPE</span>
                  <select className="submitform-control" value={fields.mediaType} onChange={(ev) => setField("mediaType", ev.target.value)}>
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
                  <select className="submitform-control" value={fields.term} onChange={(ev) => setField("term", ev.target.value)}>
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
                  <select className="submitform-control" value={fields.territory} onChange={(ev) => setField("territory", ev.target.value)}>
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

            {/* ======================
                GeneralContactInquiry
               ====================== */}
            {type === "GeneralContactInquiry" && (
              <>
                <label className="submitform-field">
                  <span className="submitform-label">COMPANY</span>
                  <input className="submitform-control" value={fields.company} onChange={(ev) => setField("company", ev.target.value)} placeholder="Company (optional)" />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">TELEPHONE</span>
                  <input className="submitform-control" value={fields.phone} onChange={(ev) => setField("phone", ev.target.value)} placeholder="Phone (optional)" />
                </label>
              </>
            )}

            {/* ======================
                SupportForm
               ====================== */}
            {type === "SupportForm" && (
              <>
                <label className="submitform-field">
                  <span className="submitform-label">ISSUE TYPE</span>
                  <select className="submitform-control" value={fields.issueType} onChange={(ev) => setField("issueType", ev.target.value)}>
                    <option value="">Select</option>
                    <option>Account / Login</option>
                    <option>Website bug</option>
                    <option>Payments / Invoices</option>
                    <option>Rights / Claims</option>
                    <option>Other</option>
                  </select>
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">PAGE / URL</span>
                  <input className="submitform-control" value={fields.projectUrl} onChange={(ev) => setField("projectUrl", ev.target.value)} placeholder="https://..." />
                </label>
              </>
            )}

            {/* ======================
                ArtistInformation (YOUR FULL LIST)
               ====================== */}
            {type === "ArtistInformation" && (
              <>
                <label className="submitform-field">
                  <span className="submitform-label">ARTIST NAME *</span>
                  <input className="submitform-control" value={fields.artistName} onChange={(ev) => setField("artistName", ev.target.value)} placeholder="Artist Name" />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">FULL LEGAL NAME *</span>
                  <input className="submitform-control" value={fields.fullLegalName} onChange={(ev) => setField("fullLegalName", ev.target.value)} placeholder="Full Legal Name" />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">STREET &amp; NUMBER *</span>
                  <input className="submitform-control" value={fields.streetNumber} onChange={(ev) => setField("streetNumber", ev.target.value)} placeholder="Street and number" />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">ZIP CODE *</span>
                  <input className="submitform-control" value={fields.zipCode} onChange={(ev) => setField("zipCode", ev.target.value)} placeholder="ZIP code" />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">CITY *</span>
                  <input className="submitform-control" value={fields.city} onChange={(ev) => setField("city", ev.target.value)} placeholder="City" />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">COUNTRY *</span>
                  <input className="submitform-control" value={fields.country} onChange={(ev) => setField("country", ev.target.value)} placeholder="Country" />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">DAY OF BIRTH *</span>
                  <input className="submitform-control" type="date" value={fields.dayOfBirth} onChange={(ev) => setField("dayOfBirth", ev.target.value)} />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">ARE YOU LEGAL AGE? *</span>
                  <select className="submitform-control" value={fields.legalAge} onChange={(ev) => setField("legalAge", ev.target.value)}>
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">INSTAGRAM *</span>
                  <input className="submitform-control" value={fields.instagram} onChange={(ev) => setField("instagram", ev.target.value)} placeholder="@instagram" />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">BUSINESS EMAIL *</span>
                  <input className="submitform-control" type="email" value={fields.businessEmail} onChange={(ev) => setField("businessEmail", ev.target.value)} placeholder="business@email.com" />
                </label>

                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">SPOTIFY URL *</span>
                  <input className="submitform-control" value={fields.spotifyUrl} onChange={(ev) => setField("spotifyUrl", ev.target.value)} placeholder="https://open.spotify.com/artist/..." />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">APPLE ARTIST ID (10 DIGITS) *</span>
                  <input className="submitform-control" value={fields.appleArtistId} onChange={(ev) => setField("appleArtistId", ev.target.value.replace(/[^\d]/g, "").slice(0, 10))} placeholder="1234567890" />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">DOWNTOWN MUSIC ACCOUNT EMAIL (optional)</span>
                  <input className="submitform-control" type="email" value={fields.downtownEmail} onChange={(ev) => setField("downtownEmail", ev.target.value)} placeholder="account@email.com" />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">PRO (optional)</span>
                  <input className="submitform-control" value={fields.pro} onChange={(ev) => setField("pro", ev.target.value)} placeholder="GEMA / PRS / ASCAP / BMI / ..." />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">IPI NUMBER (optional)</span>
                  <input className="submitform-control" value={fields.ipi} onChange={(ev) => setField("ipi", ev.target.value)} placeholder="IPI / CAE" />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">PUBLISHER (optional)</span>
                  <input className="submitform-control" value={fields.publisher} onChange={(ev) => setField("publisher", ev.target.value)} placeholder="Publisher" />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">PUBLISHER IPI/CAE# (optional)</span>
                  <input className="submitform-control" value={fields.publisherIpiCae} onChange={(ev) => setField("publisherIpiCae", ev.target.value)} placeholder="Publisher IPI/CAE" />
                </label>

                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">GENRES (optional)</span>
                  <input className="submitform-control" value={fields.genre} onChange={(ev) => setField("genre", ev.target.value)} placeholder="Genres (comma separated)" />
                </label>
              </>
            )}

            {/* ======================
                SongwriterInformation (YOUR FULL LIST)
               ====================== */}
            {type === "SongwriterInformation" && (
              <>
                <label className="submitform-field">
                  <span className="submitform-label">ARTIST NAME *</span>
                  <input className="submitform-control" value={fields.artistName} onChange={(ev) => setField("artistName", ev.target.value)} placeholder="Artist Name" />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">FULL LEGAL NAME *</span>
                  <input className="submitform-control" value={fields.fullLegalName} onChange={(ev) => setField("fullLegalName", ev.target.value)} placeholder="Full Legal Name" />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">ORIGIN *</span>
                  <input className="submitform-control" value={fields.origin} onChange={(ev) => setField("origin", ev.target.value)} placeholder="Origin / nationality" />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">AGE *</span>
                  <input className="submitform-control" value={fields.age} onChange={(ev) => setField("age", ev.target.value)} placeholder="Age" />
                </label>

                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">HOW LONG HAVE YOU BEEN MAKING MUSIC? *</span>
                  <input className="submitform-control" value={fields.yearsMakingMusic} onChange={(ev) => setField("yearsMakingMusic", ev.target.value)} placeholder="e.g. 5 years" />
                </label>

                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">GENRES *</span>
                  <input className="submitform-control" value={fields.genre} onChange={(ev) => setField("genre", ev.target.value)} placeholder="Genres (comma separated)" />
                </label>

                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">ARTIST BIOGRAPHY *</span>
                  <textarea className="submitform-control submitform-textarea" rows={6} value={fields.biography} onChange={(ev) => setField("biography", ev.target.value)} placeholder="Short biography..." />
                </label>

                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">NOTABLE ACHIEVEMENTS *</span>
                  <textarea className="submitform-control submitform-textarea" rows={5} value={fields.notableAchievements} onChange={(ev) => setField("notableAchievements", ev.target.value)} placeholder="Achievements, releases, placements, awards..." />
                </label>

                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">LINKS (optional)</span>
                  <input className="submitform-control" value={fields.songwriterLinks} onChange={(ev) => setField("songwriterLinks", ev.target.value)} placeholder="Works / playlists / socials / website" />
                </label>

                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">PHOTO * (max 20MB)</span>
                  <input
                    className="submitform-control submitform-file"
                    type="file"
                    accept="image/*"
                    onChange={(ev) => onFilesChange(ev.target.files)}
                  />
                </label>
              </>
            )}

            {/* ======================
                DemoUpload
               ====================== */}
            {type === "DemoUpload" && (
              <>
                <label className="submitform-field">
                  <span className="submitform-label">ARTIST NAME</span>
                  <input className="submitform-control" value={fields.artistName} onChange={(ev) => setField("artistName", ev.target.value)} placeholder="Artist name" />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">TRACK TITLE</span>
                  <input className="submitform-control" value={fields.trackTitle} onChange={(ev) => setField("trackTitle", ev.target.value)} placeholder="Track title" />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">COUNTRY</span>
                  <input className="submitform-control" value={fields.country} onChange={(ev) => setField("country", ev.target.value)} placeholder="Country" />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">UPLOADED BY *</span>
                  <select className="submitform-control" value={uploadedBy} onChange={(ev) => setUploadedBy(ev.target.value)}>
                    <option value="">Select</option>
                    <option value="Artist">Artist</option>
                    <option value="Manager">Manager</option>
                  </select>
                </label>

                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">FILES * (max 20MB total)</span>
                  <input className="submitform-control submitform-file" type="file" multiple onChange={(ev) => onFilesChange(ev.target.files)} />
                </label>
              </>
            )}

            {/* Message always */}
            <label className="submitform-field submitform-span2">
              <span className="submitform-label">MESSAGE</span>
              <textarea
                className="submitform-control submitform-textarea"
                rows={7}
                value={message}
                onChange={(ev) => setMessage(ev.target.value)}
                placeholder="Project details, references, deadlines, budget notes..."
              />
            </label>
          </div>

          {/* Status */}
          {err && <div className="submitform-alert submitform-alert--err">{err}</div>}
          {okId && (
            <div className="submitform-alert submitform-alert--ok">
              Submitted successfully. Reference ID: <span className="submitform-mono">{okId}</span>
            </div>
          )}

          <div className="submitform-foot">
            <div className="submitform-note">
              By submitting, you agree that your data will be processed according to our{" "}
              <a className="submitform-link" href="/privacy-policy">
                Privacy Policy
              </a>
              .
            </div>

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

/** Small label map for nicer errors */
function labelFor(k: string) {
  const m: Record<string, string> = {
    artistName: "Artist Name",
    fullLegalName: "Full Legal Name",
    streetNumber: "Street & Number",
    zipCode: "ZIP Code",
    city: "City",
    country: "Country",
    dayOfBirth: "Day of birth",
    legalAge: "Are you legal age",
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
  };
  return m[k] || k;
}
