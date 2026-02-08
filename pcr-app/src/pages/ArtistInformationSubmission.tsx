// src/pages/ArtistInformationSubmission.tsx
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import ReleasesFooterBar from "../components/ReleasesFooterBar";
import { API_BASE } from "../config/apiBase";
import "../style/PcrContactForm.css"

type SubmissionType = "ArtistInformation";
type ExtraFields = Record<string, string>;

function buildUrl(path: string) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return base ? `${base}/${p}` : `/${p}`;
}

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

function labelFor(k: string) {
  const m: Record<string, string> = {
    fullLegalName: "Full legal name",
    dateOfBirthArtist: "Date of birth",
    streetNumber: "Street & Number",
    zipCode: "ZIP Code",
    city: "City",
    country: "Country",
    instagram: "Instagram",
    businessEmail: "Business email",
    spotifyUrl: "Spotify URL",
    appleArtistId: "Apple Artist ID",
    downtownEmail: "Downtown Music account email",
    pro: "PRO",
    ipi: "IPI number",
    publisher: "Publisher",
    publisherIpiCae: "Publisher IPI/CAE",
    genre: "Genres",
    guardianNameArtist: "Guardian full legal name",
    guardianEmailArtist: "Guardian email address",
  };
  return m[k] || k;
}

const DISCLAIMER =
  "We carefully review all submissions and evaluate if they fit our network or not. Due to the high amount of submissions we can’t guarantee that all submissions will be answered. If accepted we will get back to you shortly.";

const DRAFT_KEY = "artist_information_submission_draft_v1";

type DraftPayload = {
  name: string;
  email: string;
  message: string;
  privacyAccepted: boolean;
  fields: ExtraFields;
};

function safeParseDraft(raw: string | null): DraftPayload | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    if (!d || typeof d !== "object") return null;
    return {
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
  fullLegalName: "",
  dateOfBirthArtist: "",

  streetNumber: "",
  zipCode: "",
  city: "",
  country: "",

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

  guardianNameArtist: "",
  guardianEmailArtist: "",
};

