import { useEffect, useState } from "react";
import type { AdminSiteKey } from "../components/admin/adminSites";

const API_BASE = (import.meta as any).env?.VITE_API_URL || "http://localhost:5284";

type FaqItem = { id?: string; q: string; a: string };
type CmsFaqPayload = { items: FaqItem[] };

const CMS_KEY = "home.faq";

// fallback ako CMS nema ništa
const DEFAULT_FAQ: FaqItem[] = [
  {
    q: "WHAT IS MUSIC PUBLISHING?",
    a: "A song (melody/lyrics/chords) is different from a recording (the sound file). We manage your songwriting rights so money from plays and users reaches you."
  },
  {
    q: "HOW CAN YOU SUPPORT ME?",
    a: "We manage your music rights and royalties worldwide. We register your songs globally with performance rights organizations (PROs), collect and distribute your performance, mechanical, and sync royalties on a regular basis, handle all types of music licensing, promote your catalog to artists, labels, brands, and media, connect you with our professional network, and provide legal support to help protect your works."
  },
  {
    q: "WHAT’S THE “COMPOSITION” VS THE “SOUND RECORDING”?",
    a: "The song is the idea and words. The recording is the audio file. We handle the song, labels handle the sounds. We present you as a songwriter under Purple Crunch Publishing. We (Purple Crunch Publishing, in partnership with Sony Music Publishing) manage the songwriting rights, not the sound."
  },
  {
    q: "WHAT IS THE DIFFERENCE BETWEEN A LABEL AND A PUBLISHER?",
    a: "Label: sound. Earns from streams/sales of the recording. Publisher = song. Earns from uses of the composition (radio, TV, streaming, live, sync). Label pays artist royalties. Publisher collects songwriter royalties and shares them with the artist."
  },
  {
    q: "HOW DOES THE GLOBAL REGISTRATION PROCESS WORK?",
    a: "A PRO is a Performance Rights Organization like GEMA, PRS, ASCAP, BMI. We help you join a PRO. We register your works globally. Reports come quarterly, and we pay you out accordingly."
  }
];

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

function normalizeFaq(payload: any): FaqItem[] {
  const parsed = safeParseJson<CmsFaqPayload>(payload?.json, { items: [] });
  const items = Array.isArray(parsed?.items) ? parsed.items : [];

  const cleaned = items
    .map((x: any, idx: number) => ({
      id: x?.id ? String(x.id) : `faq_${idx}`,
      q: String(x?.q ?? "").trim(),
      a: String(x?.a ?? "").trim()
    }))
    .filter((x) => x.q && x.a);

  return cleaned.length ? cleaned : DEFAULT_FAQ;
}

async function cmsGet(siteKey: string, key: string, signal: AbortSignal) {
  const ts = Date.now();
  const url = `${API_BASE}/api/cms?siteKey=${encodeURIComponent(siteKey)}&key=${encodeURIComponent(key)}&ts=${ts}`;

  const res = await fetch(url, {
    signal,
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache"
    }
  });

  return res;
}

function ToggleIcon({ open }: { open: boolean }) {
  return (
    <span className={`faq-icon ${open ? "is-open" : ""}`} aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {!open && <path d="M12 6v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
      </svg>
    </span>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [faqData, setFaqData] = useState<FaqItem[]>(DEFAULT_FAQ);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      const host = window.location.hostname.toLowerCase().replace(/^www\./, "");
      const siteKey = hostnameToSiteKey(host);

      try {
        const res = await cmsGet(siteKey, CMS_KEY, controller.signal);

        if (res.status === 404) return; // nema u bazi -> default
        if (!res.ok) return;

        const payload = await res.json().catch(() => null as any);
        const next = normalizeFaq(payload);

        if (!alive) return;
        setFaqData(next);

        // ako je openIndex van opsega posle učitavanja, resetuj na 0 ili null
        setOpenIndex((prev) => {
          if (prev == null) return prev;
          if (next.length === 0) return null;
          return prev >= next.length ? 0 : prev;
        });
      } catch {
        // ignore -> default
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  return (
    <section className="faq-section" id="faq">
      <h2 className="about-title about-title-centered">
        FAQ <span className="about-us-animated">SUPPORT</span>
      </h2>

      <div className="faq-wrapper">
        {faqData.map((item, i) => {
          const isOpen = openIndex === i;

          return (
            <div key={item.id ?? i} className={`faq-item ${isOpen ? "is-open" : ""}`}>
              <button
                className="faq-question"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                <span>{item.q}</span>
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
      </div>
    </section>
  );
}
