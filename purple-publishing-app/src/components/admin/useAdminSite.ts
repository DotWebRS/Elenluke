import { useEffect, useState } from "react";
import type { AdminSiteKey } from "./adminSites";

const STORAGE_KEY = "admin_site_key";

export function useAdminSite() {
  const [site, setSiteState] = useState<AdminSiteKey>(
    "purple-crunch-publishing"
  );

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as AdminSiteKey | null;
    if (saved) setSiteState(saved);
  }, []);

  const setSite = (next: AdminSiteKey) => {
    setSiteState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  return { site, setSite };
}
