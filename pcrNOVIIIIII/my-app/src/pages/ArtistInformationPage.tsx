import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import Footer from "../components/Footer";
import { API_BASE } from "../config/apiBase";

type ExtraFields = {
  artistName: string;
  legalFirstNameArtist: string;
  legalLastNameArtist: string;
  streetNumber: string;
  zipCode: string;
  city: string;
  country: string;
  isLegalAgeArtist: "" | "yes" | "no";
  dateOfBirthArtist: string;
  guardianFirstNameArtist: string;
  guardianLastNameArtist: string;
  guardianEmailArtist: string;
  instagram: string;
  tiktokUrl: string;
  telephoneNumber: string;
  canUseRealNamePublicly: "" | "yes" | "no";
  spotifyUri: string;
  appleArtistId: string;
  pro: string;
  ipi: string;
  publisher: string;
  publisherIpiCae: string;
};

type DraftPayload = {
  email: string;
  message: string;
  privacyAccepted: boolean;
  fields: ExtraFields;
};

const DRAFT_KEY = "pcr_artist_information_form_draft_v3";

const DEFAULT_FIELDS: ExtraFields = {
  artistName: "",
  legalFirstNameArtist: "",
  legalLastNameArtist: "",
  streetNumber: "",
  zipCode: "",
  city: "",
  country: "",
  isLegalAgeArtist: "",
  dateOfBirthArtist: "",
  guardianFirstNameArtist: "",
  guardianLastNameArtist: "",
  guardianEmailArtist: "",
  instagram: "",
  tiktokUrl: "",
  telephoneNumber: "",
  canUseRealNamePublicly: "",
  spotifyUri: "",
  appleArtistId: "",
  pro: "",
  ipi: "",
  publisher: "",
  publisherIpiCae: "",
};

function buildUrl(path: string) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return base ? `${base}/${p}` : `/${p}`;
}

function safeParseDraft(raw: string | null): DraftPayload | null {
  if (!raw) return null;

  try {
    const d = JSON.parse(raw);
    if (!d || typeof d !== "object") return null;

    return {
      email: typeof d.email === "string" ? d.email : "",
      message: typeof d.message === "string" ? d.message : "",
      privacyAccepted:
        typeof d.privacyAccepted === "boolean" ? d.privacyAccepted : false,
      fields: {
        ...DEFAULT_FIELDS,
        ...(d.fields && typeof d.fields === "object" ? d.fields : {}),
      },
    };
  } catch {
    return null;
  }
}

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());
}

function labelFor(k: keyof ExtraFields) {
  const m: Record<keyof ExtraFields, string> = {
    artistName: "Artist Name",
    legalFirstNameArtist: "First Name",
    legalLastNameArtist: "Last Name",
    streetNumber: "Street & Number",
    zipCode: "ZIP Code",
    city: "City",
    country: "Country",
    isLegalAgeArtist: "Are you of legal age? (+18 years)",
    dateOfBirthArtist: "Date of Birth",
    guardianFirstNameArtist: "Legal Guardian First Name",
    guardianLastNameArtist: "Legal Guardian Last Name",
    guardianEmailArtist: "Legal Guardian E-Mail",
    instagram: "Instagram",
    tiktokUrl: "TikTok Account URL",
    telephoneNumber: "Telephone Number",
    canUseRealNamePublicly: "Can we use your real name for any public posting?",
    spotifyUri: "Spotify URI",
    appleArtistId: "Apple ID",
    pro: "PRO",
    ipi: "IPI Number",
    publisher: "Publisher",
    publisherIpiCae: "Publisher IPI/CAE#",
  };

  return m[k];
}