export default function ArtistInformationSubmission() {
  const initialDraft = useMemo(() => safeParseDraft(sessionStorage.getItem(DRAFT_KEY)), []);

  // type je fiksno
  const type: SubmissionType = "ArtistInformation";

  // name/email u ovoj formi su business fields (kao kod tebe u SubmitForm)
  const [name, setName] = useState(initialDraft?.fields?.fullLegalName ?? "");
  const [email, setEmail] = useState(initialDraft?.fields?.businessEmail ?? "");
  const [message, setMessage] = useState(initialDraft?.message ?? "");

  const [privacyAccepted, setPrivacyAccepted] = useState(initialDraft?.privacyAccepted ?? false);
  const [fields, setFields] = useState<ExtraFields>({ ...DEFAULT_FIELDS, ...(initialDraft?.fields ?? {}) });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [okId, setOkId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // sync top-level name/email with fields (da uvek ostane isto)
  useEffect(() => {
    setFields((p) => ({ ...p, fullLegalName: name }));
  }, [name]);

  useEffect(() => {
    setFields((p) => ({ ...p, businessEmail: email }));
  }, [email]);

  const ageArtist = useMemo(() => calcAgeFromISO(fields.dateOfBirthArtist), [fields.dateOfBirthArtist]);
  const artistIsMinor = typeof ageArtist === "number" && ageArtist < 18;

  const setField = (key: string, value: string) => setFields((p) => ({ ...p, [key]: value }));

  // draft save
  useEffect(() => {
    if (isSubmitting) return;
    try {
      const payload: DraftPayload = {
        name,
        email,
        message,
        privacyAccepted,
        fields,
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    } catch {
      //
    }
  }, [name, email, message, privacyAccepted, fields, isSubmitting]);

  const clearDraft = () => {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      //
    }
  };

  const validate = () => {
    if (!privacyAccepted) return "Privacy policy must be accepted.";

    const legal = (fields.fullLegalName || "").trim();
    if (!legal || !looksLikeFullName(legal)) return "Full legal name is required and must look like a full name.";
    if (!fields.businessEmail.trim()) return "Business email is required.";
    if (!fields.dateOfBirthArtist.trim()) return "Date of birth is required.";

    const required = ["streetNumber", "zipCode", "city", "country", "spotifyUrl", "appleArtistId"];
    for (const k of required) if (!(fields[k] ?? "").trim()) return `${labelFor(k)} is required.`;

    const apple = fields.appleArtistId.trim();
    if (apple && !/^\d{10}$/.test(apple)) return "Apple Artist ID must be exactly 10 digits.";

    if (artistIsMinor) {
      if (!fields.guardianNameArtist.trim() || !looksLikeFullName(fields.guardianNameArtist))
        return "For minors, guardian full legal name is required.";
      if (!fields.guardianEmailArtist.trim()) return "For minors, guardian email address is required.";
    }

    return null;
  };

  const buildFieldsJson = () => {
    const obj: Record<string, string> = {};
    const put = (k: string, v: string) => {
      const val = (v ?? "").trim();
      if (val) obj[k] = val;
    };

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

    return JSON.stringify(obj);
  };

  const resetAll = () => {
    setName("");
    setEmail("");
    setMessage("");
    setPrivacyAccepted(false);
    setFields({ ...DEFAULT_FIELDS });
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

      fd.append("Type", type);
      fd.append("Domain", window.location.hostname || "");
      fd.append("PrivacyAccepted", privacyAccepted ? "true" : "false");

      // kao SubmitForm: ArtistInformation koristi legal name + business email
      fd.append("Name", fields.fullLegalName.trim());
      fd.append("Email", fields.businessEmail.trim());

      if (message.trim()) fd.append("Message", message.trim());

      const fieldsJson = buildFieldsJson();
      if (fieldsJson && fieldsJson !== "{}") fd.append("FieldsJson", fieldsJson);

      const res = await fetch(buildUrl("/api/submissions/form"), {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Submit failed.");
      }

      const data = await res.json().catch(() => null);
      setOkId(data?.id ?? data?.Id ?? "submitted");

      clearDraft();
      resetAll();
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
            ARTIST <span className="submitform-titleGrad">INFORMATION</span>
          </h1>
          <p className="submitform-sub">Artist information submission.</p>
        </header>

        <form className="submitform-card" onSubmit={onSubmit}>
          <div className="submitform-grid">
            {/* NEMA SELECT-a. TYPE je fiksno */}
            <div className="submitform-field submitform-span2">
              <span className="submitform-label">SUBMISSION TYPE</span>
              <input className="submitform-control" value="Artist Information" readOnly />
            </div>

            <div className="submitform-divider" />

            <label className="submitform-field">
              <span className="submitform-label">FULL LEGAL NAME*</span>
              <input
                className="submitform-control"
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                placeholder="First name Last name"
                autoComplete="name"
              />
            </label>

            <label className="submitform-field">
              <span className="submitform-label">BUSINESS EMAIL*</span>
              <input
                className="submitform-control"
                type="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                placeholder="business@email.com"
                autoComplete="email"
              />
            </label>

            <label className="submitform-field">
              <span className="submitform-label">DATE OF BIRTH*</span>
              <input
                className="submitform-control"
                type="date"
                value={fields.dateOfBirthArtist}
                onChange={(ev) => setField("dateOfBirthArtist", ev.target.value)}
              />
            </label>

            <label className="submitform-field">
              <span className="submitform-label">INSTAGRAM</span>
              <input
                className="submitform-control"
                value={fields.instagram}
                onChange={(ev) => setField("instagram", ev.target.value)}
                placeholder="@handle"
              />
            </label>

            <label className="submitform-field submitform-span2">
              <span className="submitform-label">STREET & NUMBER*</span>
              <input
                className="submitform-control"
                value={fields.streetNumber}
                onChange={(ev) => setField("streetNumber", ev.target.value)}
                placeholder="Street 12A"
              />
            </label>

            <label className="submitform-field">
              <span className="submitform-label">ZIP CODE*</span>
              <input
                className="submitform-control"
                value={fields.zipCode}
                onChange={(ev) => setField("zipCode", ev.target.value)}
                placeholder="11000"
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
              <span className="submitform-label">GENRES</span>
              <input
                className="submitform-control"
                value={fields.genre}
                onChange={(ev) => setField("genre", ev.target.value)}
                placeholder="Pop, EDM, Hip-hop..."
              />
            </label>

            <label className="submitform-field submitform-span2">
              <span className="submitform-label">SPOTIFY ARTIST URL*</span>
              <input
                className="submitform-control"
                value={fields.spotifyUrl}
                onChange={(ev) => setField("spotifyUrl", ev.target.value)}
                placeholder="https://open.spotify.com/artist/..."
              />
            </label>

            <label className="submitform-field">
              <span className="submitform-label">APPLE ARTIST ID*</span>
              <input
                className="submitform-control"
                value={fields.appleArtistId}
                onChange={(ev) => setField("appleArtistId", ev.target.value)}
                placeholder="10 digits"
                inputMode="numeric"
              />
            </label>

            <label className="submitform-field">
              <span className="submitform-label">DOWNTOWN ACCOUNT EMAIL</span>
              <input
                className="submitform-control"
                value={fields.downtownEmail}
                onChange={(ev) => setField("downtownEmail", ev.target.value)}
                placeholder="account@email.com"
              />
            </label>

            <label className="submitform-field">
              <span className="submitform-label">PRO</span>
              <input className="submitform-control" value={fields.pro} onChange={(ev) => setField("pro", ev.target.value)} />
            </label>

            <label className="submitform-field">
              <span className="submitform-label">IPI</span>
              <input className="submitform-control" value={fields.ipi} onChange={(ev) => setField("ipi", ev.target.value)} />
            </label>

            <label className="submitform-field">
              <span className="submitform-label">PUBLISHER</span>
              <input
                className="submitform-control"
                value={fields.publisher}
                onChange={(ev) => setField("publisher", ev.target.value)}
              />
            </label>

            <label className="submitform-field">
              <span className="submitform-label">PUBLISHER IPI/CAE</span>
              <input
                className="submitform-control"
                value={fields.publisherIpiCae}
                onChange={(ev) => setField("publisherIpiCae", ev.target.value)}
              />
            </label>

            {artistIsMinor && (
              <>
                <div className="submitform-divider" />

                <label className="submitform-field">
                  <span className="submitform-label">GUARDIAN FULL LEGAL NAME*</span>
                  <input
                    className="submitform-control"
                    value={fields.guardianNameArtist}
                    onChange={(ev) => setField("guardianNameArtist", ev.target.value)}
                    placeholder="First name Last name"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">GUARDIAN EMAIL*</span>
                  <input
                    className="submitform-control"
                    type="email"
                    value={fields.guardianEmailArtist}
                    onChange={(ev) => setField("guardianEmailArtist", ev.target.value)}
                    placeholder="guardian@email.com"
                  />
                </label>

                <div className="submitform-help submitform-span2">
                  Because the artist is under 18, guardian details are required.
                </div>
              </>
            )}

            <label className="submitform-field submitform-span2">
              <span className="submitform-label">MESSAGE</span>
              <textarea
                className="submitform-control submitform-textarea"
                rows={7}
                value={message}
                onChange={(ev) => setMessage(ev.target.value)}
                placeholder="Additional notes..."
              />
            </label>

            <label className="submitform-field submitform-span2 submitform-privacy">
              <span>
                <input type="checkbox" checked={privacyAccepted} onChange={(ev) => setPrivacyAccepted(ev.target.checked)} />
                &nbsp;&nbsp;I agree to the{" "}
                <Link className="submitform-link" to="/privacy">
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link className="submitform-link" to="/cookies">
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

      <ReleasesFooterBar />
    </main>
  );
}
