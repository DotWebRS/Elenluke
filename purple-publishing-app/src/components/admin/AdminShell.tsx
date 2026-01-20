import type { ReactNode } from "react";
import { useMemo } from "react";
import { useAdminSite } from "./useAdminSite";
import type { AdminSiteKey } from "./adminSites";
import { ADMIN_SITES } from "./adminSites";

type Props = {
  title: string;
  children: ReactNode;
};

type SiteOption = { key: string; label: string };

function normalizeSites(input: unknown): SiteOption[] {
  if (!Array.isArray(input)) return [];

  const out: SiteOption[] = [];

  for (const x of input as any[]) {
    if (typeof x === "string") {
      const key = x.trim();
      if (key) out.push({ key, label: key });
      continue;
    }

    if (x && typeof x === "object") {
      const keyCandidate = x.key ?? x.domain ?? x.value ?? x.slug ?? x.id ?? x.name ?? "";
      const labelCandidate = x.label ?? x.name ?? x.title ?? x.domain ?? x.key ?? x.value ?? x.slug ?? x.id ?? "";

      const key = typeof keyCandidate === "string" ? keyCandidate.trim() : String(keyCandidate || "").trim();
      const label = typeof labelCandidate === "string" ? labelCandidate.trim() : String(labelCandidate || "").trim();

      if (key) out.push({ key, label: label || key });
    }
  }

  // dedupe by key
  const seen = new Set<string>();
  const deduped: SiteOption[] = [];
  for (const s of out) {
    if (seen.has(s.key)) continue;
    seen.add(s.key);
    deduped.push(s);
  }
  return deduped;
}

export function AdminShell({ title, children }: Props) {
  const { site, setSite } = useAdminSite();
  const siteOptions = useMemo<SiteOption[]>(() => normalizeSites(ADMIN_SITES), []);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/admin/login";
  };

  const go = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="admin">
      <div className="admin-shell">
        <div className="admin-topbar2">
          {/* ROW 1: Site + CMS */}
          <div className="admin-topbar2-row admin-topbar2-row--primary">
            <div className="admin-topbar2-left">
              <div className="admin-brand">{title}</div>

              <div className="">
                
                <select
                  className="admin-select"
                  value={site || ""}
                  onChange={(e) => setSite((e.target.value || "") as AdminSiteKey)}
                >
                  {siteOptions.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-topbar2-right">
              <button className="admin-btn admin-btn-primary" onClick={() => go("/admin/cms")}>
                CMS
              </button>
            </div>
          </div>

          {/* ROW 2: Submissions + Users + Logout */}
          <div className="admin-topbar2-row admin-topbar2-row--secondary">
            <button className="admin-btn" onClick={() => go("/admin/submissions")}>
              Submissions
            </button>

            <button className="admin-btn" onClick={() => go("/admin/users")}>
              Users
            </button>

            <div className="admin-topbar2-spacer" />

            <button className="admin-btn admin-btn-danger" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

export default AdminShell;
