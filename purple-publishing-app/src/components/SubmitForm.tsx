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

const DRAFT_KEY = "submit_form_draft_v5";

type DraftPayload = {
  type: SubmissionType | "";
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
      type: (typeof d.type === "string" ? d.type : "") as SubmissionType | "",
      email: typeof d.email === "string" ? d.email : "",
      message: typeof d.message === "string" ? d.message : "",
      privacyAccepted: typeof d.privacyAccepted === "boolean" ? d.privacyAccepted : false,
      fields: (d.fields && typeof d.fields === "object" ? d.fields : {}) as ExtraFields,
    };
  } catch {
    return null;
  }
}

function looksLikeName(v: string) {
  return (v || "").trim().length >= 2;
}

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());
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

const DEFAULT_FIELDS: ExtraFields = {
  generalFirstName: "",
  generalLastName: "",

  company: "",
  phone: "",
  productionName: "",
  songTitle: "",
  mediaType: "",
  term: "",
  territory: "",
  issueType: "",

  artistName: "",
  legalFirstNameArtist: "",
  legalLastNameArtist: "",
  streetNumber: "",
  zipCode: "",
  city: "",
  country: "",
  dateOfBirthArtist: "",
  guardianFirstNameArtist: "",
  guardianLastNameArtist: "",
  guardianEmailArtist: "",
  instagram: "",
  spotifyUri: "",
  appleArtistId: "",
  pro: "",
  ipi: "",
  publisher: "",
  publisherIpiCae: "",

  songwriterArtistName: "",
  legalFirstNameSongwriter: "",
  legalLastNameSongwriter: "",
  origin: "",
  age: "",
  yearsMakingMusic: "",
  genre: "",
  biography: "",
  notableAchievements: "",
  songwriterPro: "",
  songwriterIpi: "",
};

