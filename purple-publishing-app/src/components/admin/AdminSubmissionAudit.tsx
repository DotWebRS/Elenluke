import { useEffect, useMemo, useState } from "react";
import { useAdminSite } from "./useAdminSite";
import { API_BASE } from "../../config/apiBase";

type AuditLogListItem = {
  id: string;
  action?: string | null;
  createdAtUtc: string;
  entityId: string;
  entityType: string;
  userEmail?: string | null;
  detailsPreview?: string | null;
  detailsLength?: number;
};

type AuditLogDetailsItem = {
  id: string;
  action?: string | null;
  createdAtUtc: string;
  entityId: string;
  entityType: string;
  userEmail?: string | null;
  details?: string | null;
};

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

function parseJsonSafe(value?: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function actorLabel(item: { userEmail?: string | null }) {
  return item.userEmail || "Unknown";
}

function categoryLabel(item: { entityType: string; action?: string | null }) {
  const et = (item.entityType || "").toLowerCase();
  const action = (item.action || "").toLowerCase();

  if (et.includes("cms") || action.includes("publish") || action.includes("unpublish")) {
    return "CMS";
  }

  if (et.includes("submission") || action.includes("submission") || action.includes("demo") || action.includes("reply")) {
    return "Inbox";
  }

  if (action.includes("download") || et.includes("file")) {
    return "Download";
  }

  return "General";
}

export default function AdminSubmissionAudit() {
  useAdminSite();

  const authHeaders = useAuthHeaders();

  const [items, setItems] = useState<AuditLogListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openItem, setOpenItem] = useState<AuditLogDetailsItem | null>(null);
  const [openLoading, setOpenLoading] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);

  const fetchAudit = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchJson<AuditLogListItem[]>(
        buildUrl("/api/audit?take=200"),
        { headers: { ...authHeaders } }
      );

      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Audit load error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const openAuditItem = async (id: string) => {
    setOpenLoading(true);
    setOpenError(null);
    setOpenItem(null);

    try {
      const data = await fetchJson<AuditLogDetailsItem>(
        buildUrl(`/api/audit/${id}`),
        { headers: { ...authHeaders } }
      );

      setOpenItem(data);
    } catch (e: any) {
      setOpenError(e?.message || "Failed to load audit details");
    } finally {
      setOpenLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  return (
    <>
      {error ? (
        <div className="admin-alert admin-alert-error">
          <strong>Error:</strong> {error}
        </div>
      ) : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>When</th>
              <th>User</th>
              <th>Category</th>
              <th>Action</th>
              <th>Entity type</th>
              <th>Entity id</th>
              <th>Payload</th>
              <th className="th-actions">Details</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="admin-table-empty">
                  Loading…
                </td>
              </tr>
            ) : null}

            {!loading && items.length === 0 ? (
              <tr>
                <td colSpan={8} className="admin-table-empty">
                  No audit records found.
                </td>
              </tr>
            ) : null}

            {items.map((item) => (
              <tr key={item.id}>
                <td>{new Date(item.createdAtUtc).toLocaleString()}</td>
                <td>{actorLabel(item)}</td>
                <td>{categoryLabel(item)}</td>
                <td>{item.action || "-"}</td>
                <td>{item.entityType}</td>
                <td>{item.entityId}</td>
                <td>{typeof item.detailsLength === "number" ? `${item.detailsLength} chars` : "-"}</td>
                <td>
                  <button
                    className="admin-btn admin-btn-secondary admin-btn--xs"
                    onClick={() => openAuditItem(item.id)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(openItem || openLoading || openError) ? (
        <div
          className="subm-modal-overlay"
          onMouseDown={(e) => (e.target === e.currentTarget ? (setOpenItem(null), setOpenError(null)) : null)}
        >
          <div className="subm-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="subm-modal-top">
              <div className="subm-modal-title">
                <div className="subm-h">Audit change</div>
                <div className="subm-sub">{openItem?.id || "Loading..."}</div>
              </div>

              <div className="subm-modal-actions">
                <button
                  className="subm-btn subm-btn-close"
                  onClick={() => {
                    setOpenItem(null);
                    setOpenError(null);
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="subm-modal-body">
              {openLoading ? (
                <div className="admin-table-empty">Loading audit details…</div>
              ) : null}

              {openError ? (
                <div className="admin-alert admin-alert-error">
                  <strong>Error:</strong> {openError}
                </div>
              ) : null}

              {openItem ? (
                <div className="subm-grid">
                  <div className="subm-col">
                    <div className="subm-card">
                      <div className="subm-card-h">Overview</div>

                      <div className="subm-kv">
                        <div className="subm-kv-row">
                          <div className="subm-k">When</div>
                          <div className="subm-v">{new Date(openItem.createdAtUtc).toLocaleString()}</div>
                        </div>
                        <div className="subm-kv-row">
                          <div className="subm-k">User</div>
                          <div className="subm-v">{actorLabel(openItem)}</div>
                        </div>
                        <div className="subm-kv-row">
                          <div className="subm-k">Category</div>
                          <div className="subm-v">{categoryLabel(openItem)}</div>
                        </div>
                        <div className="subm-kv-row">
                          <div className="subm-k">Action</div>
                          <div className="subm-v">{openItem.action || "-"}</div>
                        </div>
                        <div className="subm-kv-row">
                          <div className="subm-k">Entity type</div>
                          <div className="subm-v">{openItem.entityType}</div>
                        </div>
                        <div className="subm-kv-row">
                          <div className="subm-k">Entity id</div>
                          <div className="subm-v">{openItem.entityId}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="subm-col">
                    <div className="subm-card">
                      <div className="subm-card-h">Change payload</div>
                      <pre className="subm-pre">
{JSON.stringify(parseJsonSafe(openItem.details), null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}