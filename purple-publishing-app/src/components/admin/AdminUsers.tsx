import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "./AdminShell";

const API_BASE = (import.meta as any).env?.VITE_API_URL || "http://localhost:5284";

type UserRow = {
  id: string;
  email: string;
  role: "Admin" | "Editor" | "Inbox" | string;
  isActive: boolean;
  createdAt: string;
};

export default function AdminUsers() {
  const token = localStorage.getItem("token");

  const authHeaders = useMemo<Record<string, string>>(
    () =>
      token
        ? ({ Authorization: `Bearer ${token}` } as Record<string, string>)
        : ({} as Record<string, string>),
    [token]
  );

  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<UserRow[]>([]);

  // create form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"Admin" | "Editor" | "Inbox">("Inbox");

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/users`, { headers: { ...authHeaders } });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(`Users error: ${res.status}${t ? ` — ${t}` : ""}`);
        return;
      }
      const json = await res.json();
      setUsers(Array.isArray(json) ? json : []);
    } catch (e: any) {
      setError(e?.message || "Users error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createUser = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role,
          isActive: true // auto enabled
        })
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(`Create error: ${res.status}${t ? ` — ${t}` : ""}`);
        return;
      }

      const created: UserRow = await res.json();
      setUsers((prev) => [created, ...prev]);

      setEmail("");
      setPassword("");
      setRole("Inbox");
    } catch (e: any) {
      setError(e?.message || "Create error");
    }
  };

  // koristi PUT /api/users/{id} za role i active
  const updateUser = async (
    id: string,
    patch: Partial<{ role: string; isActive: boolean }>
  ) => {
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch(`${API_BASE}/api/users/${id}`, {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(`Update error: ${res.status}${t ? ` — ${t}` : ""}`);
        return;
      }

      const updated: UserRow = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    } catch (e: any) {
      setError(e?.message || "Update error");
    } finally {
      setBusyId(null);
    }
  };

  const hardDeleteUser = async (id: string) => {
    const ok = window.confirm("Delete user PERMANENTLY? (no return)");
    if (!ok) return;

    setError(null);
    setBusyId(id);
    try {
      const res = await fetch(`${API_BASE}/api/users/${id}`, {
        method: "DELETE",
        headers: { ...authHeaders }
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
    <AdminShell title="Admin Users">
      <div className="admin-main">
        {/* samo create bar gore */}
        <div className="admin-toolbar admin-toolbar-users">
          <input
            className="admin-input"
            placeholder="Email (login)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="admin-input"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <select
            className="admin-select"
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
          >
            <option value="Admin">Admin</option>
            <option value="Editor">Editor</option>
            <option value="Inbox">Inbox</option>
          </select>

          <button
            className="admin-btn admin-btn-primary"
            onClick={createUser}
            disabled={!email || !password}
          >
            Create (auto enable)
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
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ width: 340 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: 18, color: "rgba(255,255,255,0.7)" }}>
                    Loading...
                  </td>
                </tr>
              ) : null}

              {!loading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 18, color: "rgba(255,255,255,0.7)" }}>
                    No users.
                  </td>
                </tr>
              ) : null}

              {users.map((u) => {
                const busy = busyId === u.id;

                return (
                  <tr key={u.id}>
                    <td>{u.email}</td>

                    <td>
                      <select
                        className="admin-select"
                        style={{ width: 160 }}
                        value={u.role}
                        disabled={busy}
                        onChange={(e) => updateUser(u.id, { role: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="Admin">Admin</option>
                        <option value="Editor">Editor</option>
                        <option value="Inbox">Inbox</option>
                      </select>
                    </td>

                    <td>
                      <span className={`admin-badge ${u.isActive ? "accepted" : "rejected"}`}>
                        {u.isActive ? "Enabled" : "Disabled"}
                      </span>
                    </td>

                    <td>{new Date(u.createdAt).toLocaleString()}</td>

                    <td>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button
                          className="admin-btn"
                          disabled={busy || u.isActive}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateUser(u.id, { isActive: true });
                          }}
                        >
                          Enable
                        </button>

                        <button
                          className="admin-btn admin-btn-danger"
                          disabled={busy || !u.isActive}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateUser(u.id, { isActive: false });
                          }}
                        >
                          <i className="fa fa-ban" aria-hidden="true"></i>
                        </button>

                        <button
                          className="admin-btn admin-btn-danger"
                          disabled={busy}
                          onClick={(e) => {
                            e.stopPropagation();
                            hardDeleteUser(u.id);
                          }}
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
