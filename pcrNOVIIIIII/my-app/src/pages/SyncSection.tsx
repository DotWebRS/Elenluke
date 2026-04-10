import { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import { useNavigate } from "react-router-dom";

import { API_BASE } from "../config/apiBase";
import FadeSection from "../components/FadeSection";

type CmsSyncSectionPayload = {
  titleAccent: string;
  buttonLabel: string;
  buttonHref: string;
  headline: string;
  paragraph1: string;
  paragraph2: string;
  paragraph3: string;
};

const DEFAULT_SYNC_SECTION: CmsSyncSectionPayload = {
  titleAccent: "LICENSING",
  buttonLabel: "LEARN MORE",
  buttonHref: "/sync-licensing",
  headline: "Curating Sound. Driving Impact. Leveraging Global IP.",
  paragraph1:
    "Purple Crunch Publishing is not just a rights holder, we are a modern IP engine designed for the digital era.",
  paragraph2:
    "We provide bespoke one-stop licensing solutions for film, television, advertising, and gaming.",
  paragraph3:
    "Our global infrastructure ensures that rights clearance and royalty administration are handled with institutional precision, while our creative team bridges the gap between raw talent and high-value commercial placement.",
};

function safeParseJson<T>(raw: any, fallback: T): T {
  try {
    if (raw == null) return fallback;
    if (typeof raw === "string") return JSON.parse(raw) as T;
    return raw as T;
  } catch {
    return fallback;
  }
}

function hostnameToSiteKey(hostname: string): string {
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
      Accept: "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
    },
  });
}

const SyncSection = () => {
  const navigate = useNavigate();
  const [syncSection, setSyncSection] = useState<CmsSyncSectionPayload>(DEFAULT_SYNC_SECTION);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      const host = window.location.hostname.toLowerCase().replace(/^www\./, "");
      const siteKey = hostnameToSiteKey(host);
      const key = "home.syncSection";

      try {
        const res = await cmsGet(siteKey, key, controller.signal);

        if (!alive) return;
        if (res.status === 404 || !res.ok) return;

        const payload = await res.json().catch(() => null as any);
        const parsed = safeParseJson<CmsSyncSectionPayload>(payload?.json, DEFAULT_SYNC_SECTION);

        const next: CmsSyncSectionPayload = {
          titleAccent: String(parsed?.titleAccent ?? DEFAULT_SYNC_SECTION.titleAccent),
          buttonLabel: String(parsed?.buttonLabel ?? DEFAULT_SYNC_SECTION.buttonLabel),
          buttonHref: parsed?.buttonHref?.trim() || "/sync-licensing",
          headline: String(parsed?.headline ?? DEFAULT_SYNC_SECTION.headline),
          paragraph1: String(parsed?.paragraph1 ?? DEFAULT_SYNC_SECTION.paragraph1),
          paragraph2: String(parsed?.paragraph2 ?? DEFAULT_SYNC_SECTION.paragraph2),
          paragraph3: String(parsed?.paragraph3 ?? DEFAULT_SYNC_SECTION.paragraph3),
        };

        if (!alive) return;
        setSyncSection(next);
      } catch {
        //
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  return (
    <FadeSection id="sync" className="sync-section sync-section--simple">
      <Container className="site-container">
        <div className="sync-head sync-head--center">
          <h2 className="sync-title">
            <span className="sync-title__white">SYNC</span>{" "}
            <span className="sync-title__grad">{syncSection.titleAccent}</span>
          </h2>

          <button
            type="button"
            className="sync-link-btn"
            onClick={() => navigate("/sync-licensing")}
          >
            {syncSection.buttonLabel || "LEARN MORE"}
          </button>
        </div>

        <div className="sync-simple-content">
          <h3 className="sync-subtitle sync-purple sync-main-title">
            {syncSection.headline}
          </h3>

          <div className="sync-main-text">
            {syncSection.paragraph1 ? <p>{syncSection.paragraph1}</p> : null}
            {syncSection.paragraph2 ? <p>{syncSection.paragraph2}</p> : null}
            {syncSection.paragraph3 ? <p>{syncSection.paragraph3}</p> : null}
          </div>
        </div>
      </Container>
    </FadeSection>
  );
};

export default SyncSection;
