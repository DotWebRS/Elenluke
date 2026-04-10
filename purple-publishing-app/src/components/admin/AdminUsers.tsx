import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "./AdminShell";
import { API_BASE } from "../../config/apiBase";

type UserRole = "Admin" | "Editor" | "PortalUser" | string;

type UserRow = {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

function buildUrl(path: string) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return base ? `${base}/${p}` : `/${p}`;
}

export default function AdminUsers() {
  const token = localStorage.getItem("token") || "";

  const authHeaders = useMemo<Record<string, string>>(
    () => (token ? ({ Authorization: `Bearer ${token}` } as Record<string, string>) : {}),
    [token]
  );

  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<UserRow[]>([]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("PortalUser");

  const canCreate = email.trim() && password.trim();

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(buildUrl(`/api/users`), {
        headers: { ...authHeaders },
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(`Users error: ${res.status}${t ? ` — ${t}` : ""}`);
        setUsers([]);
        return;
      }

      const json = await res.json().catch(() => null as any);
      setUsers(Array.isArray(json) ? json : []);
    } catch (e: any) {
      setError(e?.message || "Users error");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createUser = async () => {
    if (!canCreate) return;

    setError(null);
    setBusyId("create");

    try {
      const res = await fetch(buildUrl(`/api/users`), {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role,
          isActive: true,
        }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(`Create error: ${res.status}${t ? ` — ${t}` : ""}`);
        return;
      }

      const created: UserRow = await res.json().catch(() => null as any);
      if (created) setUsers((prev) => [created, ...prev]);

      setEmail("");
      setPassword("");
      setRole("PortalUser");
    } catch (e: any) {
      setError(e?.message || "Create error");
    } finally {
      setBusyId(null);
    }
  };

  const updateUser = async (id: string, patch: Partial<{ role: string; isActive: boolean }>) => {
    setError(null);
    setBusyId(id);

    try {
      const res = await fetch(buildUrl(`/api/users/${id}`), {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(`Update error: ${res.status}${t ? ` — ${t}` : ""}`);
        return;
      }

      const updated: UserRow = await res.json().catch(() => null as any);
      if (updated) {
        setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      }
    } catch (e: any) {
      setError(e?.message || "Update error");
    } finally {
      setBusyId(null);
    }
  };

  const hardDeleteUser = async (id: string) => {
    const ok = window.confirm("Delete user permanently?");
    if (!ok) return;

    setError(null);
    setBusyId(id);

    try {
      const res = await fetch(buildUrl(`/api/users/${id}`), {
        method: "DELETE",
        headers: { ...authHeaders },
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(`Delete error: ${res.status}${t ? ` — ${t}` : ""}`);
        return;
      }

      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e: any) {
      setError(e?.message || "Delete error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminShell title="Admin Users" active="users">
      <div className="admin-root">
        <div className="admin-header">
          <div className="admin-header-main">
            <h1>Users</h1>
            <p className="sub">Create and manage platform users and permissions.</p>
          </div>
        </div>

        {error ? (
          <div
            className="admin-alert"
            style={{ background: "#fff", border: "1px solid #e5e7eb", color: "#111827" }}
          >
            <strong style={{ color: "#111827" }}>Error:</strong> {error}
          </div>
        ) : null}

        <div className="admin-filters-row">
          <div className="admin-filters-main">
            <input
              className="admin-input"
              placeholder="Email (login)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />

            <input
              className="admin-input"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />

            <select
              className="admin-select"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="Admin">Admin</option>
              <option value="Editor">Editor</option>
              <option value="PortalUser">Portal User</option>
            </select>

            <button
              className="admin-btn admin-btn-primary"
              onClick={createUser}
              disabled={!canCreate || busyId === "create"}
            >
              Create user
            </button>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th className="th-actions" style={{ width: 340 }}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="admin-table-empty">
                    Loading…
                  </td>
                </tr>
              ) : null}

              {!loading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-table-empty">
                    No users.
                  </td>
                </tr>
              ) : null}

              {users.map((u) => {
                const busy = busyId === u.id;

                return (
                  <tr key={u.id} className="admin-row">
                    <td>{u.email}</td>

                    <td>
                      <select
                        className="admin-select admin-select--compact"
                        style={{ width: 180 }}
                        value={u.role}
                        disabled={busy}
                        onChange={(e) => updateUser(u.id, { role: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="Admin">Admin</option>
                        <option value="Editor">Editor</option>
                        <option value="PortalUser">Portal User</option>
                      </select>
                    </td>

                    <td>
                      <span className={`admin-badge ${u.isActive ? "badge-accepted" : "badge-rejected"}`}>
                        {u.isActive ? "Enabled" : "Disabled"}
                      </span>
                    </td>

                    <td>{new Date(u.createdAt).toLocaleString()}</td>

                    <td>
                      <div className="admin-table-actions" style={{ gap: 10, flexWrap: "wrap" }}>
                        <button
                          className="admin-btn admin-btn-secondary admin-btn--xs"
                          disabled={busy || u.isActive}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateUser(u.id, { isActive: true });
                          }}
                        >
                          Enable
                        </button>

                        <button
                          className="admin-btn admin-btn-danger admin-btn--xs"
                          disabled={busy || !u.isActive}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateUser(u.id, { isActive: false });
                          }}
                          aria-label="Disable"
                          title="Disable"
                        >
                          <i className="fa fa-ban" aria-hidden="true"></i>
                        </button>

                        <button
                          className="admin-btn admin-btn-danger admin-btn--xs"
                          disabled={busy}
                          onClick={(e) => {
                            e.stopPropagation();
                            hardDeleteUser(u.id);
                          }}
                          aria-label="Delete"
                          title="Delete"
                        >
                          <i className="fa fa-trash" aria-hidden="true"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}