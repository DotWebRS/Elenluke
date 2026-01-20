import { useEffect, useMemo, useRef, useState } from "react";
import { AdminShell } from "./AdminShell";
import { useAdminSite } from "./useAdminSite";
import type { AdminSiteKey } from "./adminSites";

const API_BASE = (import.meta as any).env?.VITE_API_URL || "http://localhost:5284";

const SubmissionType = {
  DemoUpload: 1,
  PublishingInquiry: 2,
  LegalInquiry: 3,
  SupportRequest: 4,
  InfoRequest: 5,
  GeneralContactInquiry: 6
} as const;

type SubmissionType = (typeof SubmissionType)[keyof typeof SubmissionType];

const SubmissionStatus = {
  Unread: 1,
  Read: 2,
  InProgress: 3,
  Done: 4,
  Accepted: 5,
  Rejected: 6
} as const;

type SubmissionStatus = (typeof SubmissionStatus)[keyof typeof SubmissionStatus];

const SUBMISSION_TYPE_VALUES = Object.values(SubmissionType) as SubmissionType[];
const SUBMISSION_STATUS_CORE: SubmissionStatus[] = [
  SubmissionStatus.Unread,
  SubmissionStatus.Read,
  SubmissionStatus.InProgress,
  SubmissionStatus.Done
];

type SubmissionListItem = {
  id: string;
  type: SubmissionType;
  status: SubmissionStatus;
  domain: string;
  name: string;
  email: string;
  message: string | null;
  uploadedBy: string | null;
  createdAt: string;
  repliesCount: number;
  fields: Array<{ name: string; value: string }>;
  files: Array<{ id: string; fileName: string; contentType: string; size: number }>;
};

type SubmissionDetail = {
  id: string;
  type: SubmissionType;
  status: SubmissionStatus;
  domain: string;
  name: string;
  email: string;
  message: string | null;
  uploadedBy: string | null;
  createdAt: string;
  fields: Array<{ name: string; value: string }>;
  files: Array<{ id: string; fileName: string; contentType: string; size: number }>;
  replies: Array<{ id: string; toEmail: string; subject: string; body: string; sentAt: string }>;
};

function typeLabel(t: SubmissionType) {
  switch (t) {
    case SubmissionType.GeneralContactInquiry:
      return "General";
    case SubmissionType.PublishingInquiry:
      return "Publishing";
    case SubmissionType.LegalInquiry:
      return "Legal";
    case SubmissionType.SupportRequest:
      return "Support";
    case SubmissionType.InfoRequest:
      return "Info";
    case SubmissionType.DemoUpload:
      return "Demo";
    default:
      return String(t);
  }
}

function statusLabel(s: SubmissionStatus) {
  switch (s) {
    case SubmissionStatus.Unread:
      return "Unread";
    case SubmissionStatus.Read:
      return "Read";
    case SubmissionStatus.InProgress:
      return "In progress";
    case SubmissionStatus.Done:
      return "Done";
    case SubmissionStatus.Accepted:
      return "Accepted";
    case SubmissionStatus.Rejected:
      return "Rejected";
    default:
      return String(s);
  }
}

function statusBadgeClass(s: SubmissionStatus) {
  switch (s) {
    case SubmissionStatus.Unread:
      return "unread";
    case SubmissionStatus.Read:
      return "read";
    case SubmissionStatus.InProgress:
      return "inprogress";
    case SubmissionStatus.Done:
      return "done";
    case SubmissionStatus.Accepted:
      return "accepted";
    case SubmissionStatus.Rejected:
      return "rejected";
    default:
      return "read";
  }
}