const SubmitForm = () => {
  const initialDraft = useMemo(() => safeParseDraft(sessionStorage.getItem(DRAFT_KEY)), []);

  const [type, setType] = useState<SubmissionType | "">(initialDraft?.type ?? "");
  const [email, setEmail] = useState(initialDraft?.email ?? "");
  const [message, setMessage] = useState(initialDraft?.message ?? "");
  const [privacyAccepted, setPrivacyAccepted] = useState(initialDraft?.privacyAccepted ?? false);
  const [fields, setFields] = useState<ExtraFields>({
    ...DEFAULT_FIELDS,
    ...(initialDraft?.fields ?? {}),
  });

  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [okId, setOkId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const isArtist = type === "ArtistInformation";
  const isSongwriter = type === "SongwriterInformation";
  const isGeneral = type === "GeneralContactInquiry";
  const isSupport = type === "SupportForm";
  const isSync = type === "SyncRequest";

  const artistAge = useMemo(() => calcAgeFromISO(fields.dateOfBirthArtist), [fields.dateOfBirthArtist]);
  const artistIsMinor = isArtist && typeof artistAge === "number" && artistAge < 18;

  const totalBytes = useMemo(() => files.reduce((s, f) => s + (f?.size || 0), 0), [files]);

  useEffect(() => {
    if (isSubmitting) return;
    try {
      const payload: DraftPayload = {
        type,
        email,
        message,
        privacyAccepted,
        fields,
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    } catch {
      //
    }
  }, [type, email, message, privacyAccepted, fields, isSubmitting]);

  const clearDraft = () => {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      //
    }
  };

  const setField = (key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const onFilesChange = (list: FileList | null) => {
    if (!list || list.length === 0) {
      setFiles([]);
      return;
    }
    setFiles(Array.from(list).slice(0, 1));
  };

  const generalFullName = `${fields.generalFirstName} ${fields.generalLastName}`.trim();
  const artistFullLegalName = `${fields.legalFirstNameArtist} ${fields.legalLastNameArtist}`.trim();
  const guardianFullLegalNameArtist =
    `${fields.guardianFirstNameArtist} ${fields.guardianLastNameArtist}`.trim();
  const songwriterFullLegalName =
    `${fields.legalFirstNameSongwriter} ${fields.legalLastNameSongwriter}`.trim();

  const validate = () => {
    if (!type) return "Submission Type is required.";
    if (!privacyAccepted) return "Privacy policy must be accepted.";
    if (totalBytes > 20 * 1024 * 1024) return "Total upload size must be 20MB or less.";

    if (isGeneral || isSupport || isSync) {
      if (!looksLikeName(fields.generalFirstName)) return "First Name is required.";
      if (!looksLikeName(fields.generalLastName)) return "Last Name is required.";
      if (!email.trim()) return "Email is required.";
      if (!isEmail(email)) return "Please enter a valid email address.";

      if (isGeneral || isSupport) {
        if (!message.trim()) return "Message is required.";
      }

      return null;
    }

    if (isArtist) {
      if (!fields.artistName.trim()) return "Artist Name is required.";
      if (!fields.legalFirstNameArtist.trim()) return "First Name is required.";
      if (!fields.legalLastNameArtist.trim()) return "Last Name is required.";
      if (!email.trim()) return "Contact E-Mail is required.";
      if (!isEmail(email)) return "Please enter a valid Contact E-Mail.";

      const required = [
        "streetNumber",
        "zipCode",
        "city",
        "country",
        "dateOfBirthArtist",
        "spotifyUri",
        "appleArtistId",
      ];

      for (const k of required) {
        if (!(fields[k] ?? "").trim()) return `${labelFor(k)} is required.`;
      }

      if (!message.trim()) return "Message is required.";

      if (!/^\d{10}$/.test(fields.appleArtistId.trim())) {
        return "Apple ID must be exactly 10 digits.";
      }

      if (artistIsMinor) {
        if (!fields.guardianFirstNameArtist.trim()) return "Legal Guardian First Name is required.";
        if (!fields.guardianLastNameArtist.trim()) return "Legal Guardian Last Name is required.";
        if (!fields.guardianEmailArtist.trim()) return "Legal Guardian E-Mail is required.";
        if (!isEmail(fields.guardianEmailArtist)) return "Please enter a valid Legal Guardian E-Mail.";
      }

      return null;
    }

    if (isSongwriter) {
      if (!fields.songwriterArtistName.trim()) return "Artist Name is required.";
      if (!fields.legalFirstNameSongwriter.trim()) return "First Name is required.";
      if (!fields.legalLastNameSongwriter.trim()) return "Last Name is required.";

      const required = ["origin", "age", "yearsMakingMusic", "genre", "biography"];
      for (const k of required) {
        if (!(fields[k] ?? "").trim()) return `${labelFor(k)} is required.`;
      }

      if (!email.trim()) return "Email is required.";
      if (!isEmail(email)) return "Please enter a valid email address.";

      if (files.length > 1) return "Please upload only one image.";
      if (files[0] && !isAllowedImage(files[0])) return "Image must be jpg or png.";

      return null;
    }

    return null;
  };

  const buildFieldsJson = () => {
    const obj: Record<string, string> = {};

    const put = (k: string, v: string) => {
      const val = (v ?? "").trim();
      if (val) obj[k] = val;
    };

    if (isSync) {
      put("firstName", fields.generalFirstName);
      put("lastName", fields.generalLastName);
      put("fullName", generalFullName);
      put("company", fields.company);
      put("phone", fields.phone);
      put("productionName", fields.productionName);
      put("songTitle", fields.songTitle);
      put("mediaType", fields.mediaType);
      put("term", fields.term);
      put("territory", fields.territory);
    }

    if (isGeneral) {
      put("formKind", "General Contact");
      put("firstName", fields.generalFirstName);
      put("lastName", fields.generalLastName);
      put("fullName", generalFullName);
    }

    if (isSupport) {
      put("formKind", "Support");
      put("firstName", fields.generalFirstName);
      put("lastName", fields.generalLastName);
      put("fullName", generalFullName);
      put("issueType", fields.issueType);
    }

    if (isArtist) {
      put("artistName", fields.artistName);
      put("legalFirstNameArtist", fields.legalFirstNameArtist);
      put("legalLastNameArtist", fields.legalLastNameArtist);
      put("fullLegalNameArtist", artistFullLegalName);

      put("streetNumber", fields.streetNumber);
      put("zipCode", fields.zipCode);
      put("city", fields.city);
      put("country", fields.country);
      put("dateOfBirthArtist", fields.dateOfBirthArtist);

      put("instagram", fields.instagram);
      put("spotifyUri", fields.spotifyUri);
      put("appleArtistId", fields.appleArtistId);

      put("pro", fields.pro);
      put("ipi", fields.ipi);
      put("publisher", fields.publisher);
      put("publisherIpiCae", fields.publisherIpiCae);

      if (artistIsMinor) {
        put("guardianFirstNameArtist", fields.guardianFirstNameArtist);
        put("guardianLastNameArtist", fields.guardianLastNameArtist);
        put("guardianNameArtist", guardianFullLegalNameArtist);
        put("guardianEmailArtist", fields.guardianEmailArtist);
      }
    }

    if (isSongwriter) {
      put("artistName", fields.songwriterArtistName);
      put("legalFirstNameSongwriter", fields.legalFirstNameSongwriter);
      put("legalLastNameSongwriter", fields.legalLastNameSongwriter);
      put("fullLegalNameSongwriter", songwriterFullLegalName);

      put("origin", fields.origin);
      put("age", fields.age);
      put("yearsMakingMusic", fields.yearsMakingMusic);
      put("genre", fields.genre);
      put("biography", fields.biography);
      put("notableAchievements", fields.notableAchievements);
      put("songwriterPro", fields.songwriterPro);
      put("songwriterIpi", fields.songwriterIpi);
    }

    return JSON.stringify(obj);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOkId(null);

    const validationError = validate();
    if (validationError) {
      setErr(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const fd = new FormData();

      fd.append("Type", String(type));
      fd.append("Domain", window.location.hostname || "");
      fd.append("PrivacyAccepted", privacyAccepted ? "true" : "false");

      if (isArtist) {
        fd.append("Name", fields.artistName.trim());
        fd.append("Email", email.trim());
      } else if (isSongwriter) {
        fd.append("Name", fields.songwriterArtistName.trim());
        fd.append("Email", email.trim());
      } else {
        fd.append("Name", generalFullName);
        fd.append("Email", email.trim());
      }

      if (message.trim()) {
        fd.append("Message", message.trim());
      }

      const fieldsJson = buildFieldsJson();
      if (fieldsJson !== "{}") {
        fd.append("FieldsJson", fieldsJson);
      }

      if (isSongwriter && files.length > 0) {
        for (const f of files) {
          fd.append("Files", f);
        }
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

      clearDraft();
      setType("");
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

            {(isGeneral || isSupport || isSync) && (
              <>
                <label className="submitform-field">
                  <span className="submitform-label">FIRST NAME*</span>
                  <input
                    className="submitform-control"
                    value={fields.generalFirstName}
                    onChange={(ev) => setField("generalFirstName", ev.target.value)}
                    placeholder="First name"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">LAST NAME*</span>
                  <input
                    className="submitform-control"
                    value={fields.generalLastName}
                    onChange={(ev) => setField("generalLastName", ev.target.value)}
                    placeholder="Last name"
                  />
                </label>

                <label className="submitform-field submitform-span2">
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

            {isSupport && (
              <label className="submitform-field submitform-span2">
                <span className="submitform-label">ISSUE TYPE</span>
                <input
                  className="submitform-control"
                  value={fields.issueType}
                  onChange={(ev) => setField("issueType", ev.target.value)}
                  placeholder="Technical issue, payment issue, login issue..."
                />
              </label>
            )}

            {isArtist && (
              <>
                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">ARTIST NAME*</span>
                  <input
                    className="submitform-control"
                    value={fields.artistName}
                    onChange={(ev) => setField("artistName", ev.target.value)}
                    placeholder="Artist name"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">FIRST NAME*</span>
                  <input
                    className="submitform-control"
                    value={fields.legalFirstNameArtist}
                    onChange={(ev) => setField("legalFirstNameArtist", ev.target.value)}
                    placeholder="First name"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">LAST NAME*</span>
                  <input
                    className="submitform-control"
                    value={fields.legalLastNameArtist}
                    onChange={(ev) => setField("legalLastNameArtist", ev.target.value)}
                    placeholder="Last name"
                  />
                </label>

                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">CONTACT E-MAIL*</span>
                  <input
                    className="submitform-control"
                    type="email"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    placeholder="name@email.com"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">STREET & NUMBER*</span>
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

                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">DAY OF BIRTH*</span>
                  <input
                    className="submitform-control submitform-date"
                    type="date"
                    value={fields.dateOfBirthArtist}
                    onChange={(ev) => setField("dateOfBirthArtist", ev.target.value)}
                  />
                </label>

                {artistIsMinor && (
                  <>
                    <label className="submitform-field">
                      <span className="submitform-label">LEGAL GUARDIAN FIRST NAME*</span>
                      <input
                        className="submitform-control"
                        value={fields.guardianFirstNameArtist}
                        onChange={(ev) => setField("guardianFirstNameArtist", ev.target.value)}
                        placeholder="Guardian first name"
                      />
                    </label>

                    <label className="submitform-field">
                      <span className="submitform-label">LEGAL GUARDIAN LAST NAME*</span>
                      <input
                        className="submitform-control"
                        value={fields.guardianLastNameArtist}
                        onChange={(ev) => setField("guardianLastNameArtist", ev.target.value)}
                        placeholder="Guardian last name"
                      />
                    </label>

                    <label className="submitform-field submitform-span2">
                      <span className="submitform-label">LEGAL GUARDIAN E-MAIL*</span>
                      <input
                        className="submitform-control"
                        type="email"
                        value={fields.guardianEmailArtist}
                        onChange={(ev) => setField("guardianEmailArtist", ev.target.value)}
                        placeholder="guardian@email.com"
                      />
                    </label>
                  </>
                )}

                <label className="submitform-field">
                  <span className="submitform-label">INSTAGRAM</span>
                  <input
                    className="submitform-control"
                    value={fields.instagram}
                    onChange={(ev) => setField("instagram", ev.target.value)}
                    placeholder="@artistname or profile link"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">SPOTIFY URI*</span>
                  <input
                    className="submitform-control"
                    value={fields.spotifyUri}
                    onChange={(ev) => setField("spotifyUri", ev.target.value)}
                    placeholder="Spotify URI or URL"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">APPLE ID*</span>
                  <input
                    className="submitform-control"
                    value={fields.appleArtistId}
                    onChange={(ev) =>
                      setField("appleArtistId", ev.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="10 digit number of artist URL"
                    inputMode="numeric"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">PRO</span>
                  <input
                    className="submitform-control"
                    value={fields.pro}
                    onChange={(ev) => setField("pro", ev.target.value)}
                    placeholder="ASCAP, BMI, PRS..."
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">IPI NUMBER</span>
                  <input
                    className="submitform-control"
                    value={fields.ipi}
                    onChange={(ev) => setField("ipi", ev.target.value)}
                    placeholder="IPI number"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">PUBLISHER</span>
                  <input
                    className="submitform-control"
                    value={fields.publisher}
                    onChange={(ev) => setField("publisher", ev.target.value)}
                    placeholder="Publisher"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">PUBLISHER IPI/CAE#</span>
                  <input
                    className="submitform-control"
                    value={fields.publisherIpiCae}
                    onChange={(ev) => setField("publisherIpiCae", ev.target.value)}
                    placeholder="Publisher IPI/CAE#"
                  />
                </label>
              </>
            )}

            {isSongwriter && (
              <>
                <label className="submitform-field">
                  <span className="submitform-label">ARTIST NAME*</span>
                  <input
                    className="submitform-control"
                    value={fields.songwriterArtistName}
                    onChange={(ev) => setField("songwriterArtistName", ev.target.value)}
                    placeholder="Artist name"
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

                <label className="submitform-field">
                  <span className="submitform-label">FIRST NAME*</span>
                  <input
                    className="submitform-control"
                    value={fields.legalFirstNameSongwriter}
                    onChange={(ev) => setField("legalFirstNameSongwriter", ev.target.value)}
                    placeholder="First name"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">LAST NAME*</span>
                  <input
                    className="submitform-control"
                    value={fields.legalLastNameSongwriter}
                    onChange={(ev) => setField("legalLastNameSongwriter", ev.target.value)}
                    placeholder="Last name"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">ORIGIN*</span>
                  <input
                    className="submitform-control"
                    value={fields.origin}
                    onChange={(ev) => setField("origin", ev.target.value)}
                    placeholder="Country / city"
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

                <label className="submitform-field">
                  <span className="submitform-label">HOW LONG HAVE YOU BEEN MAKING MUSIC?*</span>
                  <input
                    className="submitform-control"
                    value={fields.yearsMakingMusic}
                    onChange={(ev) => setField("yearsMakingMusic", ev.target.value)}
                    placeholder="e.g. 5 years"
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">GENRES*</span>
                  <input
                    className="submitform-control"
                    value={fields.genre}
                    onChange={(ev) => setField("genre", ev.target.value)}
                    placeholder="Pop, R&B, Afrobeat..."
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">PRO</span>
                  <input
                    className="submitform-control"
                    value={fields.songwriterPro}
                    onChange={(ev) => setField("songwriterPro", ev.target.value)}
                    placeholder="ASCAP, BMI, PRS..."
                  />
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">IPI NUMBER</span>
                  <input
                    className="submitform-control"
                    value={fields.songwriterIpi}
                    onChange={(ev) => setField("songwriterIpi", ev.target.value)}
                    placeholder="IPI number"
                  />
                </label>

                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">ARTIST BIOGRAPHY*</span>
                  <textarea
                    className="submitform-control submitform-textarea"
                    rows={6}
                    value={fields.biography}
                    onChange={(ev) => setField("biography", ev.target.value)}
                    placeholder="Write a short artist biography..."
                  />
                </label>

                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">PHOTO UPLOAD (OPTIONAL)</span>
                  <input
                    className="submitform-control"
                    type="file"
                    accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                    onChange={(ev) => onFilesChange(ev.target.files)}
                  />
                  <small className="submitform-small">
                    It does not need to be a real photo, but the file must be jpg or png.
                  </small>
                </label>

                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">NOTABLE ACHIEVEMENTS</span>
                  <textarea
                    className="submitform-control submitform-textarea"
                    rows={4}
                    value={fields.notableAchievements}
                    onChange={(ev) => setField("notableAchievements", ev.target.value)}
                    placeholder="Awards, placements, collaborations, releases..."
                  />
                </label>
              </>
            )}

            <label className="submitform-field submitform-span2 submitform-field--message">
              <span className="submitform-label">
                MESSAGE{isGeneral || isSupport || isArtist ? "*" : ""}
              </span>
              <textarea
                className="submitform-control submitform-textarea submitform-textarea--large"
                rows={8}
                value={message}
                onChange={(ev) => setMessage(ev.target.value)}
                placeholder="Project details, support request, references, deadlines..."
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
    dateOfBirthArtist: "Day of Birth",
    spotifyUri: "Spotify URI",
    appleArtistId: "Apple ID",
    origin: "Origin",
    age: "Age",
    yearsMakingMusic: "How long have you been making music?",
    genre: "Genres",
    biography: "Artist Biography",
    issueType: "Issue Type",
  };
  return m[k] || k;
}