import { useEffect, useState } from "react";
import { loadFooter, loadHomeArtists, loadRoster } from "./client";
import { DEFAULT_FOOTER } from "./defaults";
import type { CmsFooter, CmsArtistsRoster, CmsHomeArtists } from "./types";

export function useCmsBundle(siteKey: string) {
  const [footer, setFooter] = useState<CmsFooter>(DEFAULT_FOOTER);
  const [roster, setRoster] = useState<CmsArtistsRoster>({ artists: [] });
  const [homeArtists, setHomeArtists] = useState<CmsHomeArtists>({ top3: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [f, r, h] = await Promise.all([
          loadFooter(siteKey),
          loadRoster(siteKey),
          loadHomeArtists(siteKey),
        ]);

        if (cancelled) return;

        if (f) setFooter(f);
        if (r) setRoster(r);
        if (h) setHomeArtists(h);

        // if homeArtists empty -> default to first 3
        if ((!h || !Array.isArray(h.top3) || h.top3.length === 0) && r?.artists?.length) {
          setHomeArtists({ top3: r.artists.slice(0, 3).map(a => a.id) });
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [siteKey]);

  return { footer, roster, homeArtists, loading, error, setFooter, setRoster, setHomeArtists };
}
