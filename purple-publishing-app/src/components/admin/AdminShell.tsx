import type { ReactNode } from "react";
import { useAdminSite } from "./useAdminSite";
import { ADMIN_SITES, type AdminSiteKey } from "./adminSites";

type AdminNavKey = "cms" | "submissions" | "users";

type AdminShellProps = {
  title: string;
  active: AdminNavKey;
  children: ReactNode;
};

// helper: gde da idemo za dati section + site
function buildAdminPath(section: AdminNavKey, site: AdminSiteKey | string) {
  const qs = `?site=${encodeURIComponent(site || "")}`;

  if (section === "cms") {
    // specijalan slučaj: PMG ima svoju rutu
    if (site === "purple-music-group") {
      return `/admin/pmg${qs}`;
    }
    return `/admin/cms${qs}`;
  }

  if (section === "submissions") {
    return `/admin/submissions${qs}`;
  }

  if (section === "users") {
    return `/admin/users${qs}`;
  }

  // fallback (ne bi trebalo da se desi)
  return `/admin/cms${qs}`;
}

export function AdminShell({ title, active, children }: AdminShellProps) {
  const { site, setSite } = useAdminSite();

  const goSection = (section: AdminNavKey, targetSite?: AdminSiteKey) => {
    const s = targetSite ?? site;
    const href = buildAdminPath(section, s);
    window.location.href = href;
  };

  const handleSiteChange = (next: AdminSiteKey) => {
    setSite(next);
    // ostani u istom tabu (cms / submissions / users) ali za novi site
    goSection(active, next);
  };

  return (
    <div className="admin-shell">
      {/* GORNJI RED: dropdown + CMS levo, Logout desno */}
      <header className="admin-topbar">
        <div className="admin-topbar-left">
          <label className="topbar-site">
            <select
              className="topbar-select"
              value={site}
              onChange={(e) =>
                handleSiteChange(e.target.value as AdminSiteKey)
              }
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
            className={
              "topbar-btn" + (active === "cms" ? " topbar-btn--active" : "")
            }
            onClick={() => goSection("cms")}
          >
            CMS
          </button>
        </div>

        <div className="admin-topbar-right">
          <button
            type="button"
            className="topbar-link"
            onClick={() => {
              window.location.href = "/admin/logout";
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* DRUGI RED: tabovi Submissions / Users – poravnati sa sadržajem */}
      <nav className="admin-subnav">
        <button
          type="button"
          className={
            "subnav-tab" +
            (active === "submissions" ? " subnav-tab--active" : "")
          }
          onClick={() => goSection("submissions")}
        >
          Submissions
        </button>
        <button
          type="button"
          className={
            "subnav-tab" +
            (active === "users" ? " subnav-tab--active" : "")
          }
          onClick={() => goSection("users")}
        >
          Users
        </button>
      </nav>

      {/* Glavni sadržaj (Inbox, tabela, CMS itd.) */}
      {children}
    </div>
  );
}

export default AdminShell;
