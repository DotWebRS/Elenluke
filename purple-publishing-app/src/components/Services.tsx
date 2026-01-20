import React, { useEffect, useMemo, useRef, useState } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

const API_BASE = "http://localhost:5284";

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
    <path
      d="M12 2l8 4v6c0 5-3.5 9.4-8 10-4.5-.6-8-5-8-10V6l8-4z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M9.5 12l1.8 1.8L15.8 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ChartIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
    <path d="M4 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 19V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 19V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M16 19V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M20 19V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const FilmIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
    <path
      d="M4 7h16v10H4V7z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M8 7v10" stroke="currentColor" strokeWidth="2" />
    <path d="M16 7v10" stroke="currentColor" strokeWidth="2" />
    <path d="M4 10h16" stroke="currentColor" strokeWidth="2" />
    <path d="M4 14h16" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
    <path
      d="M4 20h4l10.5-10.5a2 2 0 0 0 0-3L16.5 4a2 2 0 0 0-3 0L3 14.5V20z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M12.5 6.5l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

type CmsServiceItem = {
  title: string;
  text: string;
};

type CmsServicesPayload = {
  headingPrefix: string;
  headingAccent: string;
  items: CmsServiceItem[];
};

const DEFAULT: CmsServicesPayload = {
  headingPrefix: "OUR",
  headingAccent: "SERVICES",
  items: [
    {
      title: "Rights management & Administration",
      text: "We ensure every work is properly registered and protected worldwide.",
    },
    {
      title: "Royalty collection & Accounting",
      text: "We track, collect, and transparently report royalties across all platforms.",
    },
    {
      title: "Sync opportunities & Pitching",
      text: "We connect your music with global film, TV, gaming, and brand placements.",
    },
    {
      title: "Publishing right registration",
      text: "We manage and register publishing rights to guarantee accurate ownership and payment.",
    },
  ],
};

function safeJsonParse<T>(raw: any, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const iconForIndex = (i: number) => {
  const icons = [<ShieldIcon key="s" />, <ChartIcon key="c" />, <FilmIcon key="f" />, <EditIcon key="e" />];
  return icons[i % icons.length];
};

function useInViewClass<T extends HTMLElement>(threshold = 0.22) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e?.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -18% 0px" }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, inView };
}

const Services = () => {
  const { ref, inView } = useInViewClass<HTMLElement>(0.18);
  const [cms, setCms] = useState<CmsServicesPayload>(DEFAULT);

  useEffect(() => {
    const siteKey = "purple-crunch-publishing";
    const key = "home.services";

    fetch(`${API_BASE}/api/cms?siteKey=${encodeURIComponent(siteKey)}&key=${encodeURIComponent(key)}`)
      .then((r) => {
        if (r.status === 404) return null;
        return r.ok ? r.json() : null;
      })
      .then((wrapper) => {
        if (!wrapper?.json) return;

        const data = safeJsonParse<CmsServicesPayload>(wrapper.json, DEFAULT);

        setCms({
          headingPrefix: data?.headingPrefix ?? DEFAULT.headingPrefix,
          headingAccent: data?.headingAccent ?? DEFAULT.headingAccent,
          items: Array.isArray(data?.items) && data.items.length ? data.items : DEFAULT.items,
        });
      })
      .catch(() => {});
  }, []);

  const items = useMemo(
    () =>
      (cms.items || []).map((it, idx) => ({
        icon: iconForIndex(idx),
        title: it.title,
        desc: it.text,
      })),
    [cms.items]
  );

  return (
    <section ref={ref} className={`services-section ${inView ? "is-inview" : ""}`} id="services">
      <Container>
        <div className="services-head services-head--center">
          <h2 className="about-title about-title-centered">
              OUR <span className="about-us-animated">SERVICES</span>
          </h2>
        </div>

        <Row className="g-4 services-row">
          {items.map((it, idx) => (
            <Col key={`${it.title}_${idx}`} xs={12} md={6}>
              <article
                className="service-card"
                style={
                  {
                    ["--i" as any]: idx,
                    ["--tilt" as any]: idx % 2 === 0 ? "-7deg" : "7deg",
                  } as React.CSSProperties
                }
              >
                <div className="service-inner">
                  <div className="service-icon" aria-hidden="true">
                    <span className="service-icon-grad">{it.icon}</span>
                  </div>

                  <h3 className="service-name">{it.title}</h3>
                  <p className="service-desc">{it.desc}</p>

                  <div className="service-divider" />
                </div>
              </article>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default Services;
