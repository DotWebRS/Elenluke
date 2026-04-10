import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import Footer from "../components/Footer";
import { API_BASE } from "../config/apiBase";

type SubmissionType =
  | "DemoUpload"
  | "GeneralContactInquiry"
  | "SupportForm"
  | "SyncRequest";

type ExtraFields = {
  generalFirstName: string;
  generalLastName: string;

  supportFirstName: string;
  supportLastName: string;
  supportIssueType: string;

  demoFirstName: string;
  demoLastName: string;
  demoArtistName: string;
  demoReleaseTitle: string;
  demoPhone: string;
  demoInstagram: string;
  demoSpotifyProfile: string;
  demoSubmissionLink: string;
  demoPreferredReleaseDate: string;
  demoHasArtwork: "" | "yes" | "no";
  demoContactPreference: "" | "instagram" | "email";
  demoArtworkFileName: string;

  syncFirstName: string;
  syncLastName: string;
  syncCompany: string;
  syncTelephone: string;
  syncSongTitle: string;
  syncSongwriterArtist: string;
  syncProductionName: string;
  syncMediaType: string;
  syncTerritory: string;
};

type DraftPayload = {
  type: SubmissionType | "";
  email: string;
  message: string;
  privacyAccepted: boolean;
  fields: ExtraFields;
};

const DRAFT_KEY = "pcr_contact_form_draft_v3";

const DEFAULT_FIELDS: ExtraFields = {
  generalFirstName: "",
  generalLastName: "",

  supportFirstName: "",
  supportLastName: "",
  supportIssueType: "",

  demoFirstName: "",
  demoLastName: "",
  demoArtistName: "",
  demoReleaseTitle: "",
  demoPhone: "",
  demoInstagram: "",
  demoSpotifyProfile: "",
  demoSubmissionLink: "",
  demoPreferredReleaseDate: "",
  demoHasArtwork: "",
  demoContactPreference: "",
  demoArtworkFileName: "",

  syncFirstName: "",
  syncLastName: "",
  syncCompany: "",
  syncTelephone: "",
  syncSongTitle: "",
  syncSongwriterArtist: "",
  syncProductionName: "",
  syncMediaType: "",
  syncTerritory: "",
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
      type: (typeof d.type === "string" ? d.type : "") as SubmissionType | "",
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

function looksLikeName(v: string) {
  return (v || "").trim().length >= 2;
}

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());
}

