import type { CmsFooter, CmsArtistsRoster, CmsHomeArtists } from "./types";
import { API_BASE } from "../config/apiBase";

function buildUrl(path: string) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return base ? `${base}/${p}` : `/${p}`;
}

async function readTextSafe(res: Response) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

async function jsonOrNull(res: Response) {
  if (res.status === 404) return null;

  if (!res.ok) {
    const txt = await readTextSafe(res);
    throw new Error(txt || `Request failed (${res.status})`);
  }

  const txt = await readTextSafe(res);
  if (!txt) return null;

  try {
    return JSON.parse(txt);
  } catch {
    throw new Error(`Expected JSON, got: ${txt.slice(0, 200)}`);
  }
}

export async function fetchContent<T>(
  siteKey: string,
  key: string,
  locale?: string,
): Promise<T | null> {
  const q = locale ? `?locale=${encodeURIComponent(locale)}` : "";
  const id = `${encodeURIComponent(siteKey)}.${encodeURIComponent(key)}`;
  const url = buildUrl(`/api/content/${id}${q}`);

  const res = await fetch(url, { method: "GET" });
  return (await jsonOrNull(res)) as T | null;
}

export async function upsertCms(
  siteKey: string,
  key: string,
  value: any,
  token: string,
): Promise<void> {
  const url = buildUrl("/api/cms");

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ siteKey, key, json: JSON.stringify(value ?? {}) }),
  });

  if (!res.ok) {
    const txt = await readTextSafe(res);
    throw new Error(txt || `Request failed (${res.status})`);
  }
}

export async function uploadFile(
  file: File,
  folder: string,
  token: string,
): Promise<string> {
  const url = buildUrl("/api/uploads/file");

  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });

  if (!res.ok) {
    const txt = await readTextSafe(res);
    throw new Error(txt || `Upload failed (${res.status})`);
  }

  const data = (await jsonOrNull(res)) as any;
  const out = data?.url;
  if (!out) throw new Error("Upload succeeded but no url returned.");
  return out as string;
}

export const loadFooter = (siteKey: string) =>
  fetchContent<CmsFooter>(siteKey, "footer");
export const loadRoster = (siteKey: string) =>
  fetchContent<CmsArtistsRoster>(siteKey, "artists.roster");
export const loadHomeArtists = (siteKey: string) =>
  fetchContent<CmsHomeArtists>(siteKey, "home.artists");
