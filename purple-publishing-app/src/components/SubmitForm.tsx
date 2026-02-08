// SubmitForm.tsx
import { useEffect, useMemo, useState, type FormEvent } from "react";
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

const DRAFT_KEY = "submit_form_draft_v1";

type DraftPayload = {
  type: SubmissionType | "";
  name: string;
  email: string;
  message: string;
  privacyAccepted: boolean;
  fields: ExtraFields;
  // fajl ne može pouzdano da se pamti u storage-u iz browser security razloga
};

function safeParseDraft(raw: string | null): DraftPayload | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    if (!d || typeof d !== "object") return null;
    return {
      type: (typeof d.type === "string" ? d.type : "") as SubmissionType | "",
      name: typeof d.name === "string" ? d.name : "",
      email: typeof d.email === "string" ? d.email : "",
      message: typeof d.message === "string" ? d.message : "",
      privacyAccepted: typeof d.privacyAccepted === "boolean" ? d.privacyAccepted : false,
      fields: (d.fields && typeof d.fields === "object" ? d.fields : {}) as ExtraFields,
    };
  } catch {
    return null;
  }
}

const DEFAULT_FIELDS: ExtraFields = {
  company: "",
  phone: "",
  productionName: "",
  songTitle: "",
  mediaType: "",
  term: "",
  territory: "",
  issueType: "",
  fullLegalName: "",
  streetNumber: "",
  zipCode: "",
  city: "",
  country: "",
  businessEmail: "",
  spotifyUrl: "",
  appleArtistId: "",
  downtownEmail: "",
  pro: "",
  ipi: "",
  publisher: "",
  publisherIpiCae: "",
  genre: "",
  instagram: "",
  origin: "",
  age: "",
  yearsMakingMusic: "",
  biography: "",
  notableAchievements: "",
  songwriterLinks: "",
  dateOfBirthArtist: "",
  dateOfBirth: "",
  guardianNameArtist: "",
  guardianEmailArtist: "",
  guardianName: "",
  guardianEmail: "",
};

