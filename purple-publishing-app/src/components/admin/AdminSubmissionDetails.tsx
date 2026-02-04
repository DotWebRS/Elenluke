import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ADMIN_SITES } from "./adminSites";
import type { AdminSiteKey } from "./adminSites";

import { API_BASE } from "../../config/apiBase";
import "../../styles/AdminSubmissionDetails.css";

// ------------------ KONFIG ------------------

const SUBMISSION_TYPES: Record<number, string> = {
  1: "Demo Upload",
  2: "Publishing",
  3: "Legal",
  4: "Support",
  5: "Info",
  6: "General Contact",
};

const DEMO_TYPE = 1;

const STATUSES: Record<number, string> = {
  1: "Unread",
  2: "Read",
  3: "In progress",
  4: "Done",
  5: "Accepted",
  6: "Rejected",
};

// ------------------ TIPOVI ------------------

type SubmissionField = {
  name: string;
  value: string;
};

type SubmissionFile = {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
};

type SubmissionReply = {
  id: string;
  createdAtUtc: string;
  toEmail: string;
  subject: string;
  body: string;
};

type SubmissionDetails = {
  id: string;
  type: number;
  status: number;
  domain: string;
  name: string;
  email: string;
  message: string | null;
  uploadedBy: string | null;
  createdAt: string;
  fields: SubmissionField[];
  files: SubmissionFile[];
  replies: SubmissionReply[];
};

// ------------------ POMOĆNE ------------------

function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  // fallback ako nešto pošalje loš datum
  return isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function bytes(n: number) {
  if (!Number.isFinite(n)) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function buildUrl(path: string) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return base ? `${base}/${p}` : `/${p}`;
}

// ------------------ KOMPONENTA ------------------

