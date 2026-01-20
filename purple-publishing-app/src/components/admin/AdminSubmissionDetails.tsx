import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ADMIN_SITES } from "./adminSites";
import type { AdminSiteKey } from "./adminSites";


const API_BASE = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:5284";

const SUBMISSION_TYPES: Record<number, string> = {
  1: "Demo Upload",
  2: "Publishing",
  3: "Legal",
  4: "Support",
  5: "Info",
  6: "General Contact"
};

const DEMO_TYPE = 1;

const STATUSES: Record<number, string> = {
  1: "Unread",
  2: "Read",
  3: "In progress",
  4: "Done",
  5: "Accepted",
  6: "Rejected"
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
  fields: { name: string; value: string }[];
  files: { id: string; fileName: string; contentType: string; size: number }[];
  replies: { id: string; createdAtUtc: string; toEmail: string; subject: string; body: string }[];
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

function bytes(n: number) {
  if (!Number.isFinite(n)) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminSubmissionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const token = localStorage.getItem("token") ?? "";
  const authHeaders = useMemo(() => {
    const h: Record<string, string> = {};
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const qsSite = (sp.get("site") as AdminSiteKey) ?? "purple-crunch-publishing";
  const [site, setSite] = useState<AdminSiteKey>(qsSite);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<SubmissionDetails | null>(null);

  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [cc, setCc] = useState("");

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<"image" | "audio" | "pdf" | "other">("other");
  const [previewName, setPreviewName] = useState("");

  async function load() {
    if (!id) return;
    if (!token) {
      navigate("/admin/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/submissions/${id}`, {
        headers: { ...authHeaders }
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
      if (!replySubject) setReplySubject(`Re: ${SUBMISSION_TYPES[json.type] ?? "Submission"}`);
    } catch (e: any) {
      setError(e?.message ?? "Network error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  function fieldValue(name: string) {
    const v = data?.fields?.find((f) => (f.name ?? "").toLowerCase() === name.toLowerCase());
    return v?.value ?? "";
  }

  async function setStatus(nextStatus: number) {
  if (!id) return;
  setError("");

  const res = await fetch(`${API_BASE}/api/submissions/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({ status: nextStatus })
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
      setError("Accept/Reject radi samo za Demo Upload (type=1).");
      return;
    }
    setError("");

    const res = await fetch(`${API_BASE}/api/submissions/${id}/accept`, {
      method: "PUT",
      headers: { ...authHeaders }
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
      setError("Accept/Reject radi samo za Demo Upload (type=1).");
      return;
    }
    setError("");

    const res = await fetch(`${API_BASE}/api/submissions/${id}/reject`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({
        body:
          rejectionBody ||
          `Hi ${data?.name || ""},\n\nThank you for your demo... \n\nBest,\nPurple Team\n`
      })
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

    await load(); // backend treba da vrati status = 6
  }


  async function sendReply() {
    if (!id) return;
    setError("");

    if (!replySubject.trim() || !replyBody.trim()) {
      setError("Subject and body are required");
      return;
    }

    const res = await fetch(`${API_BASE}/api/submissions/${id}/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders
      },
      body: JSON.stringify({
        subject: replySubject.trim(),
        body: replyBody,
        cc: cc.trim() || null
      })
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

  async function fetchFileBlob(fileId: string) {
    if (!id) return null;

    const res = await fetch(`${API_BASE}/api/submissions/${id}/files/${fileId}/download`, {
      headers: { ...authHeaders }
    });

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

  async function previewFile(fileId: string, fileName: string, contentType: string) {
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
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewName("");
    setPreviewKind("other");
  }

  const isDemo = data?.type === DEMO_TYPE;
  const lockedByDecision = data?.status === 5 || data?.status === 6;
  const rejectionBody = fieldValue("autoRejectionBody");

  return (
    <div className="admin-wrap">
      <div className="admin-topbar">
        <div className="admin-topbar-left">
          <select
            value={site}
            onChange={(e) => setSite(e.target.value as AdminSiteKey)}
            className="admin-select"
          >
            {ADMIN_SITES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>

          <button className="admin-btn admin-btn-ghost" onClick={() => navigate(`/admin/submissions?site=${site}`)}>
            Back
          </button>
        </div>

        <div className="admin-topbar-right">
          <button className="admin-btn admin-btn-ghost" onClick={() => navigate("/admin/users")}>
            Users
          </button>
          <button className="admin-btn" onClick={() => navigate(`/admin/cms?site=${site}`)}>
            CMS
          </button>
        </div>
      </div>

      <div className="admin-panel">
        {error ? <div className="admin-error">{error}</div> : null}
        {loading ? <div className="admin-muted">Loading...</div> : null}

        {data ? (
          <>
            <div className="admin-details-head">
              <div className="admin-details-title">
                <div className="admin-title">{data.name || "Unknown"}</div>
                <div className="admin-muted">{data.email}</div>
              </div>

              <div className="admin-details-meta">
                <span className="admin-pill">{SUBMISSION_TYPES[data.type] ?? `Type ${data.type}`}</span>
                <span className="admin-pill">{STATUSES[data.status] ?? `Status ${data.status}`}</span>
                <span className="admin-pill">{data.domain}</span>
                <span className="admin-pill">{formatDate(data.createdAt)}</span>
                <span className="admin-pill">UploadedBy {data.uploadedBy ?? "-"}</span>
              </div>
            </div>

            <div className="admin-details-grid">
              <div className="admin-box">
                <div className="admin-box-title">Message</div>
                <div className="admin-box-body">{data.message || "-"}</div>
              </div>

              <div className="admin-box">
                <div className="admin-box-title">Fields</div>
                <div className="admin-kv">
                  {(data.fields ?? []).map((f, idx) => (
                    <div key={`${f.name}-${idx}`} className="admin-kv-row">
                      <div className="admin-kv-k">{f.name}</div>
                      <div className="admin-kv-v">{f.value}</div>
                    </div>
                  ))}
                  {(!data.fields || data.fields.length === 0) ? <div className="admin-muted">No extra fields</div> : null}
                </div>
              </div>

              <div className="admin-box">
                <div className="admin-box-title">Attachments</div>
                <div className="admin-files">
                  {(data.files ?? []).map((f) => (
                    <div key={f.id} className="admin-file-row">
                      <div className="admin-file-info">
                        <div className="admin-file-name">{f.fileName}</div>
                        <div className="admin-muted">{f.contentType} {bytes(f.size)}</div>
                      </div>
                      <div className="admin-file-actions">
                        <button className="admin-btn admin-btn-ghost" onClick={() => previewFile(f.id, f.fileName, f.contentType)}>
                          Preview
                        </button>
                        <button className="admin-btn" onClick={() => downloadFile(f.id, f.fileName)}>
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!data.files || data.files.length === 0) ? <div className="admin-muted">No files</div> : null}
                </div>
              </div>

              <div className="admin-box">
                <div className="admin-box-title">Workflow</div>

                <div className="admin-actions">
                  <div className="admin-actions-row">
                    <div className="admin-muted">Status</div>
                    <select
                      className="admin-select"
                      value={String(data.status)}
                      onChange={(e) => setStatus(Number(e.target.value))}
                      disabled={lockedByDecision && isDemo}
                    >
                      {Object.entries(STATUSES).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>

                  {isDemo ? (
                    <div className="admin-actions-row">
                      <button className="admin-btn" onClick={acceptDemo} disabled={data.status === 5}>
                        Accept
                      </button>
                      <button className="admin-btn admin-btn-danger" onClick={rejectDemo} disabled={data.status === 6}>
                        Reject
                      </button>
                    </div>
                  ) : null}

                  {rejectionBody ? (
                    <div className="admin-box-sub">
                      <div className="admin-muted">Auto rejection body</div>
                      <div className="admin-textarea-readonly">{rejectionBody}</div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="admin-box">
                <div className="admin-box-title">Reply</div>

                <input
                  className="admin-input"
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
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
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Write reply..."
                  rows={10}
                />

                <button className="admin-btn" onClick={sendReply}>
                  Send reply
                </button>

                <div className="admin-replies">
                  <div className="admin-box-title">Reply history</div>
                  {(data.replies ?? []).map((r) => (
                    <div key={r.id} className="admin-reply">
                      <div className="admin-reply-top">
                        <span className="admin-pill">{formatDate(r.createdAtUtc)}</span>
                        <span className="admin-pill">{r.toEmail}</span>
                        <span className="admin-pill">{r.subject}</span>
                      </div>
                      <div className="admin-reply-body">{r.body}</div>
                    </div>
                  ))}
                  {(!data.replies || data.replies.length === 0) ? <div className="admin-muted">No replies yet</div> : null}
                </div>
              </div>
            </div>

            {previewUrl ? (
              <div className="admin-modal" onClick={closePreview}>
                <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
                  <div className="admin-modal-head">
                    <div className="admin-title">{previewName}</div>
                    <button className="admin-btn admin-btn-ghost" onClick={closePreview}>
                      Close
                    </button>
                  </div>

                  <div className="admin-modal-body">
                    {previewKind === "image" ? <img src={previewUrl} className="admin-preview-img" /> : null}
                    {previewKind === "audio" ? <audio src={previewUrl} controls className="admin-preview-audio" /> : null}
                    {previewKind === "pdf" ? <iframe src={previewUrl} className="admin-preview-pdf" /> : null}
                    {previewKind === "other" ? <div className="admin-muted">Preview not available, use Download</div> : null}
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