const SubmitForm = () => {
  // učitaj draft jednom
  const initialDraft = useMemo(() => safeParseDraft(sessionStorage.getItem(DRAFT_KEY)), []);

  const [type, setType] = useState<SubmissionType | "">(initialDraft?.type ?? "");
  const [name, setName] = useState(initialDraft?.name ?? "");
  const [email, setEmail] = useState(initialDraft?.email ?? "");
  const [message, setMessage] = useState(initialDraft?.message ?? "");
  const [privacyAccepted, setPrivacyAccepted] = useState(initialDraft?.privacyAccepted ?? false);
  const [fields, setFields] = useState<ExtraFields>({ ...DEFAULT_FIELDS, ...(initialDraft?.fields ?? {}) });

  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [okId, setOkId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const isArtist = type === "ArtistInformation";
  const isSongwriter = type === "SongwriterInformation";
  const needsFiles = isSongwriter;

  const ageArtist = useMemo(() => calcAgeFromISO(fields.dateOfBirthArtist), [fields.dateOfBirthArtist]);
  const artistIsMinor = isArtist && typeof ageArtist === "number" && ageArtist < 18;

  const ageSongwriter = useMemo(() => calcAgeFromISO(fields.dateOfBirth), [fields.dateOfBirth]);
  const songwriterIsMinor = isSongwriter && typeof ageSongwriter === "number" && ageSongwriter < 18;

  const setField = (key: string, value: string) => setFields((p) => ({ ...p, [key]: value }));

  const onFilesChange = (list: FileList | null) => {
    if (!list) return setFiles([]);
    setFiles(Array.from(list));
  };

  const totalBytes = useMemo(() => files.reduce((s, f) => s + (f?.size || 0), 0), [files]);

  // SAVE DRAFT on any change (but not while submitting)
  useEffect(() => {
    if (isSubmitting) return;
    try {
      const payload: DraftPayload = {
        type,
        name,
        email,
        message,
        privacyAccepted,
        fields,
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [type, name, email, message, privacyAccepted, fields, isSubmitting]);

  const clearDraft = () => {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
  };

  const validate = () => {
    if (!type) return "Submission Type is required.";
    if (!privacyAccepted) return "Privacy policy must be accepted.";

    if ((type === "GeneralContactInquiry" || type === "SupportForm") && !message.trim())
      return "Message is required.";

    if (totalBytes > 20 * 1024 * 1024) return "Total upload size must be 20MB or less.";

    if (type === "ArtistInformation") {
      const legal = fields.fullLegalName.trim();
      if (!legal || !looksLikeFullName(legal))
        return "Full legal name is required and must look like a full name for ArtistInformation.";
      if (!fields.businessEmail.trim()) return "Business email is required.";
      if (!fields.dateOfBirthArtist.trim()) return "Date of birth is required for ArtistInformation.";

      const required = ["streetNumber", "zipCode", "city", "country", "spotifyUrl", "appleArtistId"];
      for (const k of required) if (!(fields[k] ?? "").trim()) return `${labelFor(k)} is required.`;

      const apple = fields.appleArtistId.trim();
      if (apple && !/^\d{10}$/.test(apple)) return "Apple Artist ID must be exactly 10 digits.";

      if (artistIsMinor) {
        if (!fields.guardianNameArtist.trim() || !looksLikeFullName(fields.guardianNameArtist))
          return "For minors, guardian full legal name is required for ArtistInformation.";
        if (!fields.guardianEmailArtist.trim())
          return "For minors, guardian email address is required for ArtistInformation.";
      }
      return null;
    }

    if (type === "SongwriterInformation") {
      const legal = fields.fullLegalName.trim();
      if (!legal || !looksLikeFullName(legal))
        return "Full legal name is required and must look like a full name.";

      if (!email.trim()) return "Email is required.";
      if (!fields.dateOfBirth.trim()) return "Date of birth is required for SongwriterInformation.";

      const required = ["origin", "age", "yearsMakingMusic", "genre", "biography", "notableAchievements"];
      for (const k of required) if (!(fields[k] ?? "").trim()) return `${labelFor(k)} is required.`;

      if (!files || files.length === 0) return "Photo upload is required.";
      if (files.length > 1) return "Please upload only one photo.";
      if (!isAllowedImage(files[0])) return "Images must be png or jpg.";

      if (songwriterIsMinor) {
        if (!fields.guardianName.trim() || !looksLikeFullName(fields.guardianName))
          return "For minors, guardianName is required for SongwriterInformation.";
        if (!fields.guardianEmail.trim())
          return "For minors, guardianEmail is required for SongwriterInformation.";
      }

      return null;
    }

    if (!name.trim() || !email.trim()) return "Name and Email are required.";
    if (!looksLikeFullName(name.trim())) return "In Name box enter First name Last name.";

    return null;
  };

  const buildFieldsJson = () => {
    const obj: Record<string, string> = {};
    const put = (k: string, v: string) => {
      const val = (v ?? "").trim();
      if (val) obj[k] = val;
    };

    if (type === "SyncRequest") {
      put("company", fields.company);
      put("phone", fields.phone);
      put("productionName", fields.productionName);
      put("songTitle", fields.songTitle);
      put("mediaType", fields.mediaType);
      put("term", fields.term);
      put("territory", fields.territory);
    }

    if (type === "GeneralContactInquiry") {
      put("company", fields.company);
      put("phone", fields.phone);
    }

    if (type === "SupportForm") {
      put("issueType", fields.issueType);
    }

    if (type === "SongwriterInformation") {
      put("fullLegalName", fields.fullLegalName);
      put("dateOfBirth", fields.dateOfBirth);
      put("origin", fields.origin);
      put("age", fields.age);
      put("yearsMakingMusic", fields.yearsMakingMusic);
      put("genre", fields.genre);
      put("biography", fields.biography);
      put("notableAchievements", fields.notableAchievements);
      put("songwriterLinks", fields.songwriterLinks);

      if (songwriterIsMinor) {
        put("guardianName", fields.guardianName);
        put("guardianEmail", fields.guardianEmail);
      }
    }

    if (type === "ArtistInformation") {
      put("fullLegalNameArtist", fields.fullLegalName);
      put("dateOfBirthArtist", fields.dateOfBirthArtist);
      put("streetNumber", fields.streetNumber);
      put("zipCode", fields.zipCode);
      put("city", fields.city);
      put("country", fields.country);
      put("instagram", fields.instagram);
      put("businessEmail", fields.businessEmail);
      put("spotifyUrl", fields.spotifyUrl);
      put("appleArtistId", fields.appleArtistId);
      put("downtownEmail", fields.downtownEmail);
      put("pro", fields.pro);
      put("ipi", fields.ipi);
      put("publisher", fields.publisher);
      put("publisherIpiCae", fields.publisherIpiCae);
      put("genre", fields.genre);

      if (artistIsMinor) {
        put("guardianNameArtist", fields.guardianNameArtist);
        put("guardianEmailArtist", fields.guardianEmailArtist);
      }
    }

    return JSON.stringify(obj);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOkId(null);

    const v = validate();
    if (v) return setErr(v);

    setIsSubmitting(true);
    try {
      const fd = new FormData();

      fd.append("Type", String(type));
      fd.append("Domain", window.location.hostname || "");
      fd.append("PrivacyAccepted", privacyAccepted ? "true" : "false");

      if (type === "ArtistInformation") {
        fd.append("Name", fields.fullLegalName.trim());
        fd.append("Email", fields.businessEmail.trim());
      } else if (type === "SongwriterInformation") {
        fd.append("Name", fields.fullLegalName.trim());
        fd.append("Email", email.trim());
      } else {
        fd.append("Name", name.trim());
        fd.append("Email", email.trim());
      }

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

      // RESET + CLEAR DRAFT only on success
      clearDraft();

      setType("");
      setName("");
      setEmail("");
      setMessage("");
      setPrivacyAccepted(false);
      setFields({ ...DEFAULT_FIELDS });
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

              {/* wrapper za strelicu + focus ring */}
              <div className="submitform-select">
                <select
                  className="submitform-control"
                  value={type}
                  onChange={(ev) => {
                    const next = ev.target.value as SubmissionType | "";
                    setType(next);
                    setFiles([]);
                    setErr(null);
                    setOkId(null);
                  }}
                >
                  <option value="">Select…</option>
                  <option value="SyncRequest">Sync Request</option>
                  <option value="GeneralContactInquiry">General Contact</option>
                  <option value="SupportForm">Support</option>
                  <option value="ArtistInformation">Artist Information</option>
                  <option value="SongwriterInformation">Songwriter Information</option>
                </select>
              </div>
            </label>

            <div className="submitform-divider" />

            {!isArtist && !isSongwriter && (
              <>
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
              </>
            )}

            {isSongwriter && (
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
            )}

            {/* ... tvoj ostatak forme ostaje 1:1 (nisam skraćivao logiku) ... */}

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

            <label className="submitform-field submitform-span2 submitform-privacy">
              <span>
                <input
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
    streetNumber: "Street & Number",
    zipCode: "ZIP Code",
    city: "City",
    country: "Country",
    businessEmail: "Business email",
    spotifyUrl: "Spotify URL",
    appleArtistId: "Apple Artist ID",
    downtownEmail: "Downtown Music account email",
    pro: "PRO",
    ipi: "IPI number",
    publisher: "Publisher",
    publisherIpiCae: "Publisher IPI/CAE",
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