function isValidUrl(v: string) {
  try {
    const s = String(v || "").trim();
    if (!s) return false;
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

function isSoundcloudUrl(v: string) {
  const s = String(v || "").trim().toLowerCase();
  return isValidUrl(s) && s.includes("soundcloud.com");
}

function isAllowedArtworkFile(file: File) {
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();

  return (
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    type === "image/jpeg" ||
    type === "image/png"
  );
}

export default function Contact() {
  const [searchParams] = useSearchParams();

  const initialDraft = useMemo(
    () => safeParseDraft(sessionStorage.getItem(DRAFT_KEY)),
    []
  );

  const [type, setType] = useState<SubmissionType | "">(initialDraft?.type ?? "");
  const [email, setEmail] = useState(initialDraft?.email ?? "");
  const [message, setMessage] = useState(initialDraft?.message ?? "");
  const [privacyAccepted, setPrivacyAccepted] = useState(
    initialDraft?.privacyAccepted ?? false
  );
  const [fields, setFields] = useState<ExtraFields>({
    ...DEFAULT_FIELDS,
    ...(initialDraft?.fields ?? {}),
  });

  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [okId, setOkId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const isGeneral = type === "GeneralContactInquiry";
  const isSupport = type === "SupportForm";
  const isDemo = type === "DemoUpload";
  const isSync = type === "SyncRequest";

  useEffect(() => {
    const typeParam = (searchParams.get("type") || "").toLowerCase();

    if (type) return;

    if (typeParam === "demo") {
      setType("DemoUpload");
      return;
    }

    if (typeParam === "support") {
      setType("SupportForm");
      return;
    }

    if (typeParam === "general") {
      setType("GeneralContactInquiry");
      return;
    }

    if (typeParam === "sync") {
      setType("SyncRequest");
    }
  }, [searchParams, type]);

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
    setType("");
    setEmail("");
    setMessage("");
    setPrivacyAccepted(false);
    setFields({ ...DEFAULT_FIELDS });
    setArtworkFile(null);
  };

  const onArtworkChange = (list: FileList | null) => {
    if (!list || list.length === 0) {
      setArtworkFile(null);
      setField("demoArtworkFileName", "");
      return;
    }

    const file = list[0];

    if (!isAllowedArtworkFile(file)) {
      setErr("Only cover artwork files in JPG or PNG format are allowed.");
      setArtworkFile(null);
      setField("demoArtworkFileName", "");
      return;
    }

    setErr(null);
    setArtworkFile(file);
    setField("demoArtworkFileName", file.name);
  };

  const validateGeneral = () => {
    if (!looksLikeName(fields.generalFirstName)) return "First Name is required.";
    if (!looksLikeName(fields.generalLastName)) return "Last Name is required.";
    if (!email.trim()) return "Email is required.";
    if (!isEmail(email)) return "Please enter a valid email address.";
    if (!message.trim()) return "Message is required.";
    return null;
  };

  const validateSupport = () => {
    if (!looksLikeName(fields.supportFirstName)) return "First Name is required.";
    if (!looksLikeName(fields.supportLastName)) return "Last Name is required.";
    if (!email.trim()) return "Email is required.";
    if (!isEmail(email)) return "Please enter a valid email address.";
    if (!message.trim()) return "Message is required.";
    return null;
  };

  const validateDemo = () => {
    if (!looksLikeName(fields.demoFirstName)) return "First Name is required.";
    if (!looksLikeName(fields.demoLastName)) return "Last Name is required.";
    if (!email.trim()) return "Email is required.";
    if (!isEmail(email)) return "Please enter a valid email address.";
    if (!fields.demoPhone.trim()) return "Phone Number is required.";
    if (!fields.demoArtistName.trim()) return "Artist Name is required.";
    if (!fields.demoReleaseTitle.trim()) return "Release Title is required.";
    if (!fields.demoSpotifyProfile.trim()) return "Spotify Profile is required.";

    if (!isValidUrl(fields.demoSpotifyProfile)) {
      return "Please enter a valid Spotify Profile URL.";
    }

    if (!fields.demoSubmissionLink.trim()) {
      return "SoundCloud link is required.";
    }

    if (!isSoundcloudUrl(fields.demoSubmissionLink)) {
      return "Please enter a valid SoundCloud link.";
    }

    if (!fields.demoPreferredReleaseDate.trim()) {
      return "Preferred Release Date is required.";
    }

    if (!fields.demoHasArtwork) {
      return "Please choose if you have artwork already.";
    }

    if (fields.demoHasArtwork === "yes") {
      if (!artworkFile) {
        return "Please upload your cover artwork.";
      }

      if (!isAllowedArtworkFile(artworkFile)) {
        return "Only cover artwork files in JPG or PNG format are allowed.";
      }
    }

    if (!fields.demoContactPreference) {
      return "Please choose how we should contact you.";
    }

    if (!message.trim()) return "Tell us about your release is required.";

    return null;
  };

  const validateSync = () => {
    if (!looksLikeName(fields.syncFirstName)) return "First Name is required.";
    if (!looksLikeName(fields.syncLastName)) return "Last Name is required.";
    if (!email.trim()) return "Email is required.";
    if (!isEmail(email)) return "Please enter a valid email address.";
    if (!fields.syncTelephone.trim()) return "Telephone Number is required.";
    if (!fields.syncSongTitle.trim()) return "Song Title is required.";
    if (!fields.syncSongwriterArtist.trim()) {
      return "Songwriter / Artist is required.";
    }
    if (!fields.syncMediaType.trim()) return "Media Type is required.";
    if (!fields.syncTerritory.trim()) return "Territory is required.";
    return null;
  };

  const validate = () => {
    if (!type) return "Submission Type is required.";
    if (!privacyAccepted) return "Privacy policy must be accepted.";

    if (isGeneral) return validateGeneral();
    if (isSupport) return validateSupport();
    if (isDemo) return validateDemo();
    if (isSync) return validateSync();

    return null;
  };

  const buildFieldsJson = () => {
    const obj: Record<string, string> = {};

    const put = (k: string, v: string) => {
      const val = (v ?? "").trim();
      if (val) obj[k] = val;
    };

    if (isGeneral) {
      put("formKind", "General Contact");
      put("firstName", fields.generalFirstName);
      put("lastName", fields.generalLastName);
      put(
        "fullName",
        `${fields.generalFirstName} ${fields.generalLastName}`.trim()
      );
    }

    if (isSupport) {
      put("formKind", "Support");
      put("firstName", fields.supportFirstName);
      put("lastName", fields.supportLastName);
      put(
        "fullName",
        `${fields.supportFirstName} ${fields.supportLastName}`.trim()
      );
      put("issueType", fields.supportIssueType);
    }

    if (isDemo) {
      put("formKind", "Demo Upload");
      put("firstName", fields.demoFirstName);
      put("lastName", fields.demoLastName);
      put("fullName", `${fields.demoFirstName} ${fields.demoLastName}`.trim());
      put("phone", fields.demoPhone);
      put("artistName", fields.demoArtistName);
      put("releaseTitle", fields.demoReleaseTitle);
      put("instagram", fields.demoInstagram);
      put("spotifyProfile", fields.demoSpotifyProfile);
      put("soundcloudLink", fields.demoSubmissionLink);
      put("preferredReleaseDate", fields.demoPreferredReleaseDate);
      put("hasArtwork", fields.demoHasArtwork);
      put("contactPreference", fields.demoContactPreference);
      put("artworkFileName", fields.demoArtworkFileName);
    }

    if (isSync) {
      put("formKind", "Sync Licensing");
      put("firstName", fields.syncFirstName);
      put("lastName", fields.syncLastName);
      put("fullName", `${fields.syncFirstName} ${fields.syncLastName}`.trim());
      put("company", fields.syncCompany);
      put("telephoneNumber", fields.syncTelephone);
      put("songTitle", fields.syncSongTitle);
      put("songwriterArtist", fields.syncSongwriterArtist);
      put("productionName", fields.syncProductionName);
      put("mediaType", fields.syncMediaType);
      put("territory", fields.syncTerritory);
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

      if (isGeneral) {
        fd.append("Name", `${fields.generalFirstName} ${fields.generalLastName}`.trim());
      }

      if (isSupport) {
        fd.append("Name", `${fields.supportFirstName} ${fields.supportLastName}`.trim());
      }

      if (isDemo) {
        fd.append("Name", `${fields.demoFirstName} ${fields.demoLastName}`.trim());
      }

      if (isSync) {
        fd.append("Name", `${fields.syncFirstName} ${fields.syncLastName}`.trim());
      }

      fd.append("Email", email.trim());

      if (message.trim()) {
        fd.append("Message", message.trim());
      }

      const fieldsJson = buildFieldsJson();
      if (fieldsJson !== "{}") {
        fd.append("FieldsJson", fieldsJson);
      }

      if (isDemo && artworkFile) {
        fd.append("Files", artworkFile);
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
            CONTACT <span className="contact-titleGrad">US</span>
          </h1>
          <p className="contact-sub">
            Reach out directly, contact support, send your demo, or submit a sync request.
          </p>
        </header>

        <form className="contact-card" onSubmit={onSubmit}>
          <div className="contact-grid">
            <label className="contact-field contact-span2">
              <span className="contact-label">SUBMISSION TYPE*</span>
              <div className="contact-select">
                <select
                  className="contact-control"
                  value={type}
                  onChange={(ev) => {
                    const next = ev.target.value as SubmissionType | "";
                    setType(next);
                    setArtworkFile(null);
                    setErr(null);
                    setOkId(null);
                  }}
                >
                  <option value="" disabled>
                    Choose category
                  </option>
                  <option value="DemoUpload">Demo Upload</option>
                  <option value="SyncRequest">Sync Licensing</option>
                  <option value="GeneralContactInquiry">General Contact</option>
                  <option value="SupportForm">Support</option>
                </select>
              </div>
            </label>

            <label className="contact-field contact-span2">
              <span className="contact-label">EMAIL*</span>
              <input
                className="contact-control"
                type="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                placeholder="name@email.com"
              />
            </label>

            <div className="contact-divider" />

            {isGeneral && (
              <>
                <label className="contact-field">
                  <span className="contact-label">FIRST NAME*</span>
                  <input
                    className="contact-control"
                    value={fields.generalFirstName}
                    onChange={(ev) => setField("generalFirstName", ev.target.value)}
                    placeholder="First name"
                  />
                </label>

                <label className="contact-field">
                  <span className="contact-label">LAST NAME*</span>
                  <input
                    className="contact-control"
                    value={fields.generalLastName}
                    onChange={(ev) => setField("generalLastName", ev.target.value)}
                    placeholder="Last name"
                  />
                </label>
              </>
            )}

            {isSupport && (
              <>
                <label className="contact-field">
                  <span className="contact-label">FIRST NAME*</span>
                  <input
                    className="contact-control"
                    value={fields.supportFirstName}
                    onChange={(ev) => setField("supportFirstName", ev.target.value)}
                    placeholder="First name"
                  />
                </label>

                <label className="contact-field">
                  <span className="contact-label">LAST NAME*</span>
                  <input
                    className="contact-control"
                    value={fields.supportLastName}
                    onChange={(ev) => setField("supportLastName", ev.target.value)}
                    placeholder="Last name"
                  />
                </label>

                <label className="contact-field contact-span2">
                  <span className="contact-label">ISSUE TYPE</span>
                  <input
                    className="contact-control"
                    value={fields.supportIssueType}
                    onChange={(ev) => setField("supportIssueType", ev.target.value)}
                    placeholder="Technical issue, payment issue, login issue..."
                  />
                </label>
              </>
            )}

            {isDemo && (
              <>
                <label className="contact-field">
                  <span className="contact-label">FIRST NAME*</span>
                  <input
                    className="contact-control"
                    value={fields.demoFirstName}
                    onChange={(ev) => setField("demoFirstName", ev.target.value)}
                    placeholder="First name"
                  />
                </label>

                <label className="contact-field">
                  <span className="contact-label">LAST NAME*</span>
                  <input
                    className="contact-control"
                    value={fields.demoLastName}
                    onChange={(ev) => setField("demoLastName", ev.target.value)}
                    placeholder="Last name"
                  />
                </label>

                <label className="contact-field">
                  <span className="contact-label">PHONE NUMBER*</span>
                  <input
                    className="contact-control"
                    value={fields.demoPhone}
                    onChange={(ev) => setField("demoPhone", ev.target.value)}
                    placeholder="Phone number"
                  />
                </label>

                <label className="contact-field">
                  <span className="contact-label">ARTIST NAME*</span>
                  <input
                    className="contact-control"
                    value={fields.demoArtistName}
                    onChange={(ev) => setField("demoArtistName", ev.target.value)}
                    placeholder="Artist name"
                  />
                </label>

                <label className="contact-field">
                  <span className="contact-label">INSTAGRAM</span>
                  <input
                    className="contact-control"
                    value={fields.demoInstagram}
                    onChange={(ev) => setField("demoInstagram", ev.target.value)}
                    placeholder="@instagram"
                  />
                </label>

                <label className="contact-field">
                  <span className="contact-label">SPOTIFY PROFILE*</span>
                  <input
                    className="contact-control"
                    value={fields.demoSpotifyProfile}
                    onChange={(ev) => setField("demoSpotifyProfile", ev.target.value)}
                    placeholder="https://open.spotify.com/..."
                  />
                </label>

                <label className="contact-field contact-span2">
                  <span className="contact-label">
                    SOUNDCLOUD LINK*
                  </span>
                  <input
                    className="contact-control"
                    value={fields.demoSubmissionLink}
                    onChange={(ev) => setField("demoSubmissionLink", ev.target.value)}
                    placeholder="https://soundcloud.com/..."
                  />
                </label>

                <label className="contact-field">
                  <span className="contact-label">RELEASE TITLE*</span>
                  <input
                    className="contact-control"
                    value={fields.demoReleaseTitle}
                    onChange={(ev) => setField("demoReleaseTitle", ev.target.value)}
                    placeholder="Release title"
                  />
                </label>

                <label className="contact-field">
                  <span className="contact-label">PREFERRED RELEASE DATE*</span>
                  <input
                    className="contact-control"
                    type="date"
                    value={fields.demoPreferredReleaseDate}
                    onChange={(ev) =>
                      setField("demoPreferredReleaseDate", ev.target.value)
                    }
                  />
                </label>

                <label className="contact-field">
                  <span className="contact-label">DO YOU HAVE AN ARTWORK ALREADY?*</span>
                  <div className="contact-select">
                    <select
                      className="contact-control"
                      value={fields.demoHasArtwork}
                      onChange={(ev) => {
                        const value = ev.target.value as "" | "yes" | "no";
                        setField("demoHasArtwork", value);

                        if (value !== "yes") {
                          setArtworkFile(null);
                          setField("demoArtworkFileName", "");
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

                <label className="contact-field">
                  <span className="contact-label">HOW SHOULD WE CONTACT YOU?*</span>
                  <div className="contact-select">
                    <select
                      className="contact-control"
                      value={fields.demoContactPreference}
                      onChange={(ev) =>
                        setField(
                          "demoContactPreference",
                          ev.target.value as "" | "instagram" | "email"
                        )
                      }
                    >
                      <option value="" disabled>
                        Choose option
                      </option>
                      <option value="instagram">Instagram</option>
                      <option value="email">Email</option>
                    </select>
                  </div>
                </label>

                {fields.demoHasArtwork === "yes" && (
                  <label className="contact-field contact-span2">
                    <span className="contact-label">
                      UPLOAD COVER ARTWORK* (JPG OR PNG ONLY)
                    </span>
                    <input
                      className="contact-control"
                      type="file"
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      onChange={(ev) => onArtworkChange(ev.target.files)}
                    />
                    {artworkFile && (
                      <div className="contact-filelist">
                        <div className="contact-fileitem">{artworkFile.name}</div>
                      </div>
                    )}
                  </label>
                )}
              </>
            )}

            {isSync && (
              <>
                <label className="contact-field">
                  <span className="contact-label">FIRST NAME*</span>
                  <input
                    className="contact-control"
                    value={fields.syncFirstName}
                    onChange={(ev) => setField("syncFirstName", ev.target.value)}
                    placeholder="First name"
                  />
                </label>

                <label className="contact-field">
                  <span className="contact-label">LAST NAME*</span>
                  <input
                    className="contact-control"
                    value={fields.syncLastName}
                    onChange={(ev) => setField("syncLastName", ev.target.value)}
                    placeholder="Last name"
                  />
                </label>

                <label className="contact-field">
                  <span className="contact-label">COMPANY</span>
                  <input
                    className="contact-control"
                    value={fields.syncCompany}
                    onChange={(ev) => setField("syncCompany", ev.target.value)}
                    placeholder="Company"
                  />
                </label>

                <label className="contact-field">
                  <span className="contact-label">TELEPHONE NUMBER*</span>
                  <input
                    className="contact-control"
                    value={fields.syncTelephone}
                    onChange={(ev) => setField("syncTelephone", ev.target.value)}
                    placeholder="Telephone number"
                  />
                </label>

                <label className="contact-field">
                  <span className="contact-label">SONG TITLE*</span>
                  <input
                    className="contact-control"
                    value={fields.syncSongTitle}
                    onChange={(ev) => setField("syncSongTitle", ev.target.value)}
                    placeholder="Song title"
                  />
                </label>

                <label className="contact-field">
                  <span className="contact-label">SONGWRITER / ARTIST*</span>
                  <input
                    className="contact-control"
                    value={fields.syncSongwriterArtist}
                    onChange={(ev) =>
                      setField("syncSongwriterArtist", ev.target.value)
                    }
                    placeholder="Songwriter / Artist"
                  />
                </label>

                <label className="contact-field">
                  <span className="contact-label">PRODUCTION NAME</span>
                  <input
                    className="contact-control"
                    value={fields.syncProductionName}
                    onChange={(ev) =>
                      setField("syncProductionName", ev.target.value)
                    }
                    placeholder="Production name"
                  />
                </label>

                <label className="contact-field">
                  <span className="contact-label">MEDIA TYPE*</span>
                  <input
                    className="contact-control"
                    value={fields.syncMediaType}
                    onChange={(ev) => setField("syncMediaType", ev.target.value)}
                    placeholder="Film, TV, Ad, Game..."
                  />
                </label>

                <label className="contact-field contact-span2">
                  <span className="contact-label">TERRITORY*</span>
                  <input
                    className="contact-control"
                    value={fields.syncTerritory}
                    onChange={(ev) => setField("syncTerritory", ev.target.value)}
                    placeholder="Worldwide, Europe, US..."
                  />
                </label>
              </>
            )}

            <label className="contact-field contact-span2 contact-field--message">
              <span className="contact-label">
                {isDemo
                  ? "TELL US ABOUT YOUR RELEASE*"
                  : isSync
                  ? "ADDITIONAL INFO"
                  : "MESSAGE*"}
              </span>
              <textarea
                className="contact-control contact-textarea contact-textarea--large"
                rows={8}
                value={message}
                onChange={(ev) => setMessage(ev.target.value)}
                placeholder={
                  isDemo
                    ? "Tell us about your release..."
                    : isSync
                    ? "Additional info..."
                    : "Your message..."
                }
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

            {isDemo && (
              <div className="contact-field contact-span2">
                <div className="contact-note contact-note--demo">
                  We carefully review all submissions and evaluate if they fit our
                  network or not. Due to the high amount of submissions we can’t
                  guarantee that all submissions will be answered. If accepted we will
                  get back to you shortly.
                </div>
              </div>
            )}
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