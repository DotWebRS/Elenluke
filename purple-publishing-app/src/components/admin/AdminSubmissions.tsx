import { useEffect, useMemo, useRef, useState } from "react";
import { AdminShell } from "./AdminShell";
import { useAdminSite } from "./useAdminSite";
import { API_BASE } from "../../config/apiBase";
import "../../styles/AdminSubmissionsModal.css";
import * as XLSX from "xlsx";
// -------------------- ENUM-LIKE KONSTANTE --------------------

const SubmissionTypeId = {
  DemoUpload: 1,
  ArtistInformation: 2,
  SongwriterInformation: 3,
  SyncRequest: 4,
  GeneralContactInquiry: 5,
  SupportForm: 6,
  LegalRequest: 7,
} as const;

const SubmissionStatusId = {
  Unread: 1,
  Read: 2,
  InProgress: 3,
  Done: 4,
  Accepted: 5,
  Rejected: 6,
} as const;

type SubmissionTypeId = (typeof SubmissionTypeId)[keyof typeof SubmissionTypeId];
type SubmissionStatusId = (typeof SubmissionStatusId)[keyof typeof SubmissionStatusId];

const SUBMISSION_TYPE_VALUES: SubmissionTypeId[] = [
  SubmissionTypeId.DemoUpload,
  SubmissionTypeId.ArtistInformation,
  SubmissionTypeId.SongwriterInformation,
  SubmissionTypeId.SyncRequest,
  SubmissionTypeId.GeneralContactInquiry,
  SubmissionTypeId.SupportForm,
  SubmissionTypeId.LegalRequest,
];

const STATUS_FILTER_VALUES: SubmissionStatusId[] = [
  SubmissionStatusId.Unread,
  SubmissionStatusId.Read,
  SubmissionStatusId.InProgress,
  SubmissionStatusId.Done,
  SubmissionStatusId.Accepted,
  SubmissionStatusId.Rejected,
];

// -------------------- TIPOVI PODATAKA --------------------

type SubmissionFile = {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
};

type SubmissionField = {
  name: string;
  value: string;
};

type SubmissionListItem = {
  id: string;
  type: SubmissionTypeId;
  status: SubmissionStatusId;
  domain: string;
  name: string;
  email: string;
  message: string | null;
  uploadedBy: string | null;
  createdAt: string;
  repliesCount: number;
  fields: SubmissionField[];
  files: SubmissionFile[];
};

type SubmissionReply = {
  id: string;
  toEmail: string;
  subject: string;
  body: string;
  sentAt: string;
};

type SubmissionDetail = {
  id: string;
  type: SubmissionTypeId;
  status: SubmissionStatusId;
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

type ListResponse = {
  total: number;
  items: SubmissionListItem[];
};

type FilterHasFile = "all" | "yes" | "no";

// -------------------- POMOĆNE FUNKCIJE --------------------

function typeLabel(t: SubmissionTypeId) {
  switch (t) {
    case SubmissionTypeId.DemoUpload:
      return "Demo";
    case SubmissionTypeId.ArtistInformation:
      return "Artist info";
    case SubmissionTypeId.SongwriterInformation:
      return "Songwriter info";
    case SubmissionTypeId.SyncRequest:
      return "Sync request";
    case SubmissionTypeId.GeneralContactInquiry:
      return "General contact";
    case SubmissionTypeId.SupportForm:
      return "Support";
    case SubmissionTypeId.LegalRequest:
      return "Legal";
    default:
      return String(t);
  }
}

function statusLabel(s: SubmissionStatusId) {
  switch (s) {
    case SubmissionStatusId.Unread:
      return "Unread";
    case SubmissionStatusId.Read:
      return "Read";
    case SubmissionStatusId.InProgress:
      return "In progress";
    case SubmissionStatusId.Done:
      return "Done";
    case SubmissionStatusId.Accepted:
      return "Accepted";
    case SubmissionStatusId.Rejected:
      return "Rejected";
    default:
      return String(s);
  }
}

function statusBadgeClass(s: SubmissionStatusId) {
  switch (s) {
    case SubmissionStatusId.Unread:
      return "badge-unread";
    case SubmissionStatusId.Read:
      return "badge-read";
    case SubmissionStatusId.InProgress:
      return "badge-inprogress";
    case SubmissionStatusId.Done:
      return "badge-done";
    case SubmissionStatusId.Accepted:
      return "badge-accepted";
    case SubmissionStatusId.Rejected:
      return "badge-rejected";
    default:
      return "";
  }
}

function buildUrl(path: string) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return base ? `${base}/${p}` : `/${p}`;
}

function useAuthHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
  return useMemo(() => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` } as Record<string, string>;
  }, [token]);
}

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `Request failed with status ${res.status}`);
  }
  return (await res.json().catch(() => null)) as T;
}

async function fetchBlob(input: RequestInfo, init?: RequestInit): Promise<Blob> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `Request failed with status ${res.status}`);
  }
  return await res.blob();
}

function getFieldValue(fields: SubmissionField[] | null | undefined, candidates: string[]) {
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

function buildDemoRejectionTemplate(detail: SubmissionDetail) {
  const name = detail.name || "";
  const trackTitle = getFieldValue(detail.fields, ["Track Title", "Song Title", "Title", "Track", "trackTitle"]);
  const trackPart = trackTitle ? ` ${trackTitle}` : " your track";

  return (
    `Hi ${name},\n\n` +
    `Thank you for sending${trackPart}. After careful consideration, we have decided not to move forward with a release for this track.\n\n` +
    `Due to the volume of submissions we receive, we can’t always provide detailed feedback, but we truly appreciate you sharing your work with us. Please don’t hesitate to send future demos, we are always keen to hear what you are working on next.\n\n` +
    `Wishing you the best,\n\n` +
    `Your Purple Crunch Records Team`
  );
}

function isImageContentType(contentType: string) {
  return (contentType || "").toLowerCase().startsWith("image/");
}

// --------------------------- KOMPONENTA ---------------------------

export function AdminSubmissions() {
  const authHeaders = useAuthHeaders();
  const { site } = useAdminSite();

  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [data, setData] = useState<ListResponse>({ total: 0, items: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<SubmissionTypeId | "all">("all");
  const [statusFilter, setStatusFilter] = useState<SubmissionStatusId | "all">("all");
  const [hasFile, setHasFile] = useState<FilterHasFile>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [busyRow, setBusyRow] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);

  const [rejectionBody, setRejectionBody] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");

  // INLINE PREVIEW (u okviru modala)
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const previewUrlsRef = useRef<Record<string, string>>({});
  const [activePreviewFileId, setActivePreviewFileId] = useState<string | null>(null);

  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);

  useEffect(() => {
    return () => {
      for (const k of Object.keys(previewUrlsRef.current)) {
        try {
          URL.revokeObjectURL(previewUrlsRef.current[k]);
        } catch {}
      }
    };
  }, []);

  const visibleItems = useMemo(() => data.items ?? [], [data.items]);

  const buildQuery = () => {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("pageSize", String(pageSize));
    if (site) qs.set("site", site);

    if (search.trim()) qs.set("search", search.trim());
    if (typeFilter !== "all") qs.set("type", String(typeFilter));
    if (statusFilter !== "all") qs.set("status", String(statusFilter));
    if (hasFile !== "all") qs.set("hasFile", hasFile === "yes" ? "true" : "false");
    if (fromDate) qs.set("from", `${fromDate}T00:00:00`);
    if (toDate) qs.set("to", `${toDate}T23:59:59`);
    return qs.toString();
  };

  const listAbortRef = useRef<AbortController | null>(null);

  const fetchList = async () => {
    listAbortRef.current?.abort();
    const controller = new AbortController();
    listAbortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(buildUrl(`/api/submissions?${buildQuery()}`), {
        signal: controller.signal,
        headers: { ...authHeaders },
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(`List error: ${res.status}${t ? ` — ${t}` : ""}`);
        setData({ total: 0, items: [] });
        return;
      }

      const json = await res.json().catch(() => null);
      setData({
        total: Number(json?.total ?? 0),
        items: Array.isArray(json?.items) ? json.items : [],
      });
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setError(e?.message || "List error");
      setData({ total: 0, items: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    return () => listAbortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, typeFilter, statusFilter, hasFile, fromDate, toDate, search, site]);

  const openSubmission = async (id: string) => {
    setOpenId(id);
    setDetail(null);
    setDetailLoading(true);
    setError(null);
    setActivePreviewFileId(null);

    try {
      const d = await fetchJson<SubmissionDetail>(buildUrl(`/api/submissions/${id}`), {
        headers: { ...authHeaders },
      });

      setDetail(d);

      if (d.type === SubmissionTypeId.DemoUpload) setRejectionBody(buildDemoRejectionTemplate(d));
      else setRejectionBody("");

      setReplyTo(d.email || "");
      setReplySubject("");
      setReplyBody("");
    } catch (e: any) {
      setError(e?.message || "Detail error");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setOpenId(null);
    setDetail(null);
    setRejectionBody("");
    setReplyTo("");
    setReplySubject("");
    setReplyBody("");
    setActivePreviewFileId(null);
  };

  const patchStatusLocal = (id: string, newStatus: SubmissionStatusId) => {
    setData((prev) => ({
      ...prev,
      items: (prev.items || []).map((s) => (s.id === id ? { ...s, status: newStatus } : s)),
    }));
    setDetail((prev) => (prev && prev.id === id ? { ...prev, status: newStatus } : prev));
  };

  const updateStatus = async (id: string, newStatus: SubmissionStatusId) => {
    setSavingStatus(true);
    setBusyRow(id);
    setError(null);

    try {
      await fetchJson<void>(buildUrl(`/api/submissions/${id}/status`), {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      patchStatusLocal(id, newStatus);
    } catch (e: any) {
      setError(e?.message || "Status update error");
    } finally {
      setSavingStatus(false);
      setBusyRow(null);
    }
  };

  const deleteSubmissionById = async (id: string) => {
    const ok = window.confirm("Delete this submission?");
    if (!ok) return;

    setError(null);
    setBusyRow(id);

    try {
      const res = await fetch(buildUrl(`/api/submissions/${id}`), {
        method: "DELETE",
        headers: { ...authHeaders },
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(`Delete error: ${res.status}${t ? ` — ${t}` : ""}`);
        return;
      }

      setData((prev) => ({
        ...prev,
        items: (prev.items || []).filter((s) => s.id !== id),
        total: Math.max(0, (prev.total || 0) - 1),
      }));

      if (detail && detail.id === id) closeModal();
    } catch (e: any) {
      setError(e?.message || "Delete error");
    } finally {
      setBusyRow(null);
    }
  };

  const fetchFileBlob = async (submissionId: string, fileId: string) => {
    return await fetchBlob(buildUrl(`/api/submissions/${submissionId}/files/${fileId}/download`), {
      headers: { ...authHeaders },
    });
  };

  const ensurePreviewUrl = async (file: SubmissionFile) => {
    if (!detail) return "";
    const existing = previewUrls[file.id];
    if (existing) return existing;

    const blob = await fetchFileBlob(detail.id, file.id);
    const url = URL.createObjectURL(blob);
    setPreviewUrls((p) => ({ ...p, [file.id]: url }));
    return url;
  };

  const previewInline = async (file: SubmissionFile) => {
    try {
      setError(null);
      const url = await ensurePreviewUrl(file);
      if (!url) return;
      setActivePreviewFileId(file.id);
    } catch (e: any) {
      setError(e?.message || "Preview error");
    }
  };

  const downloadFile = async (file: SubmissionFile) => {
    if (!detail) return;
    try {
      const blob = await fetchFileBlob(detail.id, file.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.fileName || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e: any) {
      setError(e?.message || "Download error");
    }
  };

const exportOneExcel = () => {
  if (!detail) return;

  const safeId = (detail.id || "submission").replace(/[^\w\-]+/g, "_");

  // 1) Overview sheet (jedan red)
  const overviewRow = {
    Id: detail.id,
    Type: typeLabel(detail.type),
    Status: statusLabel(detail.status),
    Domain: detail.domain,
    Name: detail.name,
    Email: detail.email,
    UploadedBy: detail.uploadedBy || "",
    CreatedAt: detail.createdAt,
    Message: detail.message || "",
    FilesCount: (detail.files || []).length,
    FieldsCount: (detail.fields || []).length,
    RepliesCount: (detail.replies || []).length,
  };

  const wsOverview = XLSX.utils.json_to_sheet([overviewRow]);

 
  const fieldsRows = (detail.fields || []).map((f) => ({
    SubmissionId: detail.id,
    FieldName: f.name,
    FieldValue: f.value,
  }));
  const wsFields = XLSX.utils.json_to_sheet(fieldsRows.length ? fieldsRows : [{ SubmissionId: detail.id, FieldName: "", FieldValue: "" }]);

  
  const filesRows = (detail.files || []).map((f) => ({
    SubmissionId: detail.id,
    FileId: f.id,
    FileName: f.fileName,
    ContentType: f.contentType,
    SizeBytes: f.size,
    SizeMB: Number((f.size / 1024 / 1024).toFixed(2)),
  }));
  const wsFiles = XLSX.utils.json_to_sheet(filesRows.length ? filesRows : [{ SubmissionId: detail.id, FileId: "", FileName: "", ContentType: "", SizeBytes: "", SizeMB: "" }]);

 
  const repliesRows = (detail.replies || []).map((r) => ({
    SubmissionId: detail.id,
    ReplyId: r.id,
    ToEmail: r.toEmail,
    Subject: r.subject,
    SentAt: r.sentAt,
    Body: r.body,
  }));
  const wsReplies = XLSX.utils.json_to_sheet(repliesRows.length ? repliesRows : [{ SubmissionId: detail.id, ReplyId: "", ToEmail: "", Subject: "", SentAt: "", Body: "" }]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsOverview, "Overview");
  XLSX.utils.book_append_sheet(wb, wsFields, "Fields");
  XLSX.utils.book_append_sheet(wb, wsFiles, "Files");
  XLSX.utils.book_append_sheet(wb, wsReplies, "Replies");

  // download
  XLSX.writeFile(wb, `submission_${safeId}.xlsx`);
};


  const acceptDemo = async () => {
    if (!detail) return;
    if (detail.type !== SubmissionTypeId.DemoUpload) return;

    setError(null);
    try {
      const res = await fetch(buildUrl(`/api/submissions/${detail.id}/accept`), {
        method: "PUT",
        headers: { ...authHeaders },
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(`Accept error: ${res.status}${t ? ` — ${t}` : ""}`);
        return;
      }

      patchStatusLocal(detail.id, SubmissionStatusId.Accepted);
      await openSubmission(detail.id);
    } catch (e: any) {
      setError(e?.message || "Accept error");
    }
  };

  const rejectDemo = async () => {
    if (!detail) return;
    if (detail.type !== SubmissionTypeId.DemoUpload) return;

    setError(null);
    try {
      const res = await fetch(buildUrl(`/api/submissions/${detail.id}/reject`), {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ body: rejectionBody }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(`Reject error: ${res.status}${t ? ` — ${t}` : ""}`);
        return;
      }

      patchStatusLocal(detail.id, SubmissionStatusId.Rejected);
      await openSubmission(detail.id);
    } catch (e: any) {
      setError(e?.message || "Reject error");
    }
  };

  const sendReply = async () => {
    if (!detail) return;
    const toEmail = replyTo.trim();
    if (!toEmail) {
      alert("Recipient email is required.");
      return;
    }

    setError(null);
    try {
      await fetchJson<void>(buildUrl(`/api/submissions/${detail.id}/reply`), {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail,
          subject: replySubject || "(no subject)",
          body: replyBody || "",
        }),
      });

      await openSubmission(detail.id);
    } catch (e: any) {
      setError(e?.message || "Reply error");
    }
  };

  const totalPages = Math.max(1, Math.ceil((data.total || 0) / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  // ------------------ LIST UI (NE DIRAMO) ------------------

  return (
    <AdminShell title="Admin Inbox" active="submissions">
      <div className="admin-root">
        <div className="admin-header">
          <div className="admin-header-main">
            <h1>Inbox</h1>
            <p className="sub">Unified submissions across all forms. Filter, search and manage decisions.</p>
          </div>
        </div>

        {error ? (
          <div className="admin-alert admin-alert-error">
            <strong>Error:</strong> {error}
          </div>
        ) : null}

        {/* FILTER BAR */}
        <div className="admin-filters-row">
          <div className="admin-filters-main">
            <input
              ref={searchInputRef}
              className="admin-input admin-input--search"
              placeholder="Search by name, email, domain or message…"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />

            <select
              className="admin-select"
              value={typeFilter === "all" ? "all" : String(typeFilter)}
              onChange={(e) => {
                const v = e.target.value;
                setPage(1);
                setTypeFilter(v === "all" ? "all" : (Number(v) as SubmissionTypeId));
              }}
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
              value={statusFilter === "all" ? "all" : String(statusFilter)}
              onChange={(e) => {
                const v = e.target.value;
                setPage(1);
                setStatusFilter(v === "all" ? "all" : (Number(v) as SubmissionStatusId));
              }}
            >
              <option value="all">All statuses</option>
              {STATUS_FILTER_VALUES.map((v) => (
                <option key={String(v)} value={String(v)}>
                  {statusLabel(v)}
                </option>
              ))}
            </select>

            <select
              className="admin-select"
              value={hasFile}
              onChange={(e) => {
                setPage(1);
                setHasFile(e.target.value as FilterHasFile);
              }}
            >
              <option value="all">Files: All</option>
              <option value="yes">Files: Has file</option>
              <option value="no">Files: No file</option>
            </select>

            <input
              className="admin-input admin-input--date"
              type="date"
              value={fromDate}
              onChange={(e) => {
                setPage(1);
                setFromDate(e.target.value);
              }}
            />
            <input
              className="admin-input admin-input--date"
              type="date"
              value={toDate}
              onChange={(e) => {
                setPage(1);
                setToDate(e.target.value);
              }}
            />
          </div>
        </div>

        {/* TABELA */}
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
                <th>Domain</th>
                <th>Replies</th>
                <th className="th-actions">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="admin-table-empty">
                    Loading…
                  </td>
                </tr>
              ) : null}

              {!loading && (visibleItems ?? []).length === 0 ? (
                <tr>
                  <td colSpan={9} className="admin-table-empty">
                    There are no applications.
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
                  <td>{s.domain}</td>
                  <td>{s.repliesCount}</td>
                  <td>
                    <div className="admin-table-actions" onClick={(e) => e.stopPropagation()}>
                      <select
                        className="admin-select admin-select--compact"
                        value={String(s.status)}
                        disabled={savingStatus && busyRow === s.id}
                        onChange={(e) => updateStatus(s.id, Number(e.target.value) as SubmissionStatusId)}
                      >
                        {STATUS_FILTER_VALUES.map((st) => (
                          <option key={String(st)} value={String(st)}>
                            {statusLabel(st)}
                          </option>
                        ))}
                      </select>

                      <button
                        className="admin-btn admin-btn-danger admin-btn--xs"
                        disabled={savingStatus && busyRow === s.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSubmissionById(s.id);
                        }}
                      >
                        <i className="fa fa-trash" aria-hidden="true"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* PAGINACIJA */}
          <div className="admin-footer">
            <div className="admin-footer-left">
              <span>
                Page {page} of {totalPages} — {data.total} total
              </span>
            </div>
            <div className="admin-footer-right">
              <button className="admin-btn admin-btn-secondary" disabled={!canPrev} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Prev
              </button>
              <button className="admin-btn admin-btn-secondary" disabled={!canNext} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL (BELI, ORGANIZOVAN) */}
      {openId ? (
        <div className="subm-modal-overlay" onMouseDown={(e) => (e.target === e.currentTarget ? closeModal() : null)}>
          <div className="subm-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="subm-modal-top">
              <div className="subm-modal-title">
                <div className="subm-h">Submission</div>
                <div className="subm-sub">{openId}</div>
              </div>

              <div className="subm-modal-actions">
                <button className="subm-btn subm-btn-soft" onClick={exportOneExcel} disabled={!detail || detailLoading}>
                  Export
                </button>
                <button className="subm-btn subm-btn-close" onClick={closeModal} aria-label="Close">
                  ✕
                </button>
              </div>
            </div>

            {!detail || detailLoading ? (
              <div className="subm-loading">Loading details…</div>
            ) : (
              <div className="subm-modal-body">
                <div className="subm-grid">
                  {/* LEFT COLUMN */}
                  <div className="subm-col">
                    <div className="subm-card">
                      <div className="subm-card-h">
                        <span>Overview</span>
                        <span className={`subm-pill ${statusBadgeClass(detail.status)}`}>{statusLabel(detail.status)}</span>
                      </div>

                      <div className="subm-kv">
                        <div className="subm-kv-row">
                          <div className="subm-k">Type</div>
                          <div className="subm-v">{typeLabel(detail.type)}</div>
                        </div>
                        <div className="subm-kv-row">
                          <div className="subm-k">Created</div>
                          <div className="subm-v">{new Date(detail.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="subm-kv-row">
                          <div className="subm-k">Domain</div>
                          <div className="subm-v">{detail.domain}</div>
                        </div>
                        <div className="subm-kv-row">
                          <div className="subm-k">Name</div>
                          <div className="subm-v">{detail.name}</div>
                        </div>
                        <div className="subm-kv-row">
                          <div className="subm-k">Email</div>
                          <div className="subm-v">{detail.email}</div>
                        </div>
                        <div className="subm-kv-row">
                          <div className="subm-k">Uploaded by</div>
                          <div className="subm-v">{detail.uploadedBy || "-"}</div>
                        </div>
                      </div>
                    </div>

                    <div className="subm-card">
                      <div className="subm-card-h">Message</div>
                      {detail.message ? <pre className="subm-pre">{detail.message}</pre> : <div className="subm-empty">No message provided.</div>}
                    </div>

                    <div className="subm-card">
                      <div className="subm-card-h">Fields</div>
                      {(detail.fields || []).length === 0 ? (
                        <div className="subm-empty">No extra fields.</div>
                      ) : (
                        <div className="subm-fields">
                          {(detail.fields || []).map((f, idx) => (
                            <div key={`${f.name}-${idx}`} className="subm-field-row">
                              <div className="subm-field-k">{f.name}</div>
                              <div className="subm-field-v">{f.value}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {detail.type === SubmissionTypeId.DemoUpload ? (
                      <div className="subm-card">
                        <div className="subm-card-h subm-between">
                          <span>Demo decision</span>
                          <div className="subm-inline-actions">
                            <button className="subm-btn subm-btn-ok" onClick={acceptDemo} disabled={detail.status === SubmissionStatusId.Accepted}>
                              Accept
                            </button>
                            <button className="subm-btn subm-btn-bad" onClick={rejectDemo} disabled={detail.status === SubmissionStatusId.Rejected}>
                              Reject
                            </button>
                          </div>
                        </div>
                        <div className="subm-help">Rejection email body (editable)</div>
                        <textarea className="subm-textarea" value={rejectionBody} onChange={(e) => setRejectionBody(e.target.value)} rows={10} />
                      </div>
                    ) : null}

                    <div className="subm-card">
                      <div className="subm-card-h">Replies history</div>
                      {(detail.replies || []).length === 0 ? (
                        <div className="subm-empty">No replies yet.</div>
                      ) : (
                        <div className="subm-replies">
                          {(detail.replies || []).map((r) => (
                            <div key={r.id} className="subm-reply">
                              <div className="subm-reply-top">
                                <span className="subm-chip">{new Date(r.sentAt).toLocaleString()}</span>
                                <span className="subm-chip">{r.toEmail}</span>
                                <span className="subm-chip">{r.subject}</span>
                              </div>
                              <pre className="subm-pre subm-pre--small">{r.body}</pre>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="subm-card">
                      <div className="subm-card-h">Reply</div>

                      <div className="subm-form">
                        <div className="subm-form-row">
                          <label>To</label>
                          <input className="subm-input" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="Recipient email" />
                        </div>
                        <div className="subm-form-row">
                          <label>Subject</label>
                          <input className="subm-input" value={replySubject} onChange={(e) => setReplySubject(e.target.value)} placeholder="Subject" />
                        </div>
                        <div className="subm-form-row subm-form-row--top">
                          <label>Body</label>
                          <textarea className="subm-textarea" rows={8} value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="Write your reply…" />
                        </div>
                        <div className="subm-form-row subm-form-row--end">
                          <span />
                          <button className="subm-btn subm-btn-main" onClick={sendReply}>
                            Send reply
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: FILES + PREVIEW */}
                  <div className="subm-col">
                    <div className="subm-card">
                      <div className="subm-card-h">Files</div>

                      {(detail.files || []).length === 0 ? (
                        <div className="subm-empty">No files uploaded.</div>
                      ) : (
                        <div className="subm-files-wrap">
                          <div className="subm-files-list">
                            {(detail.files || []).map((f) => (
                              <div key={f.id} className={`subm-file ${activePreviewFileId === f.id ? "is-active" : ""}`}>
                                <div className="subm-file-info">
                                  <div className="subm-file-name">{f.fileName}</div>
                                  <div className="subm-file-meta">
                                    {f.contentType || "file"} — {(f.size / 1024 / 1024).toFixed(2)} MB
                                  </div>
                                </div>

                                <div className="subm-file-actions">
                                  <button className="subm-btn subm-btn-soft" onClick={() => previewInline(f)}>
                                    Preview
                                  </button>
                                  <button className="subm-btn subm-btn-soft" onClick={() => downloadFile(f)}>
                                    Download
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="subm-preview-box">
                            {activePreviewFileId && previewUrls[activePreviewFileId] ? (
                              (() => {
                                const f = (detail.files || []).find((x) => x.id === activePreviewFileId);
                                const url = previewUrls[activePreviewFileId];
                                const ct = (f?.contentType || "").toLowerCase();

                                if (ct.startsWith("image/")) {
                                  return <img className="subm-preview-img" src={url} alt={f?.fileName || "preview"} />;
                                }
                                if (ct === "application/pdf") {
                                  return <iframe className="subm-preview-iframe" src={url} title={f?.fileName || "preview"} />;
                                }
                                if (ct.startsWith("audio/")) {
                                  return <audio className="subm-preview-audio" controls src={url} />;
                                }
                                if (ct.startsWith("video/")) {
                                  return <video className="subm-preview-video" controls src={url} />;
                                }

                                return (
                                  <div className="subm-preview-fallback">
                                    <div className="subm-file-name">No inline preview</div>
                                    <div className="subm-file-meta">{f?.contentType || "unknown"}</div>
                                  </div>
                                );
                              })()
                            ) : (
                              <div className="subm-preview-empty">Select a file to preview.</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="subm-card subm-card-note">
                      
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

export default AdminSubmissions;