function bytes(n: number) {
  if (!Number.isFinite(n)) return "";
  const units = ["B", "KB", "MB", "GB"];
  let x = n;
  let i = 0;
  while (x >= 1024 && i < units.length - 1) {
    x /= 1024;
    i++;
  }
  return `${x.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function csvEscape(v: string) {
  const s = v ?? "";
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function getFieldValue(fields: Array<{ name: string; value: string }> | null | undefined, candidates: string[]) {
  const arr = Array.isArray(fields) ? fields : [];
  const norm = (x: string) => (x || "").trim().toLowerCase();

  for (const c of candidates) {
    const hit = arr.find((f) => norm(f.name) === norm(c));
    if (hit?.value) return hit.value;
  }

  for (const c of candidates) {
    const cn = norm(c);
    const hit = arr.find((f) => norm(f.name).includes(cn));
    if (hit?.value) return hit.value;
  }

  return "";
}

// Rejection template samo za DemoUpload (type=1)
function buildDemoRejectionTemplate(detail: SubmissionDetail) {
  const name = detail.name || "";
  const trackTitle = getFieldValue(detail.fields, ["Track Title", "Song Title", "Title", "Track", "trackTitle"]);
  const trackPart = trackTitle ? ` ${trackTitle}` : " your track";

  return (
    `Hi ${name},\n\n` +
    `Thank you for sending${trackPart}. After careful consideration, we have decided not to move forward with a release for this track.\n\n` +
    `Due to the volume of submissions we receive, we can’t always provide detailed feedback, but we truly appreciate you sharing your work with us. Please don’t hesitate to send future demos. We are always keen to hear what you are working on next.\n\n` +
    `Wishing you the best,\n\n` +
    `Your Purple Crunch Records Team\n`
  );
}

export default function AdminSubmissions() {
  const token = localStorage.getItem("token");
  const { site } = useAdminSite();

  // Default: false =>  SVE prijave sa svih sajtova.
  const [filterBySite, setFilterBySite] = useState(false);


  useEffect(() => {
    if (site) {
      setFilterBySite(true);
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site]);

  const authHeaders = useMemo<Record<string, string>>(
    () => (token ? ({ Authorization: `Bearer ${token}` } as Record<string, string>) : ({} as Record<string, string>)),
    [token]
  );

  const [loading, setLoading] = useState(false);
  const [busyRow, setBusyRow] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [search, setSearch] = useState("");
  const [type, setType] = useState<SubmissionType | "all">("all");
  const [status, setStatus] = useState<SubmissionStatus | "all">("all");
  const [hasFile, setHasFile] = useState<"all" | "yes" | "no">("all");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [data, setData] = useState<{ total: number; items: SubmissionListItem[] }>({ total: 0, items: [] });

  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);

  const [rejectionBody, setRejectionBody] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");

  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const previewUrlsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);

  useEffect(() => {
    return () => {
      for (const k of Object.keys(previewUrlsRef.current)) {
        try {
          URL.revokeObjectURL(previewUrlsRef.current[k]);
        } catch {
          null;
        }
      }
    };
  }, []);

  const visibleItems = useMemo(() => data.items ?? [], [data.items]);

  const buildQuery = () => {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("pageSize", String(pageSize));

    // ✅ domain se šalje SAMO ako je filterBySite uključen
    if (filterBySite && site) qs.set("domain", site);

    if (search.trim()) qs.set("search", search.trim());
    if (type !== "all") qs.set("type", String(type));
    if (status !== "all") qs.set("status", String(status));
    if (hasFile !== "all") qs.set("hasFile", hasFile === "yes" ? "true" : "false");
    if (fromDate) qs.set("from", `${fromDate}T00:00:00`);
    if (toDate) qs.set("to", `${toDate}T23:59:59`);
    return qs.toString();
  };

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/submissions?${buildQuery()}`, {
        headers: { ...authHeaders }
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(`List error: ${res.status}${t ? ` — ${t}` : ""}`);
        setData({ total: 0, items: [] });
        return;
      }
      const json = await res.json().catch(() => null as any);
      setData({
        total: Number(json?.total ?? 0),
        items: Array.isArray(json?.items) ? json.items : []
      });
    } catch (e: any) {
      setError(e?.message || "List error");
      setData({ total: 0, items: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, type, status, hasFile, fromDate, toDate, filterBySite, site]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchList();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterBySite, site]);

  const patchStatusLocal = (id: string, next: SubmissionStatus) => {
    setData((prev) => ({
      total: prev.total,
      items: (prev.items ?? []).map((x) => (x.id === id ? { ...x, status: next } : x))
    }));
    setDetail((d) => (d && d.id === id ? { ...d, status: next } : d));
  };

  const updateStatusInternal = async (id: string, next: SubmissionStatus, silent?: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/api/submissions/${id}/status`, {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ status: next })
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        if (!silent) setError(`Status error: ${res.status}${t ? ` — ${t}` : ""}`);
        return false;
      }
      patchStatusLocal(id, next);
      return true;
    } catch (e: any) {
      if (!silent) setError(e?.message || "Status error");
      return false;
    }
  };

  const openSubmission = async (id: string) => {
    setOpenId(id);
    setDetail(null);
    setRejectionBody("");
    setReplyTo("");
    setReplySubject("");
    setReplyBody("");

    for (const k of Object.keys(previewUrlsRef.current)) {
      try {
        URL.revokeObjectURL(previewUrlsRef.current[k]);
      } catch {
        null;
      }
    }
    setPreviewUrls({});

    try {
      const res = await fetch(`${API_BASE}/api/submissions/${id}`, { headers: { ...authHeaders } });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(`Detail error: ${res.status}${t ? ` — ${t}` : ""}`);
        return;
      }
      const json: SubmissionDetail = await res.json();
      setDetail(json);

      if (json.status === SubmissionStatus.Unread) {
        await updateStatusInternal(id, SubmissionStatus.Read, true);
      }

      if (json.type === SubmissionType.DemoUpload) {
        setRejectionBody(buildDemoRejectionTemplate(json));
      }

      setReplyTo(json.email || "");
      setReplySubject(`Re: ${typeLabel(json.type)} submission`);
    } catch (e: any) {
      setError(e?.message || "Detail error");
    }
  };

  const closeModal = () => {
    setOpenId(null);
    setDetail(null);
    for (const k of Object.keys(previewUrlsRef.current)) {
      try {
        URL.revokeObjectURL(previewUrlsRef.current[k]);
      } catch {
        null;
      }
    }
    setPreviewUrls({});
  };

  const updateStatus = async (next: SubmissionStatus) => {
    if (!detail) return;
    await updateStatusInternal(detail.id, next);
  };

  const acceptDemo = async () => {
    if (!detail) return;
    if (detail.type !== SubmissionType.DemoUpload) return;

    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/submissions/${detail.id}/accept`, {
        method: "PUT",
        headers: { ...authHeaders }
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(`Accept error: ${res.status}${t ? ` — ${t}` : ""}`);
        return;
      }

      patchStatusLocal(detail.id, SubmissionStatus.Accepted);
      await openSubmission(detail.id);
    } catch (e: any) {
      setError(e?.message || "Accept error");
    }
  };

  const rejectDemo = async () => {
    if (!detail) return;
    if (detail.type !== SubmissionType.DemoUpload) return;

    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/submissions/${detail.id}/reject`, {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ body: rejectionBody })
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(`Reject error: ${res.status}${t ? ` — ${t}` : ""}`);
        return;
      }

      patchStatusLocal(detail.id, SubmissionStatus.Rejected);
      await openSubmission(detail.id);
    } catch (e: any) {
      setError(e?.message || "Reject error");
    }
  };

  const sendReply = async () => {
    if (!detail) return;
    try {
      const res = await fetch(`${API_BASE}/api/submissions/${detail.id}/reply`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ toEmail: replyTo, subject: replySubject, body: replyBody })
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(`Reply error: ${res.status}${t ? ` — ${t}` : ""}`);
        return;
      }
      setReplyBody("");
      await openSubmission(detail.id);
    } catch (e: any) {
      setError(e?.message || "Reply error");
    }
  };

  const deleteSubmissionById = async (id: string) => {
    const ok = window.confirm("Delete this submission?");
    if (!ok) return;

    setError(null);
    setBusyRow(id);
    try {
      const res = await fetch(`${API_BASE}/api/submissions/${id}`, {
        method: "DELETE",
        headers: { ...authHeaders }
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(`Delete error: ${res.status}${t ? ` — ${t}` : ""}`);
        return;
      }
      setData((prev) => ({
        total: Math.max(0, (prev.total ?? 0) - 1),
        items: (prev.items ?? []).filter((x) => x.id !== id)
      }));
      if (openId === id) closeModal();
    } catch (e: any) {
      setError(e?.message || "Delete error");
    } finally {
      setBusyRow(null);
    }
  };

  const fetchBlob = async (submissionId: string, fileId: string) => {
    const res = await fetch(`${API_BASE}/api/submissions/${submissionId}/files/${fileId}/download`, {
      headers: { ...authHeaders }
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`File error: ${res.status}${t ? ` — ${t}` : ""}`);
    }
    return await res.blob();
  };

  const previewFile = async (file: { id: string; fileName: string; contentType: string }) => {
    if (!detail) return;
    if (previewUrls[file.id]) return;

    try {
      const blob = await fetchBlob(detail.id, file.id);
      const url = URL.createObjectURL(blob);
      setPreviewUrls((p) => ({ ...p, [file.id]: url }));
    } catch (e: any) {
      setError(e?.message || "Preview error");
    }
  };

  const downloadFile = async (file: { id: string; fileName: string; contentType: string }) => {
    if (!detail) return;
    try {
      const blob = await fetchBlob(detail.id, file.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.fileName || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          null;
        }
      }, 5000);
    } catch (e: any) {
      setError(e?.message || "Download error");
    }
  };

  const exportCsv = () => {
    const rows = (visibleItems ?? []).map((x) => ({
      createdAt: x.createdAt,
      domain: x.domain,
      type: typeLabel(x.type),
      status: statusLabel(x.status),
      name: x.name,
      email: x.email,
      uploadedBy: x.uploadedBy || "",
      message: x.message || "",
      files: (x.files || []).map((f) => f.fileName).join(" | "),
      fields: (x.fields || []).map((f) => `${f.name}:${f.value}`).join(" | ")
    }));

    const header = Object.keys(rows[0] || { createdAt: "" }).join(",");
    const body = rows
      .map((r) =>
        [r.createdAt, r.domain, r.type, r.status, r.name, r.email, r.uploadedBy, r.message, r.files, r.fields]
          .map(csvEscape)
          .join(",")
      )
      .join("\n");

    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    const csvScope = filterBySite && site ? (site as AdminSiteKey) : ("all" as any);
    a.download = `submissions_${csvScope}_${new Date().toISOString().slice(0, 10)}.csv`;

    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const canPrev = page > 1;
  const canNext = page * pageSize < (data.total ?? 0);

  return (
    <AdminShell title="Admin Inbox">
      <div className="admin-main">
        <div className="admin-toolbar">
          <input
            className="admin-input"
            placeholder="Search name, email, message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="admin-select"
            value={type === "all" ? "all" : String(type)}
            onChange={(e) => setType(e.target.value === "all" ? "all" : (Number(e.target.value) as SubmissionType))}
          >
            <option value="all">All types</option>
            {SUBMISSION_TYPE_VALUES.map((v) => (
              <option key={String(v)} value={String(v)}>
                {typeLabel(v)}
              </option>
            ))}
          </select>

          <select
            className="admin-select"
            value={status === "all" ? "all" : String(status)}
            onChange={(e) => setStatus(e.target.value === "all" ? "all" : (Number(e.target.value) as SubmissionStatus))}
          >
            <option value="all">All statuses</option>
            {[
              SubmissionStatus.Unread,
              SubmissionStatus.Read,
              SubmissionStatus.InProgress,
              SubmissionStatus.Done,
              SubmissionStatus.Accepted,
              SubmissionStatus.Rejected
            ].map((v) => (
              <option key={String(v)} value={String(v)}>
                {statusLabel(v)}
              </option>
            ))}
          </select>

          <select className="admin-select" value={hasFile} onChange={(e) => setHasFile(e.target.value as any)}>
            <option value="all">Has file: All</option>
            <option value="yes">Has file: Yes</option>
            <option value="no">Has file: No</option>
          </select>

          <input className="admin-input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <input className="admin-input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />

          {/* ✅ Toggle filter po sajtu (radi samo kad je site poznat) */}
          {site ? (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "0 10px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.12)",
                height: 40,
                color: "rgba(255,255,255,0.82)"
              }}
            >
              <input
                type="checkbox"
                checked={filterBySite}
                onChange={(e) => {
                  setPage(1);
                  setFilterBySite(e.target.checked);
                }}
              />
              Only this site
            </label>
          ) : null}

          <button className="admin-btn admin-btn-primary" onClick={exportCsv}>
            Export CSV
          </button>
        </div>

        {error ? (
          <div style={{ padding: 14, color: "rgba(255,255,255,0.85)" }}>
            <span style={{ color: "#ff4d6d", fontWeight: 900 }}>Error:</span> {error}
          </div>
        ) : null}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Created</th>
                <th>Type</th>
                <th>Status</th>
                <th>Name</th>
                <th>Email</th>
                <th>Files</th>
                <th>UploadedBy</th>
                <th>Message</th>
                <th style={{ width: 110 }}>Delete</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: 18, color: "rgba(255,255,255,0.7)" }}>
                    Loading...
                  </td>
                </tr>
              ) : null}

              {!loading && (visibleItems ?? []).length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 18, color: "rgba(255,255,255,0.7)" }}>
                    {filterBySite && site ? "There are no applications for the selected site." : "There are no applications."}
                  </td>
                </tr>
              ) : null}

              {(visibleItems ?? []).map((s) => (
                <tr key={s.id} className="admin-row" onClick={() => openSubmission(s.id)}>
                  <td>{new Date(s.createdAt).toLocaleString()}</td>
                  <td>{typeLabel(s.type)}</td>
                  <td>
                    <span className={`admin-badge ${statusBadgeClass(s.status)}`}>{statusLabel(s.status)}</span>
                  </td>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td>{(s.files || []).length}</td>
                  <td>{s.uploadedBy || ""}</td>
                  <td style={{ maxWidth: 360, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {s.message || ""}
                  </td>
                  <td>
                    <button
                      className="admin-btn admin-btn-danger"
                      disabled={busyRow === s.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSubmissionById(s.id);
                      }}
                    >
                      <i className="fa fa-trash" aria-hidden="true"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-pagination">
          <div className="meta">
            Total (server): {data.total ?? 0} | Page: {page}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="admin-btn" disabled={!canPrev} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Prev
            </button>
            <button className="admin-btn" disabled={!canNext} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
            <button className="admin-btn admin-btn-primary" onClick={fetchList}>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {openId ? (
        <div className="admin-modal-overlay" onMouseDown={(e) => (e.target === e.currentTarget ? closeModal() : null)}>
          <div className="admin-modal">
            <div className="admin-modal-header">
              <div className="admin-modal-title">
                <h2>Submission</h2>
                <p className="sub">{openId}</p>
              </div>
              <button className="admin-modal-close" onClick={closeModal} aria-label="Close">
                ✕
              </button>
            </div>

            {!detail ? (
              <div style={{ padding: 16, color: "rgba(255,255,255,0.75)" }}>Loading details...</div>
            ) : (
              <div className="admin-modal-body">
                {/* LEFT */}
                <div style={{ display: "grid", gap: 14 }}>
                  <div className="admin-card">
                    <div className="admin-card-header">
                      <h3>Overview</h3>

                      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <span className={`admin-badge ${statusBadgeClass(detail.status)}`}>{statusLabel(detail.status)}</span>

                        {/* CORE status only (dropdown) */}
                        <select
                          className="admin-select"
                          style={{ width: 190 }}
                          value={String(SUBMISSION_STATUS_CORE.includes(detail.status) ? detail.status : SubmissionStatus.Read)}
                          onChange={(e) => updateStatus(Number(e.target.value) as SubmissionStatus)}
                        >
                          {SUBMISSION_STATUS_CORE.map((v) => (
                            <option key={String(v)} value={String(v)}>
                              {statusLabel(v)}
                            </option>
                          ))}
                        </select>

                        <button className="admin-btn admin-btn-danger" onClick={() => deleteSubmissionById(detail.id)}>
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="admin-card-body">
                      <div className="kv">
                        <div className="k">Site</div>
                        <div className="v">{detail.domain}</div>
                      </div>
                      <div className="kv">
                        <div className="k">Type</div>
                        <div className="v">{typeLabel(detail.type)}</div>
                      </div>
                      <div className="kv">
                        <div className="k">Created</div>
                        <div className="v">{new Date(detail.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="kv">
                        <div className="k">Name</div>
                        <div className="v">{detail.name}</div>
                      </div>
                      <div className="kv">
                        <div className="k">Email</div>
                        <div className="v">{detail.email}</div>
                      </div>
                      <div className="kv">
                        <div className="k">UploadedBy</div>
                        <div className="v">{detail.uploadedBy || ""}</div>
                      </div>
                      <div className="kv">
                        <div className="k">Message</div>
                        <div className="v" style={{ whiteSpace: "pre-wrap" }}>
                          {detail.message || ""}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="admin-card">
                    <div className="admin-card-header">
                      <h3>Fields</h3>
                    </div>
                    <div className="admin-card-body" style={{ display: "grid", gap: 8 }}>
                      {(detail.fields || []).length === 0 ? (
                        <div style={{ color: "rgba(255,255,255,0.65)" }}>No extra fields.</div>
                      ) : (
                        (detail.fields || []).map((f, idx) => (
                          <div key={`${f.name}-${idx}`} className="thread-item" style={{ marginBottom: 0 }}>
                            <div className="tmeta">
                              <div style={{ fontWeight: 900, color: "rgba(255,255,255,0.9)" }}>{f.name}</div>
                              <div style={{ color: "rgba(255,255,255,0.55)" }}>Field</div>
                            </div>
                            <div className="tbody">{f.value}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="admin-card">
                    <div className="admin-card-header">
                      <h3>Replies history</h3>
                    </div>
                    <div className="admin-card-body">
                      {(detail.replies || []).length === 0 ? (
                        <div style={{ color: "rgba(255,255,255,0.65)" }}>No replies yet.</div>
                      ) : (
                        (detail.replies || []).map((r) => (
                          <div key={r.id} className="thread-item">
                            <div className="tmeta">
                              <div>To: {r.toEmail}</div>
                              <div>{new Date(r.sentAt).toLocaleString()}</div>
                            </div>
                            <div style={{ fontWeight: 900, marginBottom: 6 }}>{r.subject}</div>
                            <div className="tbody">{r.body}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT */}
                <div style={{ display: "grid", gap: 14 }}>
                  <div className="admin-card">
                    <div className="admin-card-header">
                      <h3>Files</h3>
                    </div>

                    <div className="admin-card-body" style={{ display: "grid", gap: 10 }}>
                      {(detail.files || []).length === 0 ? (
                        <div style={{ color: "rgba(255,255,255,0.65)" }}>No files.</div>
                      ) : (
                        detail.files.map((f) => {
                          const url = previewUrls[f.id];
                          const isImage = (f.contentType || "").startsWith("image/");
                          const isAudio = (f.contentType || "").startsWith("audio/");
                          const isPdf = (f.contentType || "").includes("pdf");

                          return (
                            <div key={f.id}>
                              <div className="file-row">
                                <div className="file-meta">
                                  <div className="file-name">{f.fileName}</div>
                                  <div className="file-sub">
                                    {f.contentType} • {bytes(f.size)}
                                  </div>
                                </div>

                                <div style={{ display: "flex", gap: 10 }}>
                                  <button className="admin-btn" onClick={() => previewFile(f)}>
                                    Preview
                                  </button>
                                  <button className="admin-btn admin-btn-primary" onClick={() => downloadFile(f)}>
                                    Download
                                  </button>
                                </div>
                              </div>

                              {url ? (
                                <div className="preview-box">
                                  {isImage ? <img src={url} alt={f.fileName} /> : null}
                                  {isAudio ? <audio controls src={url} style={{ width: "100%" }} /> : null}
                                  {isPdf ? <iframe src={url} title={f.fileName} /> : null}
                                  {!isImage && !isAudio && !isPdf ? (
                                    <div style={{ color: "rgba(255,255,255,0.7)" }}>Preview not supported. Use Download.</div>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Accept/Reject SAMO za DemoUpload (type=1) */}
                  {detail.type === SubmissionType.DemoUpload ? (
                    <div className="admin-card">
                      <div className="admin-card-header">
                        <h3>Demo decision</h3>
                        <div style={{ display: "flex", gap: 10 }}>
                          <button
                            className="admin-btn admin-btn-primary"
                            onClick={acceptDemo}
                            disabled={detail.status === SubmissionStatus.Accepted}
                          >
                            Accept
                          </button>
                          <button
                            className="admin-btn admin-btn-danger"
                            onClick={rejectDemo}
                            disabled={detail.status === SubmissionStatus.Rejected}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                      <div className="admin-card-body">
                        <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 13, marginBottom: 10 }}>
                          Rejection email body (editable)
                        </div>
                        <textarea className="admin-textarea" value={rejectionBody} onChange={(e) => setRejectionBody(e.target.value)} />
                      </div>
                    </div>
                  ) : null}

                  <div className="admin-card">
                    <div className="admin-card-header">
                      <h3>Reply</h3>
                    </div>
                    <div className="admin-card-body">
                      <div className="admin-split" style={{ marginBottom: 10 }}>
                        <input className="admin-input" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="To email" />
                        <input
                          className="admin-input"
                          value={replySubject}
                          onChange={(e) => setReplySubject(e.target.value)}
                          placeholder="Subject"
                        />
                      </div>
                      <textarea
                        className="admin-textarea"
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        placeholder="Write a reply..."
                      />
                      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                        <button className="admin-btn admin-btn-primary" onClick={sendReply} disabled={!replyTo || !replySubject || !replyBody}>
                          Send reply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
