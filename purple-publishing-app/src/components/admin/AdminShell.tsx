import { useEffect, type ReactNode, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminSite } from "./useAdminSite";
import { ADMIN_SITES, type AdminSiteKey } from "./adminSites";

type AdminNavKey = "cms" | "submissions" | "users";

type AdminShellProps = {
  title: string;
  active: AdminNavKey;
  children: ReactNode;
};

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

  // fallback
  if (s === "purple-music-group") return `/admin/pmg${qs}`;
  if (s === "purple-crunch-records") return `/admin/pcr${qs}`;
  return `/admin/cms${qs}`;
}

export function AdminShell({ title, active, children }: AdminShellProps) {
  useEffect(() => {
    document.body.classList.add("is-admin");
    return () => document.body.classList.remove("is-admin");
  }, []);

  const navigate = useNavigate();
  const { site, setSite } = useAdminSite();

  useEffect(() => {
    if (title) document.title = title;
  }, [title]);

  useEffect(() => {
    if (!site) setSite("purple-music-group");
  }, [site, setSite]);

  const safeSite = (site || "purple-music-group") as AdminSiteKey;

  const shellKey = useMemo(() => {
    // Forsira remount kad menjaš site ili aktivnu sekciju (rešava “ostaje stari sadržaj”).
    return `${safeSite}__${active}`;
  }, [safeSite, active]);

  const goSection = (section: AdminNavKey, targetSite?: AdminSiteKey, replace = false) => {
    const s = (targetSite ?? safeSite) as AdminSiteKey | string;
    const path = buildAdminPath(section, s);
    navigate(path, { replace });
  };

  const handleSiteChange = (next: AdminSiteKey) => {
    // 1) set global site
    setSite(next);
    // 2) navigate na istu sekciju ali za novi site (replace da ne gomila history)
    goSection(active, next, true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/admin/login", { replace: true });
  };

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

        <div className="admin-topbar-right">
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
        </button>

        <button
          type="button"
          className={"subnav-tab" + (active === "users" ? " subnav-tab--active" : "")}
          onClick={() => goSection("users")}
        >
          Users
        </button>
      </nav>

      {children}
    </div>
  );
}

export default AdminShell;
