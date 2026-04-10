import { useEffect, type ReactNode, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminSite } from "./useAdminSite";
import { ADMIN_SITES, type AdminSiteKey } from "./adminSites";
import { useAdminNotifications } from "./AdminNotificationsProvider";

type AdminNavKey = "cms" | "submissions" | "users" | "backups";

type AdminShellProps = {
  title: string;
  active: AdminNavKey;
  children: ReactNode;
};

type UserRole = "Admin" | "Editor" | "PortalUser" | string;

function buildAdminPath(section: AdminNavKey, site: AdminSiteKey | string) {
  const s = site || "purple-music-group";
  const qs = `?site=${encodeURIComponent(s)}`;

  if (section === "cms") {
    if (s === "purple-music-group") return `/admin/pmg${qs}`;
    if (s === "purple-crunch-records") return `/admin/pcr${qs}`;
    return `/admin/cms${qs}`;
  }

  if (section === "submissions") return `/admin/submissions${qs}`;
  if (section === "users") return `/admin/users${qs}`;
  if (section === "backups") return `/admin/backups${qs}`;

  return `/admin/submissions${qs}`;
}

export function AdminShell({ title, active, children }: AdminShellProps) {
  const navigate = useNavigate();
  const { site, setSite } = useAdminSite();
  const {
    unreadCount,
    isConnected,
    events,
    clearEvents,
    markEventRead,
  } = useAdminNotifications();

  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  const role = (localStorage.getItem("role") || "") as UserRole;
  const isAdmin = role === "Admin";
  const isPortalUser = role === "PortalUser";

  useEffect(() => {
    document.body.classList.add("is-admin");
    return () => document.body.classList.remove("is-admin");
  }, []);

  useEffect(() => {
    document.title = title || "Admin";
  }, [title]);

  useEffect(() => {
    if (isPortalUser) {
      navigate("/portal/chat", { replace: true });
      return;
    }

    if (!site) setSite("purple-music-group");
  }, [isPortalUser, navigate, site, setSite]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!notificationsRef.current) return;
      if (!notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener("mousedown", onDocClick);
    }

    return () => {
      document.removeEventListener("mousedown", onDocClick);
    };
  }, [showNotifications]);

  const safeSite = (site || "purple-music-group") as AdminSiteKey;

  const shellKey = useMemo(() => `${safeSite}__${active}__${role}`, [safeSite, active, role]);

  const goSection = (section: AdminNavKey, targetSite?: AdminSiteKey, replace = false) => {
    if (isPortalUser) {
      navigate("/portal/chat", { replace: true });
      return;
    }

    const s = (targetSite ?? safeSite) as AdminSiteKey | string;
    navigate(buildAdminPath(section, s), { replace });
  };

  const handleSiteChange = (next: AdminSiteKey) => {
    if (isPortalUser) {
      navigate("/portal/chat", { replace: true });
      return;
    }

    setSite(next);
    goSection(active, next, true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("userId");
    navigate("/admin/login", { replace: true });
  };

  if (isPortalUser) return null;

  return (
    <div className="admin-shell" key={shellKey}>
      <header className="admin-topbar">
        <div className="admin-topbar-left">
          <label className="topbar-site">
            <select
              className="topbar-select"
              value={safeSite}
              onChange={(e) => handleSiteChange(e.target.value as AdminSiteKey)}
            >
              {ADMIN_SITES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label ?? s.key}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className={"topbar-btn" + (active === "cms" ? " topbar-btn--active" : "")}
            onClick={() => goSection("cms")}
          >
            CMS
          </button>
        </div>

        <div className="admin-topbar-right" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 12, color: isConnected ? "#166534" : "#991b1b", fontWeight: 700 }}>
            {isConnected ? "Live" : "Offline"}
          </div>

          <div style={{ position: "relative" }} ref={notificationsRef}>
            <button
              type="button"
              className="topbar-link"
              onClick={() => setShowNotifications((p) => !p)}
              style={{ position: "relative" }}
            >
              Notifications
              {unreadCount > 0 ? (
                <span
                  style={{
                    marginLeft: 8,
                    minWidth: 20,
                    height: 20,
                    borderRadius: 999,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 6px",
                    background: "#dc2626",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </button>

            {showNotifications ? (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 10px)",
                  width: 380,
                  maxHeight: 440,
                  overflowY: "auto",
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 16,
                  boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
                  padding: 12,
                  zIndex: 1000,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#111827" }}>Recent notifications</div>
                  <button
                    type="button"
                    className="topbar-link"
                    onClick={clearEvents}
                    style={{ fontSize: 12 }}
                  >
                    Clear
                  </button>
                </div>

                {events.length === 0 ? (
                  <div style={{ color: "#6b7280", fontSize: 14 }}>No notifications yet.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {events.map((evt) => {
                      const submissionId =
                        evt.payload?.submissionId ||
                        evt.payload?.id ||
                        "";

                      return (
                        <button
                          key={evt.id}
                          type="button"
                          onClick={() => {
                            markEventRead(evt.id);
                            setShowNotifications(false);

                            if (submissionId) {
                              navigate("/admin/submissions", {
                                replace: false,
                                state: { openSubmissionId: submissionId },
                              });
                            }
                          }}
                          style={{
                            border: evt.read ? "1px solid #eef2f7" : "1px solid #c4b5fd",
                            borderRadius: 12,
                            padding: 10,
                            background: evt.read ? "#fafafa" : "#f5f3ff",
                            textAlign: "left",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>
                            {evt.type}
                          </div>
                          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                            {new Date(evt.createdAt).toLocaleString()}
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              color: "#374151",
                              marginTop: 6,
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                            }}
                          >
                            {evt.payload?.body ||
                              evt.payload?.name ||
                              evt.payload?.email ||
                              evt.payload?.submissionId ||
                              "New event"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <button type="button" className="topbar-link" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <nav className="admin-subnav">
        <button
          type="button"
          className={"subnav-tab" + (active === "submissions" ? " subnav-tab--active" : "")}
          onClick={() => goSection("submissions")}
        >
          Submissions
          {unreadCount > 0 ? (
            <span
              style={{
                marginLeft: 8,
                minWidth: 18,
                height: 18,
                borderRadius: 999,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 6px",
                background: "#dc2626",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </button>

        {isAdmin ? (
          <button
            type="button"
            className={"subnav-tab" + (active === "users" ? " subnav-tab--active" : "")}
            onClick={() => goSection("users")}
          >
            Users
          </button>
          
        ) : null}

        {isAdmin ? (
          <button
            type="button"
            className={"subnav-tab" + (active === "backups" ? " subnav-tab--active" : "")}
            onClick={() => goSection("backups")}
          >
            Backups
          </button>
        ) : null}

      </nav>

      {children}
    </div>
  );
}

export default AdminShell;