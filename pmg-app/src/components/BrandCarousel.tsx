import { useEffect, useMemo, useState } from "react";
import AnimateOnView from "./AnimateOnView";
import { buildApiUrl } from "../config/apiBase";

type BrandCardItem = {
  id: string;
  title: string;
  desc: string;
  logoSrc: string;
  href: string;
};

type CmsBrandsPayload = {
  items: Partial<BrandCardItem>[];
};

const CMS_SITE_KEY = "purple-music-group";
const CMS_KEY_BRANDS = "home.brands";

const DEFAULT_BRANDS: BrandCardItem[] = [
  {
    id: "records-default",
    title: "Purple Crunch Records",
    desc: "The artist-facing label dedicated to releases, campaigns, and growth in the digital era.",
    logoSrc: "/record.png",
    href: "https://purplecrunchrecords.com/",
  },
  {
    id: "pmg-default",
    title: "BIGBITE Agency",
    desc: "A music marketing agency transforming new releases into platform-wide trends through TikTok-first creator campaigns and edits.",
    logoSrc: "/BIGBITE.png",
    href: "https://bigbiteagency.com/",
  },
  {
    id: "publishing-default",
    title: "Purple Crunch Publishing",
    desc: "The creative backbone of the Purple Crunch ecosystem for writers, producers, and artists who define the sound of the digital generation.",
    logoSrc: "/publishing.png",
    href: "https://purplecrunchpublishing.com/",
  },
];

function safeJsonParse<T>(value: unknown, fallback: T): T {
  try {
    if (!value) return fallback;
    if (typeof value === "string") return JSON.parse(value) as T;
    return value as T;
  } catch {
    return fallback;
  }
}

function normalizeUrl(href: string) {
  const s = (href || "").trim();
  if (!s) return "";
  // ako user upiše "example.com" bez protokola, dodaj https
  if (!/^https?:\/\//i.test(s) && !s.startsWith("#") && !s.startsWith("/")) {
    return `https://${s}`;
  }
  return s;
}

function getAnimationClasses(index: number, total: number) {
  if (total <= 1) return { inClass: "animate__fadeInUp", outClass: "animate__fadeOut" };
  if (index === 0) return { inClass: "animate__fadeInLeft", outClass: "animate__fadeOutLeft" };
  if (index === 1) return { inClass: "animate__fadeInUp", outClass: "animate__fadeOutUp" };
  if (index === 2) return { inClass: "animate__fadeInRight", outClass: "animate__fadeOutRight" };
  return { inClass: "animate__fadeInUp", outClass: "animate__fadeOut" };
}

export default function BrandCarousel() {
  const [brands, setBrands] = useState<BrandCardItem[]>(DEFAULT_BRANDS);

  useEffect(() => {
    let alive = true;

    async function loadBrands() {
      try {
        const url = buildApiUrl(
          `/api/cms?siteKey=${encodeURIComponent(CMS_SITE_KEY)}&key=${encodeURIComponent(
            CMS_KEY_BRANDS
          )}&ts=${Date.now()}`
        );

        const res = await fetch(url);

        // nema entry -> ostavi default
        if (res.status === 404) return;

        const text = await res.text().catch(() => "");
        if (!res.ok) return;

        const raw = text ? JSON.parse(text) : null;
        const payload = safeJsonParse<CmsBrandsPayload>(raw?.json, { items: [] });

        const cleaned: BrandCardItem[] = (payload.items || []).map((b, idx) => {
          const title = String(b?.title ?? "").trim();
          const desc = String(b?.desc ?? "").trim();
          const logoSrc = String(b?.logoSrc ?? "").trim();
          const href = normalizeUrl(String(b?.href ?? ""));

          return {
            id: String(b?.id ?? `brand_${idx}`),
            title: title || "Untitled",
            desc: desc || "",
            logoSrc: logoSrc || "/branding/placeholder-logo.png",
            href: href || "#",
          };
        });

        if (!alive) return;
        setBrands(cleaned.length > 0 ? cleaned : DEFAULT_BRANDS);
      } catch {
        if (!alive) return;
        setBrands(DEFAULT_BRANDS);
      }
    }

    loadBrands();
    return () => {
      alive = false;
    };
  }, []);

  const total = brands.length;

  const getDelayMs = useMemo(() => {
    return (index: number) => Math.min(index, 7) * 90;
  }, []);

  return (
    <section className="brands">
      <div className="brands__inner">
        <div className="brandGrid">
          {brands.map((brand, index) => {
            const { inClass, outClass } = getAnimationClasses(index, total);
            const isDisabled = !brand.href || brand.href === "#";

            return (
              <AnimateOnView
                key={brand.id || `${brand.title}-${index}`}
                inClass={inClass}
                outClass={outClass}
                playOnce={false}
                fadeOnlyBelow={1024}
                style={{ animationDelay: `${getDelayMs(index)}ms` }}
              >
                <a
                  className={`brandCard ${isDisabled ? "is-disabled" : ""}`}
                  href={isDisabled ? undefined : brand.href}
                  target={isDisabled ? undefined : "_blank"}
                  rel={isDisabled ? undefined : "noreferrer"}
                  aria-disabled={isDisabled ? true : undefined}
                  onClick={isDisabled ? (e) => e.preventDefault() : undefined}
                >
                  <div className="brandCard__stage">
                    <img
                      className="brandCard__logo"
                      src={brand.logoSrc}
                      alt={`${brand.title} logo`}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        
                        (e.currentTarget as HTMLImageElement).src = "/branding/placeholder-logo.png";
                      }}
                    />
                  </div>

                  <div className="brandCard__text">
                    <div className="brandCard__title">{brand.title}</div>
                    <div className="brandCard__desc">{brand.desc}</div>
                    <div className="brandCard__cta">Visit website →</div>
                  </div>
                </a>
              </AnimateOnView>
            );
          })}
        </div>
      </div>
    </section>
  );
}