export default function ArtistInformationPage() {
  const initialDraft = useMemo(
    () => safeParseDraft(sessionStorage.getItem(DRAFT_KEY)),
    []
  );

  const [email, setEmail] = useState(initialDraft?.email ?? "");
  const [message, setMessage] = useState(initialDraft?.message ?? "");
  const [privacyAccepted, setPrivacyAccepted] = useState(
    initialDraft?.privacyAccepted ?? false
  );
  const [fields, setFields] = useState<ExtraFields>({
    ...DEFAULT_FIELDS,
    ...(initialDraft?.fields ?? {}),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [okId, setOkId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const artistIsMinor = fields.isLegalAgeArtist === "no";

  const artistFullLegalName =
    `${fields.legalFirstNameArtist} ${fields.legalLastNameArtist}`.trim();

  const guardianFullLegalNameArtist =
    `${fields.guardianFirstNameArtist} ${fields.guardianLastNameArtist}`.trim();

  useEffect(() => {
    if (isSubmitting) return;

    try {
      const payload: DraftPayload = {
        email,
        message,
        privacyAccepted,
        fields,
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    } catch {
      //
    }
  }, [email, message, privacyAccepted, fields, isSubmitting]);

  const setField = (key: keyof ExtraFields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const clearDraft = () => {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      //
    }
  };

  const resetForm = () => {
    clearDraft();
    setEmail("");
    setMessage("");
    setPrivacyAccepted(false);
    setFields({ ...DEFAULT_FIELDS });
  };

  const validateArtist = () => {
    if (!fields.artistName.trim()) return "Artist Name is required.";
    if (!fields.legalFirstNameArtist.trim()) return "First Name is required.";
    if (!fields.legalLastNameArtist.trim()) return "Last Name is required.";
    if (!email.trim()) return "Contact E-Mail is required.";
    if (!isEmail(email)) return "Please enter a valid Contact E-Mail.";

    const required: Array<keyof ExtraFields> = [
      "streetNumber",
      "zipCode",
      "city",
      "country",
      "isLegalAgeArtist",
      "telephoneNumber",
      "spotifyUri",
      "appleArtistId",
      "canUseRealNamePublicly",
    ];

    for (const k of required) {
      if (!(fields[k] ?? "").trim()) {
        return `${labelFor(k)} is required.`;
      }
    }

    if (!message.trim()) return "Message is required.";

    if (!/^\d{10}$/.test(fields.appleArtistId.trim())) {
      return "Apple ID must be exactly 10 digits.";
    }

    if (artistIsMinor) {
      if (!fields.dateOfBirthArtist.trim()) {
        return "Date of Birth is required.";
      }
      if (!fields.guardianFirstNameArtist.trim()) {
        return "Legal Guardian First Name is required.";
      }
      if (!fields.guardianLastNameArtist.trim()) {
        return "Legal Guardian Last Name is required.";
      }
      if (!fields.guardianEmailArtist.trim()) {
        return "Legal Guardian E-Mail is required.";
      }
      if (!isEmail(fields.guardianEmailArtist)) {
        return "Please enter a valid Legal Guardian E-Mail.";
      }
    }

    if (!privacyAccepted) return "Privacy policy must be accepted.";

    return null;
  };

  const buildFieldsJson = () => {
    const obj: Record<string, string> = {};

    const put = (k: string, v: string) => {
      const val = (v ?? "").trim();
      if (val) obj[k] = val;
    };

    put("artistName", fields.artistName);
    put("legalFirstNameArtist", fields.legalFirstNameArtist);
    put("legalLastNameArtist", fields.legalLastNameArtist);
    put("fullLegalNameArtist", artistFullLegalName);

    put("streetNumber", fields.streetNumber);
    put("zipCode", fields.zipCode);
    put("city", fields.city);
    put("country", fields.country);
    put("isLegalAgeArtist", fields.isLegalAgeArtist);

    put("instagram", fields.instagram);
    put("tiktokUrl", fields.tiktokUrl);
    put("telephoneNumber", fields.telephoneNumber);
    put("canUseRealNamePublicly", fields.canUseRealNamePublicly);
    put("spotifyUri", fields.spotifyUri);
    put("appleArtistId", fields.appleArtistId);

    put("pro", fields.pro);
    put("ipi", fields.ipi);
    put("publisher", fields.publisher);
    put("publisherIpiCae", fields.publisherIpiCae);

    if (artistIsMinor) {
      put("dateOfBirthArtist", fields.dateOfBirthArtist);
      put("guardianFirstNameArtist", fields.guardianFirstNameArtist);
      put("guardianLastNameArtist", fields.guardianLastNameArtist);
      put("guardianNameArtist", guardianFullLegalNameArtist);
      put("guardianEmailArtist", fields.guardianEmailArtist);
    }

    return JSON.stringify(obj);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOkId(null);

    const validationError = validateArtist();
    if (validationError) {
      setErr(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const fd = new FormData();

      fd.append("Type", "ArtistInformation");
      fd.append("Domain", window.location.hostname || "");
      fd.append("PrivacyAccepted", privacyAccepted ? "true" : "false");
      fd.append("Name", fields.artistName.trim());
      fd.append("Email", email.trim());

      if (message.trim()) {
        fd.append("Message", message.trim());
      }

      const fieldsJson = buildFieldsJson();
      if (fieldsJson !== "{}") {
        fd.append("FieldsJson", fieldsJson);
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
      resetForm();
    } catch (ex: unknown) {
      const msg = ex instanceof Error ? ex.message : "Submit failed.";
      setErr(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="contact-page">
      <BottomNav />

      <section className="contact-wrap">
        <header className="contact-head">
          <h1 className="contact-title">
            ARTIST <span className="contact-titleGrad">INFORMATION</span>
          </h1>
          <p className="contact-sub">
            Submit your artist information for review.
          </p>
        </header>

        <form className="contact-card" onSubmit={onSubmit}>
          <div className="contact-grid">
            <label className="contact-field contact-span2">
              <span className="contact-label">SUBMISSION TYPE*</span>
              <input
                className="contact-control"
                value="Artist Information"
                readOnly
              />
            </label>

            <label className="contact-field contact-span2">
              <span className="contact-label">CONTACT E-MAIL*</span>
              <input
                className="contact-control"
                type="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                placeholder="name@email.com"
              />
            </label>

            <div className="contact-divider" />

            <label className="contact-field contact-span2">
              <span className="contact-label">ARTIST NAME*</span>
              <input
                className="contact-control"
                value={fields.artistName}
                onChange={(ev) => setField("artistName", ev.target.value)}
                placeholder="Artist name"
              />
            </label>

            <label className="contact-field">
              <span className="contact-label">FIRST NAME*</span>
              <input
                className="contact-control"
                value={fields.legalFirstNameArtist}
                onChange={(ev) => setField("legalFirstNameArtist", ev.target.value)}
                placeholder="First name"
              />
            </label>

            <label className="contact-field">
              <span className="contact-label">LAST NAME*</span>
              <input
                className="contact-control"
                value={fields.legalLastNameArtist}
                onChange={(ev) => setField("legalLastNameArtist", ev.target.value)}
                placeholder="Last name"
              />
            </label>

            <label className="contact-field">
              <span className="contact-label">STREET & NUMBER*</span>
              <input
                className="contact-control"
                value={fields.streetNumber}
                onChange={(ev) => setField("streetNumber", ev.target.value)}
                placeholder="Street and number"
              />
            </label>

            <label className="contact-field">
              <span className="contact-label">ZIP CODE*</span>
              <input
                className="contact-control"
                value={fields.zipCode}
                onChange={(ev) => setField("zipCode", ev.target.value)}
                placeholder="ZIP code"
              />
            </label>

            <label className="contact-field">
              <span className="contact-label">CITY*</span>
              <input
                className="contact-control"
                value={fields.city}
                onChange={(ev) => setField("city", ev.target.value)}
                placeholder="City"
              />
            </label>

            <label className="contact-field">
              <span className="contact-label">COUNTRY*</span>
              <input
                className="contact-control"
                value={fields.country}
                onChange={(ev) => setField("country", ev.target.value)}
                placeholder="Country"
              />
            </label>

            <label className="contact-field contact-span2">
              <span className="contact-label">
                ARE YOU OF LEGAL AGE? (+18 YEARS)*
              </span>
              <div className="contact-select">
                <select
                  className="contact-control"
                  value={fields.isLegalAgeArtist}
                  onChange={(ev) => {
                    const value = ev.target.value as "" | "yes" | "no";
                    setField("isLegalAgeArtist", value);

                    if (value !== "no") {
                      setField("dateOfBirthArtist", "");
                      setField("guardianFirstNameArtist", "");
                      setField("guardianLastNameArtist", "");
                      setField("guardianEmailArtist", "");
                    }
                  }}
                >
                  <option value="" disabled>
                    Choose option
                  </option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </label>

            {artistIsMinor && (
              <>
                <label className="contact-field contact-span2">
                  <span className="contact-label">DATE OF BIRTH*</span>
                  <input
                    className="contact-control submitform-date"
                    type="date"
                    value={fields.dateOfBirthArtist}
                    onChange={(ev) => setField("dateOfBirthArtist", ev.target.value)}
                  />
                </label>

                <label className="contact-field">
                  <span className="contact-label">LEGAL GUARDIAN FIRST NAME*</span>
                  <input
                    className="contact-control"
                    value={fields.guardianFirstNameArtist}
                    onChange={(ev) => setField("guardianFirstNameArtist", ev.target.value)}
                    placeholder="Guardian first name"
                  />
                </label>

                <label className="contact-field">
                  <span className="contact-label">LEGAL GUARDIAN LAST NAME*</span>
                  <input
                    className="contact-control"
                    value={fields.guardianLastNameArtist}
                    onChange={(ev) => setField("guardianLastNameArtist", ev.target.value)}
                    placeholder="Guardian last name"
                  />
                </label>

                <label className="contact-field contact-span2">
                  <span className="contact-label">LEGAL GUARDIAN E-MAIL*</span>
                  <input
                    className="contact-control"
                    type="email"
                    value={fields.guardianEmailArtist}
                    onChange={(ev) => setField("guardianEmailArtist", ev.target.value)}
                    placeholder="guardian@email.com"
                  />
                </label>
              </>
            )}

            <label className="contact-field">
              <span className="contact-label">INSTAGRAM</span>
              <input
                className="contact-control"
                value={fields.instagram}
                onChange={(ev) => setField("instagram", ev.target.value)}
                placeholder="@artistname or profile link"
              />
            </label>

            <label className="contact-field">
              <span className="contact-label">TIKTOK ACCOUNT URL</span>
              <input
                className="contact-control"
                value={fields.tiktokUrl}
                onChange={(ev) => setField("tiktokUrl", ev.target.value)}
                placeholder="https://www.tiktok.com/@..."
              />
            </label>

            <label className="contact-field">
              <span className="contact-label">TELEPHONE NUMBER*</span>
              <input
                className="contact-control"
                value={fields.telephoneNumber}
                onChange={(ev) => setField("telephoneNumber", ev.target.value)}
                placeholder="Telephone number"
              />
            </label>

            <label className="contact-field">
              <span className="contact-label">
                CAN WE USE YOUR REAL NAME FOR ANY PUBLIC POSTING?*
              </span>
              <div className="contact-select">
                <select
                  className="contact-control"
                  value={fields.canUseRealNamePublicly}
                  onChange={(ev) =>
                    setField(
                      "canUseRealNamePublicly",
                      ev.target.value as "" | "yes" | "no"
                    )
                  }
                >
                  <option value="" disabled>
                    Choose option
                  </option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </label>

            <label className="contact-field">
              <span className="contact-label">SPOTIFY URI*</span>
              <input
                className="contact-control"
                value={fields.spotifyUri}
                onChange={(ev) => setField("spotifyUri", ev.target.value)}
                placeholder="Spotify URI or URL"
              />
            </label>

            <label className="contact-field">
              <span className="contact-label">APPLE ID*</span>
              <input
                className="contact-control"
                value={fields.appleArtistId}
                onChange={(ev) =>
                  setField(
                    "appleArtistId",
                    ev.target.value.replace(/\D/g, "").slice(0, 10)
                  )
                }
                placeholder="10 digit number of artist URL"
                inputMode="numeric"
              />
            </label>

            <label className="contact-field">
              <span className="contact-label">PRO</span>
              <input
                className="contact-control"
                value={fields.pro}
                onChange={(ev) => setField("pro", ev.target.value)}
                placeholder="ASCAP, BMI, PRS..."
              />
            </label>

            <label className="contact-field">
              <span className="contact-label">IPI NUMBER</span>
              <input
                className="contact-control"
                value={fields.ipi}
                onChange={(ev) => setField("ipi", ev.target.value)}
                placeholder="IPI number"
              />
            </label>

            <label className="contact-field">
              <span className="contact-label">PUBLISHER</span>
              <input
                className="contact-control"
                value={fields.publisher}
                onChange={(ev) => setField("publisher", ev.target.value)}
                placeholder="Publisher"
              />
            </label>

            <label className="contact-field">
              <span className="contact-label">PUBLISHER IPI/CAE#</span>
              <input
                className="contact-control"
                value={fields.publisherIpiCae}
                onChange={(ev) => setField("publisherIpiCae", ev.target.value)}
                placeholder="Publisher IPI/CAE#"
              />
            </label>

            <label className="contact-field contact-span2 contact-field--message">
              <span className="contact-label">MESSAGE*</span>
              <textarea
                className="contact-control contact-textarea contact-textarea--large"
                rows={8}
                value={message}
                onChange={(ev) => setMessage(ev.target.value)}
                placeholder="Project details, references, deadlines..."
              />
            </label>

            <label className="contact-field contact-span2 contact-privacy">
              <span>
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(ev) => setPrivacyAccepted(ev.target.checked)}
                />
                &nbsp;&nbsp;I agree to the{" "}
                <Link className="contact-link" to="/privacy-policy">
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link className="contact-link" to="/cookie-policy">
                  Cookie Policy
                </Link>
                .
              </span>
            </label>
          </div>

          {err && <div className="contact-alert contact-alert--err">{err}</div>}

          {okId && (
            <div className="contact-alert contact-alert--ok">
              Submitted successfully. Reference ID:{" "}
              <span className="contact-mono">{okId}</span>
            </div>
          )}

          <div className="contact-foot">
            <button className="contact-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "SENDING..." : "SEND"}
            </button>
          </div>
        </form>
      </section>

      <Footer />
    </main>
  );
}