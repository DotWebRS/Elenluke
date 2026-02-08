// src/pages/Contact.tsx
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../config/apiBase";
import "../styles/submitform.css";

type UiType = "" | "Sync" | "General" | "Legal";
type BackendSubmissionType =
  | "SyncRequest"
  | "GeneralContactInquiry"
  | "LegalRequest";
type ExtraFields = Record<string, string>;

function buildUrl(path: string) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return base ? `${base}/${p}` : `/${p}`;
}

const DISCLAIMER = "";
const DRAFT_KEY = "contact_form_draft_v1";

const DEFAULT_FIELDS: ExtraFields = {
  company: "",
  phone: "",
  productionName: "",
  songTitle: "",
  mediaType: "",
  term: "",
  territory: "",
};

type DraftPayload = {
  type: UiType;
  name: string;
  email: string;
  message: string;
  privacyAccepted: boolean;
  fields: ExtraFields;
};

function looksLikeFullName(v: string) {
  const parts = (v || "")
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean);
  return parts.length >= 2;
}

function safeParseDraft(raw: string | null): DraftPayload | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    if (!d || typeof d !== "object") return null;

    return {
      type: (typeof d.type === "string" ? d.type : "") as UiType,
      name: typeof d.name === "string" ? d.name : "",
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

export default function Contact() {
  const navigate = useNavigate();

  // read draft ONCE (mount)
  const initialDraft = useMemo(
    () => safeParseDraft(sessionStorage.getItem(DRAFT_KEY)),
    []
  );

  const [type, setType] = useState<UiType>(initialDraft?.type ?? "");
  const [name, setName] = useState(initialDraft?.name ?? "");
  const [email, setEmail] = useState(initialDraft?.email ?? "");
  const [message, setMessage] = useState(initialDraft?.message ?? "");
  const [privacyAccepted, setPrivacyAccepted] = useState(
    initialDraft?.privacyAccepted ?? false
  );
  const [fields, setFields] = useState<ExtraFields>(
    initialDraft?.fields ?? DEFAULT_FIELDS
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [okId, setOkId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // helper: save immediately (prevents losing last keystroke if user clicks link fast)
  const saveDraftNow = (next?: Partial<DraftPayload>) => {
    if (isSubmitting) return;
    try {
      const payload: DraftPayload = {
        type,
        name,
        email,
        message,
        privacyAccepted,
        fields,
        ...(next || {}),
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  };

  const setField = (key: string, value: string) => {
    setFields((prev) => {
      const next = { ...prev, [key]: value };
      saveDraftNow({ fields: next });
      return next;
    });
  };

  const backendType = useMemo<BackendSubmissionType | "">(() => {
    if (type === "Sync") return "SyncRequest";
    if (type === "General") return "GeneralContactInquiry";
    if (type === "Legal") return "LegalRequest";
    return "";
  }, [type]);

  const visibleFieldKeys = useMemo(() => {
    switch (type) {
      case "Sync":
        return [
          "company",
          "phone",
          "productionName",
          "songTitle",
          "mediaType",
          "term",
          "territory",
        ];
      case "General":
      case "Legal":
        return ["company", "phone"];
      default:
        return [];
    }
  }, [type]);

  const buildFieldsJson = () => {
    const obj: Record<string, string> = {};
    for (const k of visibleFieldKeys) {
      const v = (fields[k] ?? "").trim();
      if (v) obj[k] = v;
    }
    return JSON.stringify(obj);
  };

  const validate = () => {
    const n = name.trim();
    const e = email.trim();
    const msg = message.trim();

    if (!type) return "Submission Type is required.";
    if (!backendType) return "Submission Type is invalid.";
    if (!n || !e) return "Name and Email are required.";
    if (!looksLikeFullName(n)) return "In Name box enter First name Last name.";
    if (!privacyAccepted) return "Privacy policy must be accepted.";
    if (type === "Legal" && !msg)
      return "Message is required for Legal submissions.";

    return null;
  };

  // safety: if browser navigates away / reloads, persist draft
  useEffect(() => {
    const onPageHide = () => saveDraftNow();
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, name, email, message, privacyAccepted, fields, isSubmitting]);

  // optional: keep your effect-save too (fine), but now we also save immediately on change
  useEffect(() => {
    saveDraftNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, name, email, message, privacyAccepted, fields]);

  const resetForm = () => {
    setType("");
    setName("");
    setEmail("");
    setMessage("");
    setPrivacyAccepted(false);
    setFields(DEFAULT_FIELDS);
  };

  const clearDraft = () => {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
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

      fd.append("Type", String(backendType));
      fd.append("Domain", window.location.hostname || "");
      fd.append("Name", name.trim());
      fd.append("Email", email.trim());
      fd.append("PrivacyAccepted", privacyAccepted ? "true" : "false");

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
      setOkId(data?.id ?? "submitted");

      // SUCCESS: clear storage + reset state
      clearDraft();
      resetForm();
    } catch (ex: any) {
      setErr(ex?.message || "Submit failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="submitform-page">
      <section className="submitform-wrap">
        <header className="submitform-head">
          <button
            type="button"
            className="submitform-back"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <span className="submitform-backIcon" aria-hidden="true">
              ←
            </span>
            <span className="submitform-backTxt">Back</span>
          </button>

          <h1 className="submitform-title">
            CONTACT <span className="submitform-titleGrad">US</span>
          </h1>
          <p className="submitform-sub">
            Use this page to contact us or submit a request.
          </p>
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
                    const v = ev.target.value as UiType;
                    setType(v);
                    saveDraftNow({ type: v });
                  }}
                >
                  <option value="">Select…</option>
                  <option value="General">General</option>
                  <option value="Sync">Sync</option>
                  <option value="Legal">Legal</option>
                </select>
              </div>
            </label>

            <div className="submitform-divider" />

            <label className="submitform-field">
              <span className="submitform-label">NAME*</span>
              <input
                className="submitform-control"
                value={name}
                onChange={(ev) => {
                  const v = ev.target.value;
                  setName(v);
                  saveDraftNow({ name: v });
                }}
                placeholder="First name Last name"
              />
            </label>

            <label className="submitform-field">
              <span className="submitform-label">EMAIL*</span>
              <input
                className="submitform-control"
                type="email"
                value={email}
                onChange={(ev) => {
                  const v = ev.target.value;
                  setEmail(v);
                  saveDraftNow({ email: v });
                }}
                placeholder="name@email.com"
              />
            </label>

            {(type === "General" || type === "Legal") && (
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

            {type === "Sync" && (
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
                    onChange={(ev) =>
                      setField("productionName", ev.target.value)
                    }
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
                  <div className="submitform-select">
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
                  </div>
                </label>

                <label className="submitform-field">
                  <span className="submitform-label">TERM</span>
                  <div className="submitform-select">
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
                  </div>
                </label>

                <label className="submitform-field submitform-span2">
                  <span className="submitform-label">TERRITORY</span>
                  <div className="submitform-select">
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
                  </div>
                </label>
              </>
            )}

            <label className="submitform-field submitform-span2">
              <span className="submitform-label">
                MESSAGE{type === "Legal" ? "*" : ""}
              </span>
              <textarea
                className="submitform-control submitform-textarea"
                rows={7}
                value={message}
                onChange={(ev) => {
                  const v = ev.target.value;
                  setMessage(v);
                  saveDraftNow({ message: v });
                }}
                placeholder="Project details, references, deadlines, budget notes..."
              />
            </label>

            <label className="submitform-field submitform-span2 submitform-privacy">
              <span>
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(ev) => {
                    const v = ev.target.checked;
                    setPrivacyAccepted(v);
                    saveDraftNow({ privacyAccepted: v });
                  }}
                />
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
              Submitted successfully. Reference ID:{" "}
              <span className="submitform-mono">{okId}</span>
            </div>
          )}

          <div className="submitform-foot">
            <button className="submitform-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "SENDING..." : "SEND"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
