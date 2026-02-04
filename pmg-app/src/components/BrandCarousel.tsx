import { useEffect, useState } from "react";
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
  items: BrandCardItem[];
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

function safeJsonParse<T>(value: any, fallback: T): T {
  try {
    if (!value) return fallback;
    if (typeof value === "string") return JSON.parse(value) as T;
    return value as T;
  } catch {
    return fallback;
  }
}

function getAnimationClasses(index: number, total: number) {
  if (total <= 1) {
    return {
      inClass: "animate__fadeInUpBig",
      outClass: "animate__fadeOutDownBig",
    };
  }

  const middle = Math.floor(total / 2);
  const last = total - 1;

  if (index === 0) {
    return {
      inClass: "animate__fadeInLeftBig",
      outClass: "animate__fadeOutLeftBig",
    };
  }

  if (index === middle) {
    return {
      inClass: "animate__fadeInDownBig",
      outClass: "animate__fadeOutDownBig",
    };
  }

  if (index === last) {
    return {
      inClass: "animate__fadeInRightBig",
      outClass: "animate__fadeOutRightBig",
    };
  }

  return {
    inClass: "animate__fadeInUpBig",
    outClass: "animate__fadeOutDownBig",
  };
}

export default function BrandCarousel() {
  const [brands, setBrands] = useState<BrandCardItem[]>(DEFAULT_BRANDS);

  useEffect(() => {
    let alive = true;

    async function loadBrands() {
      try {
        const url = buildApiUrl(
          `/api/cms?siteKey=${encodeURIComponent(
            CMS_SITE_KEY
          )}&key=${encodeURIComponent(CMS_KEY_BRANDS)}&ts=${Date.now()}`
        );

        const res = await fetch(url);

        if (res.status === 404) {
          return;
        }

        const text = await res.text().catch(() => "");
        if (!res.ok) {
          return;
        }

        const raw = text ? JSON.parse(text) : null;
        const payload = safeJsonParse<CmsBrandsPayload>(raw?.json, {
          items: [],
        });

        const cleaned = (payload.items || []).map((b, idx) => ({
          id: b.id || `brand_${idx}_${Date.now()}`,
          title: b.title ?? "",
          desc: b.desc ?? "",
          logoSrc: b.logoSrc ?? "",
          href: b.href ?? "",
        }));

        if (!alive) return;

        if (cleaned.length > 0) {
          setBrands(cleaned);
        } else {
          setBrands(DEFAULT_BRANDS);
        }
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
  const middle = Math.floor(total / 2);

  return (
    <section className="brands">
      <div className="brands__inner">
        <div className="brandGrid">
          {brands.map((brand, index) => {
            const { inClass, outClass } = getAnimationClasses(index, total);
            const isMiddle = total >= 3 && index === middle;
            const cardClass = isMiddle ? "brandCard brandCard--white" : "brandCard";

            return (
              <AnimateOnView
                key={brand.id || `${brand.title}-${index}`}
                inClass={inClass}
                outClass={outClass}
              >
                <a
                  className={cardClass}
                  href={brand.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="brandCard__frame" aria-hidden="true" />
                  <span
                    className="brandCard__frame brandCard__frame--inner"
                    aria-hidden="true"
                  />

                  <div className="brandCard__stage">
                    <img
                      className="brandCard__logo"
                      src={brand.logoSrc}
                      alt={`${brand.title} logo`}
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
