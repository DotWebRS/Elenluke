import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { API_BASE } from "../config/apiBase";
import "../styles/submitform.css"

type UiType = "" | "Sync" | "General" | "Legal";
type BackendSubmissionType = "SyncRequest" | "GeneralContactInquiry" | "LegalRequest";

type ExtraFields = Record<string, string>;

function buildUrl(path: string) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return base ? `${base}/${p}` : `/${p}`;
}

const DISCLAIMER = "";

function looksLikeFullName(v: string) {
  const parts = (v || "").trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
  return parts.length >= 2;
}

export default function Contact() {
  const [type, setType] = useState<UiType>("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const [fields, setFields] = useState<ExtraFields>({
    company: "",
    phone: "",
    productionName: "",
    songTitle: "",
    mediaType: "",
    term: "",
    territory: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [okId, setOkId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const setField = (key: string, value: string) => {
    setFields((p) => ({ ...p, [key]: value }));
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
        return ["company", "phone", "productionName", "songTitle", "mediaType", "term", "territory"];
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

    // client request: Legal must have a message body
    if (type === "Legal" && !msg) return "Message is required for Legal submissions.";

    // optional: enforce General too (uncomment if you want)
    // if (type === "General" && !msg) return "Message is required.";

    return null;
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

      // reset only what makes sense
      setMessage("");
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
                onChange={(ev) => setType(ev.target.value as UiType)}
              >
                <option value="">Select…</option>
                <option value="General">General</option>
                <option value="Sync">Sync</option>
                <option value="Legal">Legal</option>
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

            <label className="submitform-field submitform-span2">
              <span className="submitform-label">MESSAGE{type === "Legal" ? "*" : ""}</span>
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
                <a className="submitform-link" href="/privacy">
                  Privacy Policy
                </a>{" "}
                and{" "}
                <a className="submitform-link" href="/cookies">
                  Cookie Policy
                </a>
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
    </main>
  );
}
