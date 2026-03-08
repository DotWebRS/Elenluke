import { useEffect, useMemo, useState } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { API_BASE } from "../config/apiBase";
import FadeSection from "./FadeSection";

type AboutCms = {
  paragraphs: string[];
};

function buildUrl(path: string) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return base ? `${base}/${p}` : `/${p}`;
}

function normalizeAboutCms(data: any): AboutCms {
  const paragraphs = Array.isArray(data?.paragraphs)
    ? data.paragraphs.map((item: unknown) => String(item ?? "").trim()).filter(Boolean)
    : [];

  if (paragraphs.length > 0) {
    return { paragraphs };
  }

  if (typeof data?.text === "string" && data.text.trim()) {
    return { paragraphs: [data.text.trim()] };
  }

  return { paragraphs: [] };
}

export default function About() {
  const [cms, setCms] = useState<AboutCms | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadAbout = async () => {
      try {
        const siteKey = "purple-crunch-publishing";
        const key = "home.about";
        const url = buildUrl(
          `/api/cms?siteKey=${encodeURIComponent(siteKey)}&key=${encodeURIComponent(key)}&ts=${Date.now()}`
        );

        const response = await fetch(url, {
          method: "GET",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          setCms({ paragraphs: [] });
          return;
        }

        const wrapper = await response.json();

        if (!wrapper?.json) {
          setCms({ paragraphs: [] });
          return;
        }

        const parsed = JSON.parse(wrapper.json);
        setCms(normalizeAboutCms(parsed));
      } catch (error: any) {
        if (error?.name === "AbortError") return;
        setCms({ paragraphs: [] });
      }
    };

    loadAbout();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const el = document.getElementById("about");
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 992px)");

    if (reduce.matches) {
      el.style.setProperty("--about-bg-y", "0px");
      el.style.setProperty("--about-orb-y", "0px");
      el.style.setProperty("--about-text-y", "0px");
      return;
    }

    let raf = 0;

    const update = () => {
      raf = 0;

      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;

      const progress = (vh - rect.top) / (vh + rect.height);
      const t = Math.max(0, Math.min(1, progress));

      const ease = (x: number) => 1 - Math.pow(1 - x, 3);
      const e = ease(t);

      const bgY = (e - 0.5) * 2 * 120;
      const orbY = (e - 0.5) * 2 * 170;
      const textY = (e - 0.5) * 2 * -40;

      el.style.setProperty("--about-bg-y", `${bgY}px`);
      el.style.setProperty("--about-orb-y", `${orbY}px`);
      el.style.setProperty("--about-text-y", `${textY}px`);
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    const mqHandler = () => {
      if (mobile.matches) {
        el.style.setProperty("--about-bg-y", "0px");
        el.style.setProperty("--about-orb-y", "0px");
        el.style.setProperty("--about-text-y", "0px");
      } else {
        onScroll();
      }
    };

    mobile.addEventListener?.("change", mqHandler);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      mobile.removeEventListener?.("change", mqHandler);
    };
  }, []);

  const aboutText = useMemo(() => {
    return (cms?.paragraphs?.[0] || "").replace(/\r\n/g, "\n").trim();
  }, [cms]);

  return (
    <FadeSection id="about" className="about-section">
      <div id="about-anchor" className="about-anchor" aria-hidden="true" />
      <div className="about-orb" aria-hidden="true" />

      <div className="about-content">
        <Container>
          <Row className="justify-content-center">
            <Col xs={12} md={11} lg={9} className="about-inner">
              <h2 className="about-title about-title-centered">
                ABOUT <span className="about-us-animated">US</span>
              </h2>

              {aboutText && <p className="about-text">{aboutText}</p>}
            </Col>
          </Row>
        </Container>
      </div>
    </FadeSection>
  );
}