export default function AdminSubmissionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const qsSite = (sp.get("site") as AdminSiteKey) ?? "purple-crunch-publishing";
  const [site, setSite] = useState<AdminSiteKey>(qsSite);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : "";

  const authHeaders = useMemo(() => {
    const h: Record<string, string> = {};
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<SubmissionDetails | null>(null);

  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [cc, setCc] = useState("");

  // preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<
    "image" | "audio" | "pdf" | "other"
  >("other");
  const [previewName, setPreviewName] = useState("");

  // ------------------ UCITAVANJE ------------------

  async function load() {
    if (!id) return;
    if (!token) {
      navigate("/admin/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(buildUrl(`/api/submissions/${id}`), {
        headers: { ...authHeaders },
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        navigate("/admin/login");
        return;
      }

      if (!res.ok) {
        setError(`API error ${res.status}`);
        setData(null);
        return;
      }

      const json = (await res.json()) as SubmissionDetails;
      setData(json);

      if (!replySubject) {
        setReplySubject(
          `Re: ${SUBMISSION_TYPES[json.type] ?? "Submission"}`
        );
      }
    } catch (e: any) {
      setError(e?.message ?? "Network error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function fieldValue(name: string) {
    const v = data?.fields?.find(
      (f) => (f.name ?? "").toLowerCase() === name.toLowerCase()
    );
    return v?.value ?? "";
  }

  // ------------------ STATUS / DEMO ------------------

  async function setStatus(nextStatus: number) {
    if (!id) return;
    setError("");

    const res = await fetch(buildUrl(`/api/submissions/${id}/status`), {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (res.status === 401) {
      localStorage.removeItem("token");
      navigate("/admin/login");
      return;
    }

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      setError(`Status error ${res.status}${t ? ` — ${t}` : ""}`);
      return;
    }

    await load();
  }

  async function acceptDemo() {
    if (data?.type !== DEMO_TYPE) {
      setError("Accept/Reject is only available for Demo Upload.");
      return;
    }
    setError("");

    const res = await fetch(buildUrl(`/api/submissions/${id}/accept`), {
      method: "PUT",
      headers: { ...authHeaders },
    });

    if (res.status === 401) {
      localStorage.removeItem("token");
      navigate("/admin/login");
      return;
    }

    if (!res.ok) {
      setError(`Accept error ${res.status}`);
      return;
    }

    await load();
  }

  async function rejectDemo() {
    if (data?.type !== DEMO_TYPE) {
      setError("Accept/Reject is only available for Demo Upload.");
      return;
    }
    setError("");

    const rejectionBody =
      fieldValue("autoRejectionBody") ||
      `Hi ${data?.name || ""},\n\nThank you for your demo.\n\nBest,\nPurple Team\n`;

    const res = await fetch(buildUrl(`/api/submissions/${id}/reject`), {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ body: rejectionBody }),
    });

    if (res.status === 401) {
      localStorage.removeItem("token");
      navigate("/admin/login");
      return;
    }

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      setError(`Reject error ${res.status}${t ? ` — ${t}` : ""}`);
      return;
    }

    await load();
  }

  // ------------------ REPLY ------------------

  async function sendReply() {
    if (!id) return;
    setError("");

    if (!replySubject.trim() || !replyBody.trim()) {
      setError("Subject and body are required.");
      return;
    }

    const res = await fetch(buildUrl(`/api/submissions/${id}/reply`), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({
        subject: replySubject.trim(),
        body: replyBody,
        cc: cc.trim() || null,
      }),
    });

    if (res.status === 401) {
      localStorage.removeItem("token");
      navigate("/admin/login");
      return;
    }

    if (!res.ok) {
      setError(`Reply error ${res.status}`);
      return;
    }

    setReplyBody("");
    await load();
  }

  // ------------------ FAJLOVI ------------------

  async function fetchFileBlob(fileId: string) {
    if (!id) return null;

    const res = await fetch(
      buildUrl(`/api/submissions/${id}/files/${fileId}/download`),
      {
        headers: { ...authHeaders },
      }
    );

    if (res.status === 401) {
      localStorage.removeItem("token");
      navigate("/admin/login");
      return null;
    }

    if (!res.ok) {
      setError(`Download error ${res.status}`);
      return null;
    }

    const blob = await res.blob();
    return blob;
  }

  async function downloadFile(fileId: string, fileName: string) {
    const blob = await fetchFileBlob(fileId);
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function previewFile(
    fileId: string,
    fileName: string,
    contentType: string
  ) {
    const blob = await fetchFileBlob(fileId);
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setPreviewName(fileName);

    const ct = (contentType ?? "").toLowerCase();
    if (ct.startsWith("image/")) setPreviewKind("image");
    else if (ct.startsWith("audio/")) setPreviewKind("audio");
    else if (ct === "application/pdf") setPreviewKind("pdf");
    else setPreviewKind("other");
  }

  function closePreview() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewName("");
    setPreviewKind("other");
  }

  // ------------------ DERIVED ------------------

  const isDemo = data?.type === DEMO_TYPE;
  const lockedByDecision = data?.status === 5 || data?.status === 6;
  const rejectionBody = fieldValue("autoRejectionBody");

  // ------------------ RENDER ------------------

  return (
    <div className="admin-wrap admin-debug-test">
      {/* TOPBAR */}
      <div className="admin-topbar">
        <div className="admin-topbar-left">
          <select
            value={site}
            onChange={(e) =>
              setSite(e.target.value as AdminSiteKey)
            }
            className="admin-select admin-select--site"
          >
            {ADMIN_SITES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>

          <button
            className="admin-btn admin-btn-ghost"
            onClick={() =>
              navigate(`/admin/submissions?site=${site}`)
            }
          >
            Back
          </button>
        </div>

        <div className="admin-topbar-right">
          <button
            className="admin-btn admin-btn-ghost"
            onClick={() => navigate("/admin/users")}
          >
            Users
          </button>
          <button
            className="admin-btn"
            onClick={() => navigate(`/admin/cms?site=${site}`)}
          >
            CMS
          </button>
        </div>
      </div>

      {/* GLAVNI PANEL */}
      <div className="admin-panel">
        {error ? (
          <div className="admin-error">
            <strong>Error:</strong> {error}
          </div>
        ) : null}

        {loading && !data ? (
          <div className="admin-muted">Loading…</div>
        ) : null}

        {data ? (
          <>
            {/* Header detalja */}
            <div className="admin-details-head">
              <div className="admin-details-title">
                <div className="admin-title">
                  {data.name || "Unknown"}
                </div>
                <div className="admin-muted">{data.email}</div>
              </div>

              <div className="admin-details-meta">
                <span className="admin-pill">
                  {SUBMISSION_TYPES[data.type] ??
                    `Type ${data.type}`}
                </span>
                <span className="admin-pill">
                  {STATUSES[data.status] ??
                    `Status ${data.status}`}
                </span>
                <span className="admin-pill">{data.domain}</span>
                <span className="admin-pill">
                  {formatDate(data.createdAt)}
                </span>
                <span className="admin-pill">
                  Uploaded by {data.uploadedBy ?? "-"}
                </span>
              </div>
            </div>

            {/* GRID */}
            <div className="admin-details-grid">
              {/* Message */}
              <div className="admin-box">
                <div className="admin-box-title">Message</div>
                <div className="admin-box-body">
                  {data.message || "-"}
                </div>
              </div>

              {/* Fields */}
              <div className="admin-box">
                <div className="admin-box-title">Fields</div>
                <div className="admin-kv">
                  {(data.fields ?? []).map((f, idx) => (
                    <div
                      key={`${f.name}-${idx}`}
                      className="admin-kv-row"
                    >
                      <div className="admin-kv-k">{f.name}</div>
                      <div className="admin-kv-v">{f.value}</div>
                    </div>
                  ))}
                  {!data.fields ||
                  data.fields.length === 0 ? (
                    <div className="admin-muted">
                      No extra fields
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Attachments */}
              <div className="admin-box">
                <div className="admin-box-title">Attachments</div>
                <div className="admin-files">
                  {(data.files ?? []).map((f) => (
                    <div
                      key={f.id}
                      className="admin-file-row"
                    >
                      <div className="admin-file-info">
                        <div className="admin-file-name">
                          {f.fileName}
                        </div>
                        <div className="admin-muted">
                          {f.contentType} {bytes(f.size)}
                        </div>
                      </div>
                      <div className="admin-file-actions">
                        <button
                          className="admin-btn admin-btn-ghost"
                          onClick={() =>
                            previewFile(
                              f.id,
                              f.fileName,
                              f.contentType
                            )
                          }
                        >
                          Preview
                        </button>
                        <button
                          className="admin-btn"
                          onClick={() =>
                            downloadFile(f.id, f.fileName)
                          }
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                  {!data.files ||
                  data.files.length === 0 ? (
                    <div className="admin-muted">No files</div>
                  ) : null}
                </div>
              </div>

              {/* Workflow */}
              <div className="admin-box">
                <div className="admin-box-title">Workflow</div>

                <div className="admin-actions">
                  <div className="admin-actions-row">
                    <div className="admin-muted">Status</div>
                    <select
                      className="admin-select"
                      value={String(data.status)}
                      onChange={(e) =>
                        setStatus(Number(e.target.value))
                      }
                      disabled={lockedByDecision && isDemo}
                    >
                      {Object.entries(STATUSES).map(
                        ([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {isDemo ? (
                    <div className="admin-actions-row">
                      <button
                        className="admin-btn"
                        onClick={acceptDemo}
                        disabled={data.status === 5}
                      >
                        Accept
                      </button>
                      <button
                        className="admin-btn admin-btn-danger"
                        onClick={rejectDemo}
                        disabled={data.status === 6}
                      >
                        Reject
                      </button>
                    </div>
                  ) : null}

                  {rejectionBody ? (
                    <div className="admin-box-sub">
                      <div className="admin-muted">
                        Auto rejection body
                      </div>
                      <div className="admin-textarea-readonly">
                        {rejectionBody}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Reply + history */}
              <div className="admin-box admin-box--wide">
                <div className="admin-box-title">Reply</div>

                <input
                  className="admin-input"
                  value={replySubject}
                  onChange={(e) =>
                    setReplySubject(e.target.value)
                  }
                  placeholder="Subject"
                />

                <input
                  className="admin-input"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="CC (optional)"
                />

                <textarea
                  className="admin-textarea"
                  value={replyBody}
                  onChange={(e) =>
                    setReplyBody(e.target.value)
                  }
                  placeholder="Write reply..."
                  rows={10}
                />

                <button
                  className="admin-btn"
                  onClick={sendReply}
                >
                  Send reply
                </button>

                <div className="admin-replies">
                  <div className="admin-box-title">
                    Reply history
                  </div>
                  {(data.replies ?? []).map((r) => (
                    <div
                      key={r.id}
                      className="admin-reply"
                    >
                      <div className="admin-reply-top">
                        <span className="admin-pill">
                          {formatDate(r.createdAtUtc)}
                        </span>
                        <span className="admin-pill">
                          {r.toEmail}
                        </span>
                        <span className="admin-pill">
                          {r.subject}
                        </span>
                      </div>
                      <div className="admin-reply-body">
                        {r.body}
                      </div>
                    </div>
                  ))}
                  {!data.replies ||
                  data.replies.length === 0 ? (
                    <div className="admin-muted">
                      No replies yet
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* PREVIEW MODAL */}
            {previewUrl ? (
              <div
                className="admin-modal-overlay admin-modal-overlay--file"
                onMouseDown={(e) =>
                  e.target === e.currentTarget
                    ? closePreview()
                    : null
                }
              >
                <div
                  className="admin-modal admin-modal-card"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div className="admin-modal-header">
                    <div className="admin-modal-title">
                      <h2>{previewName}</h2>
                    </div>
                    <button
                      className="admin-modal-close"
                      onClick={closePreview}
                      aria-label="Close preview"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="admin-modal-body admin-modal-body--preview">
                    {previewKind === "image" ? (
                      <img
                        src={previewUrl}
                        className="admin-preview-img"
                        alt={previewName}
                      />
                    ) : previewKind === "audio" ? (
                      <audio
                        src={previewUrl}
                        controls
                        className="admin-preview-audio"
                      />
                    ) : previewKind === "pdf" ? (
                      <iframe
                        src={previewUrl}
                        className="admin-preview-pdf"
                        title={previewName}
                      />
                    ) : (
                      <div className="admin-empty admin-empty--center">
                        Preview not available, use Download.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
