import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "./AdminShell";
import { API_BASE } from "../../config/apiBase";

type LatestBackupResponse = {
  exists: boolean;
  backupId?: string;
  path?: string;
  manifestPath?: string;
};

type CreateBackupResponse = {
  backupId: string;
  createdAtUtc: string;
  backupRootPath: string;
  databaseFile: string;
  uploadsZip: string;
  privateUploadsZip: string;
  publicAssetsZip?: string | null;
  manifestFile: string;
};

function buildUrl(path: string) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return base ? `${base}/${p}` : `/${p}`;
}

export default function AdminBackups() {
  const token = localStorage.getItem("token") || "";
  const role = localStorage.getItem("role") || "";

  const authHeaders = useMemo((): Record<string, string> => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const [latest, setLatest] = useState<LatestBackupResponse | null>(null);
  const [loadingLatest, setLoadingLatest] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [created, setCreated] = useState<CreateBackupResponse | null>(null);

  const fetchLatest = async () => {
    setLoadingLatest(true);
    setError("");

    try {
      const res = await fetch(buildUrl("/api/backups/latest"), {
        headers: { ...authHeaders },
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(`Latest backup error: ${res.status}${t ? ` — ${t}` : ""}`);
        setLatest(null);
        return;
      }

      const json = (await res.json().catch(() => null)) as LatestBackupResponse | null;
      setLatest(json);
    } catch (e: any) {
      setError(e?.message || "Latest backup error");
      setLatest(null);
    } finally {
      setLoadingLatest(false);
    }
  };

  const createBackup = async () => {
    setCreating(true);
    setError("");
    setSuccess("");
    setCreated(null);

    try {
      const res = await fetch(buildUrl("/api/backups/create"), {
        method: "POST",
        headers: { ...authHeaders },
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(`Create backup error: ${res.status}${t ? ` — ${t}` : ""}`);
        return;
      }

      const json = (await res.json().catch(() => null)) as CreateBackupResponse | null;

      if (json) {
        setCreated(json);
        setSuccess(`Backup ${json.backupId} created successfully.`);
      } else {
        setSuccess("Backup created successfully.");
      }

      await fetchLatest();
    } catch (e: any) {
      setError(e?.message || "Create backup error");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (role !== "Admin") return;
    fetchLatest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  if (role !== "Admin") return null;

  return (
    <AdminShell title="Backups" active="backups">
      <div className="admin-root">
        <div className="admin-header">
          <div className="admin-header-main">
            <h1>Backups</h1>
            <p className="sub">Create a manual backup and review the latest snapshot.</p>
          </div>
        </div>

        {error ? (
          <div className="admin-alert admin-alert-error">
            <strong>Error:</strong> {error}
          </div>
        ) : null}

        {success ? (
          <div
            className="admin-alert"
            style={{
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#166534",
            }}
          >
            <strong>Success:</strong> {success}
          </div>
        ) : null}

        <div className="subm-stack">
          <div className="subm-card">
            <div className="subm-card-title">Manual backup</div>

            <div className="subm-actions-pretty">
              <div style={{ color: "#4b5563", lineHeight: 1.6 }}>
                This creates a snapshot of the database and upload folders.
              </div>

              <div className="subm-action-buttons">
                <button
                  className="subm-btn subm-btn-soft"
                  onClick={createBackup}
                  disabled={creating}
                >
                  {creating ? "Creating backup..." : "Create backup now"}
                </button>
              </div>
            </div>
          </div>

          <div className="subm-card">
            <div className="subm-card-title">Latest backup</div>

            {loadingLatest ? (
              <div className="subm-loading">Loading latest backup...</div>
            ) : !latest?.exists ? (
              <div className="subm-empty">No backups found yet.</div>
            ) : (
              <div className="subm-overview-list">
                <div className="subm-overview-row">
                  <span className="subm-overview-label">Backup ID</span>
                  <span className="subm-overview-value">{latest.backupId || "-"}</span>
                </div>

                <div className="subm-overview-row">
                  <span className="subm-overview-label">Path</span>
                  <span className="subm-overview-value">{latest.path || "-"}</span>
                </div>

                <div className="subm-overview-row">
                  <span className="subm-overview-label">Manifest</span>
                  <span className="subm-overview-value">{latest.manifestPath || "-"}</span>
                </div>
              </div>
            )}
          </div>

          {created ? (
            <div className="subm-card">
              <div className="subm-card-title">Created backup details</div>

              <div className="subm-overview-list">
                <div className="subm-overview-row">
                  <span className="subm-overview-label">Backup ID</span>
                  <span className="subm-overview-value">{created.backupId}</span>
                </div>

                <div className="subm-overview-row">
                  <span className="subm-overview-label">Created at</span>
                  <span className="subm-overview-value">
                    {new Date(created.createdAtUtc).toLocaleString()}
                  </span>
                </div>

                <div className="subm-overview-row">
                  <span className="subm-overview-label">Root path</span>
                  <span className="subm-overview-value">{created.backupRootPath}</span>
                </div>

                <div className="subm-overview-row">
                  <span className="subm-overview-label">Database file</span>
                  <span className="subm-overview-value">{created.databaseFile}</span>
                </div>

                <div className="subm-overview-row">
                  <span className="subm-overview-label">Uploads zip</span>
                  <span className="subm-overview-value">{created.uploadsZip}</span>
                </div>

                <div className="subm-overview-row">
                  <span className="subm-overview-label">Private uploads zip</span>
                  <span className="subm-overview-value">{created.privateUploadsZip}</span>
                </div>

                <div className="subm-overview-row">
                  <span className="subm-overview-label">Public assets zip</span>
                  <span className="subm-overview-value">{created.publicAssetsZip || "-"}</span>
                </div>

                <div className="subm-overview-row">
                  <span className="subm-overview-label">Manifest file</span>
                  <span className="subm-overview-value">{created.manifestFile}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AdminShell>
  );
}