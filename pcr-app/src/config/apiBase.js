/*const raw =
  (import.meta as any).env?.VITE_API_URL ??
  (import.meta as any).env?.VITE_API_BASE ??
  "";

export const API_BASE = String(raw).trim().replace(/\/+$/, "");

export function buildApiUrl(path: string) {
  const base = API_BASE;
  const p = String(path || "").replace(/^\/+/, "");
  return base ? `${base}/${p}` : `/${p}`;
}
*/
export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5284/api";
export function buildApiUrl(path) {
    const base = String(API_BASE || "").replace(/\/+$/, "");
    const p = String(path || "").replace(/^\/+/, "");
    return base ? `${base}/${p}` : `/${p}`;
}
