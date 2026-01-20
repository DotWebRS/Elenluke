import type { CmsFooter, CmsArtistsRoster, CmsHomeArtists } from "./types";

const API_BASE = (import.meta as any).env?.VITE_API_URL || "";

async function jsonOrNull(res: Response) {
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchContent<T>(siteKey: string, key: string, locale?: string): Promise<T | null> {
  const q = locale ? `?locale=${encodeURIComponent(locale)}` : "";
  const url = `${API_BASE}/api/content/${encodeURIComponent(siteKey)}.${encodeURIComponent(key)}${q}`;
  const res = await fetch(url, { method: "GET" });
  return jsonOrNull(res);
}

export async function upsertCms(siteKey: string, key: string, value: any, token: string): Promise<void> {
  const url = `${API_BASE}/api/cms`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ siteKey, key, json: JSON.stringify(value ?? {}) }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function uploadFile(file: File, folder: string, token: string): Promise<string> {
  const url = `${API_BASE}/api/uploads/file`;
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.url as string;
}

// Convenience typed loaders
export const loadFooter = (siteKey: string) => fetchContent<CmsFooter>(siteKey, "footer");
export const loadRoster = (siteKey: string) => fetchContent<CmsArtistsRoster>(siteKey, "artists.roster");
export const loadHomeArtists = (siteKey: string) => fetchContent<CmsHomeArtists>(siteKey, "home.artists");
