// src/pages/FAQ.tsx
import { useEffect, useState } from "react";
import { buildApiUrl } from "../config/apiBase";
import "../style/Faq.css"

type Props = { isActive?: boolean };

type FaqItem = { id?: string; q: string; a: string };
type CmsFaqPayload = { items: FaqItem[] };

const CMS_SITE_KEY = "purple-crunch-records";
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

function getTikTokLikeCms(siteKey: string, key: string, signal: AbortSignal) {
  const url = buildApiUrl(
    `/api/cms?siteKey=${encodeURIComponent(siteKey)}&key=${encodeURIComponent(key)}&ts=${Date.now()}`
  );

  return fetch(url, {
    signal,
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Accept: "application/json",
    },
  });
}

function XToggle({ open }: { open: boolean }) {
  return (
    <span className={["faq-x", open ? "is-open" : ""].join(" ")} aria-hidden="true">
      <span className="faq-x__line faq-x__line--a" />
      <span className="faq-x__line faq-x__line--b" />
    </span>
  );
}

export default function FAQ({ isActive = true }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [faqData, setFaqData] = useState<FaqItem[]>([]);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await getTikTokLikeCms(CMS_SITE_KEY, CMS_KEY, controller.signal);

        if (!alive) return;

        if (res.status === 404) {
          setFaqData([]);
          setOpenIndex(null);
          return;
        }

        if (!res.ok) return;

        const payload = await res.json().catch(() => null as any);
        const next = normalizeFaq(payload);

        if (!alive) return;
        setFaqData(next);
        setOpenIndex(null); // sve zatvoreno default
      } catch {
        // silent
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  return (
    <section id="faq" className="faq-section" aria-hidden={!isActive}>
      <div className="faq-shell">
        <h2 className="faq-title">
          <span className="faq-titleLight">FAQ</span>{" "}
          <span className="faq-titleGrad type-gradient">SUPPORT</span>
        </h2>

        <div className="faq-wrapper">
          {faqData.map((item, i) => {
            const isOpen = openIndex === i;

            return (
              <article key={item.id ?? i} className={["faq-item", isOpen ? "is-open" : ""].join(" ")}>
                <button
                  className="faq-question"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  type="button"
                >
                  <span className="faq-qText">{item.q}</span>
                  <XToggle open={isOpen} />
                </button>

                <div className={["faq-answer", isOpen ? "open" : ""].join(" ")}>
                  <div className="faq-answer-inner">
                    <p>{item.a}</p>
                  </div>
                </div>
              </article>
            );
          })}

          {faqData.length === 0 && <div className="faq-empty" />}
        </div>
      </div>
    </section>
  );
}
