import React, { useEffect, useRef, useState } from "react";
import { buildApiUrl } from "../config/apiBase";

type Props = {
  refEl?: React.RefObject<HTMLElement | null>;
  isActive?: boolean;
};

const CMS_SITE_KEY = "purple-crunch-records";
const CMS_KEY_TEAM = "pcr.team.text";

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

export default function Team({ isActive = true }: Props) {
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [teamText, setTeamText] = useState<string>("");
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setPhase(isActive ? "in" : "out");
  }, [isActive]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reduce.matches) {
      el.style.setProperty("--fade-progress", "1");
      return;
    }

    let raf = 0;

    const clamp = (value: number, min: number, max: number) =>
      Math.max(min, Math.min(max, value));

    const update = () => {
      raf = 0;

      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;

      const enterDistance = vh * 0.92;
      const exitDistance = vh * 0.72;

      const enterProgress = clamp((vh - rect.top) / enterDistance, 0, 1);
      const exitProgress = clamp(rect.bottom / exitDistance, 0, 1);

      const rawProgress = Math.min(enterProgress, exitProgress);
      const easedProgress = rawProgress * rawProgress * (3 - 2 * rawProgress);

      el.style.setProperty("--fade-progress", String(easedProgress));
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      try {
        const url = buildApiUrl(
          `/api/cms?siteKey=${encodeURIComponent(CMS_SITE_KEY)}&key=${encodeURIComponent(
            CMS_KEY_TEAM
          )}&ts=${Date.now()}`
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
          setTeamText("");
          return;
        }

        const raw = await res.text().catch(() => "");
        if (!alive) return;

        const dto = safeJsonParse<{ json?: any }>(raw, {} as any);
        const extracted = extractText(dto?.json);
        setTeamText(normalizeEscapes(extracted).trim());
      } catch {
        if (!alive) return;
        setTeamText("");
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

  const paragraphs = splitToParagraphs(normalizeEscapes(teamText));

  return (
    <section
      ref={sectionRef}
      className={cls}
      style={
        {
          animationDuration: "650ms",
          ["--fade-progress" as any]: 0,
        } as React.CSSProperties
      }
      id="team"
    >
      <div className="about-bg" aria-hidden="true" />

      <div className="team-center">
        <div className="team-inner">
          <h2 className="team-title team-fade-title">
            <span className="team-title-light">OUR</span>{" "}
            <span className="team-title-grad type-gradient">TEAM</span>
          </h2>

          {paragraphs.length > 0 && (
            <div className="team-body team-fade-body">
              {paragraphs.map((p, i) => (
                <p key={i} className="team-fade-p">
                  {p}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
