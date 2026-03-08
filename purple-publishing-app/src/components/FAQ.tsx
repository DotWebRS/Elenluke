import { useEffect, useState } from "react";
import type { AdminSiteKey } from "../components/admin/adminSites";
import { API_BASE } from "../config/apiBase";
import FadeSection from "./FadeSection";

type FaqItem = { id?: string; q: string; a: string };
type CmsFaqPayload = { items: FaqItem[] };

const CMS_KEY = "home.faq";

function safeParseJson<T>(raw: any, fallback: T): T {
  try {
    if (!raw) return fallback;
    if (typeof raw === "string") return JSON.parse(raw) as T;
    return raw as T;
  } catch {
    return fallback;
  }
}

function hostnameToSiteKey(hostname: string): AdminSiteKey {
  const h = (hostname || "").toLowerCase().replace(/^www\./, "");

  if (h.includes("publishing")) return "purple-crunch-publishing";
  if (h.includes("records")) return "purple-crunch-records";
  if (h.includes("music-group")) return "purple-music-group";

  return "purple-crunch-publishing";
}

function buildUrl(path: string) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return base ? `${base}/${p}` : `/${p}`;
}

async function cmsGet(siteKey: string, key: string, signal: AbortSignal) {
  const ts = Date.now();
  const url = buildUrl(
    `/api/cms?siteKey=${encodeURIComponent(siteKey)}&key=${encodeURIComponent(key)}&ts=${ts}`
  );

  return fetch(url, {
    signal,
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
    },
  });
}

function normalizeFaq(payload: any): FaqItem[] {
  const parsed = safeParseJson<CmsFaqPayload>(payload?.json, { items: [] });
  const items = Array.isArray(parsed?.items) ? parsed.items : [];

  return items
    .map((x: any, idx: number) => ({
      id: x?.id ? String(x.id) : `faq_${idx}`,
      q: String(x?.q ?? "").trim(),
      a: String(x?.a ?? "").trim(),
    }))
    .filter((x) => x.q && x.a);
}

function ToggleIcon({ open }: { open: boolean }) {
  return (
    <span className={`faq-icon ${open ? "is-open" : ""}`} aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {!open && (
          <path d="M12 6v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        )}
      </svg>
    </span>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [faqData, setFaqData] = useState<FaqItem[]>([]);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      const host = window.location.hostname.toLowerCase().replace(/^www\./, "");
      const siteKey = hostnameToSiteKey(host);

      try {
        const res = await cmsGet(siteKey, CMS_KEY, controller.signal);

        if (res.status === 404) {
          if (!alive) return;
          setFaqData([]);
          setOpenIndex(null);
          return;
        }

        if (!res.ok) return;

        const payload = await res.json().catch(() => null as any);
        const next = normalizeFaq(payload);

        if (!alive) return;
        setFaqData(next);
        setOpenIndex(null);
      } catch {
        if (!alive) return;
        setFaqData([]);
        setOpenIndex(null);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  return (
    <FadeSection id="faq" className="faq-section">
      <div className="faq-head">
        <h2 className="about-title about-title-centered">
          FAQ <span className="about-us-animated">SUPPORT</span>
        </h2>
      </div>

      <div className="faq-wrapper">
        {faqData.map((item, i) => {
          const isOpen = openIndex === i;

          return (
            <div key={item.id ?? i} className={`faq-item ${isOpen ? "is-open" : ""}`}>
              <button
                className="faq-question"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                type="button"
              >
                <span className="faq-question-text">{item.q}</span>
                <ToggleIcon open={isOpen} />
              </button>

              <div className={`faq-answer ${isOpen ? "open" : ""}`}>
                <div className="faq-answer-inner">
                  <p>{item.a}</p>
                </div>
              </div>
            </div>
          );
        })}

        {faqData.length === 0 && <div className="faq-empty" />}
      </div>
    </FadeSection>
  );
}