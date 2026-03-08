import React, { useEffect, useState } from "react";
import { buildApiUrl } from "../config/apiBase";
import "../style/About.css";

type Props = {
  refEl?: React.RefObject<HTMLElement | null>;
  isActive?: boolean;
};

const CMS_SITE_KEY = "purple-crunch-records";
const CMS_KEY_ABOUT = "pcr.about.text";

function safeJsonParse<T>(value: any, fallback: T): T {
  try {
    if (value == null || value === "") return fallback;
    if (typeof value === "string") return JSON.parse(value) as T;
    return value as T;
  } catch {
    return fallback;
  }
}

function normalizeEscapes(text: string): string {
  const s = String(text ?? "");
  return s
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, "  ");
}

function splitToParagraphs(text: string): string[] {
  return String(text || "")
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);
}

function extractText(payload: any): string {
  if (payload == null) return "";

  if (typeof payload === "string") {
    const maybeParsed = safeJsonParse<any>(payload, null as any);
    if (typeof maybeParsed === "string") return maybeParsed;
    if (typeof maybeParsed?.text === "string") return maybeParsed.text;
    if (typeof maybeParsed?.value === "string") return maybeParsed.value;
    return payload;
  }

  if (typeof payload?.text === "string") return payload.text;
  if (typeof payload?.value === "string") return payload.value;

  return String(payload);
}

export default function About({ isActive = true }: Props) {
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [aboutText, setAboutText] = useState<string>("");

  useEffect(() => {
    setPhase(isActive ? "in" : "out");
  }, [isActive]);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      try {
        const url = buildApiUrl(
          `/api/cms?siteKey=${encodeURIComponent(CMS_SITE_KEY)}&key=${encodeURIComponent(CMS_KEY_ABOUT)}&ts=${Date.now()}`
        );

        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          cache: "no-store",
        });

        if (!alive) return;

        if (res.status === 404 || !res.ok) {
          setAboutText("");
          return;
        }

        const raw = await res.text().catch(() => "");
        if (!alive) return;

        const dto = safeJsonParse<{ json?: any }>(raw, {} as any);
        const extracted = extractText(dto?.json);
        const cleaned = normalizeEscapes(extracted).trim();

        setAboutText(cleaned);
      } catch {
        if (!alive) return;
        setAboutText("");
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  const cls =
    "page " +
    (phase === "in"
      ? "animate__animated animate__slideInRight"
      : "animate__animated animate__slideOutLeft");

  const paragraphs = splitToParagraphs(normalizeEscapes(aboutText));

  return (
    <section className={cls} style={{ animationDuration: "650ms" }} >
      <div className="about-bg" aria-hidden="true" />

      <div className="about-content">
        <div className="about-inner">
            <h2 className="about-title">
            <span className="about-title-light">ABOUT</span>
            <span className="about-title-grad type-gradient">US</span>
            </h2>

            {paragraphs.length > 0 && (
            <div className="about-body">
                {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            </div>
            )}
        </div>
        </div>
    
    </section>
  );
}
