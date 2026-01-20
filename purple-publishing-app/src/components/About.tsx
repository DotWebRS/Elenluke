import { useEffect, useRef, useState } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

type AboutCms = {
  paragraphs: string[];
};

const DEFAULT: AboutCms = {
  paragraphs: [
    "Purple Crunch Publishing is the creative backbone of the Purple Music Group. A home for songwriters, producers, and artists who want to shape the sound of the digital generation.",
  ],
};

const About = () => {
  const [cms, setCms] = useState<AboutCms>(DEFAULT);

  useEffect(() => {
    const siteKey = "purple-crunch-publishing";
    const key = "home.about";
    const API_BASE = (import.meta as any).env?.VITE_API_BASE || "http://localhost:5284";

    fetch(`${API_BASE}/api/cms?siteKey=${encodeURIComponent(siteKey)}&key=${encodeURIComponent(key)}`)
      .then((r) => {
        if (r.status === 404) return null;
        return r.ok ? r.json() : null;
      })
      .then((wrapper) => {
        if (!wrapper?.json) return;

        let data: any = null;
        try {
          data = JSON.parse(wrapper.json);
        } catch {
          return;
        }

        const p0 = data?.paragraphs?.[0] ?? data?.text ?? DEFAULT.paragraphs[0];
        setCms({ paragraphs: [p0] });
      })
      .catch(() => {});
  }, []);

  const sectionRef = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  // NEW: trigger animation classes once when in view
  const [animateReady, setAnimateReady] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || inView) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          setAnimateReady(true);
          obs.disconnect();
        }
      },
      { threshold: 0.22, rootMargin: "0px 0px -10% 0px" }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [inView]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 992px)");

    if (reduce.matches || mobile.matches) {
      el.style.setProperty("--about-parallax", "0px");
      return;
    }

    let raf = 0;

    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;

      const progress = (vh - rect.top) / (vh + rect.height);
      const clamped = Math.max(0, Math.min(1, progress));

      const amount = 90;
      const offset = (clamped - 0.5) * 2 * amount;

      el.style.setProperty("--about-parallax", `${offset}px`);
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

  const aboutText = (cms.paragraphs?.[0] || DEFAULT.paragraphs[0] || "")
    .replace(/\r\n/g, "\n")
    .trim();

  return (
    <section
      id="about"
      ref={sectionRef as any}
      className={`about-section ${inView ? "is-inview" : ""}`}
    >
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} md={10} lg={8} className="about-inner">
           <h2
              className={[
                "about-title",
                "about-title-centered",
                animateReady ? "animate__animated animate__fadeInUp" : "",
              ].join(" ")}
            >
              ABOUT <span className="about-us-animated">US</span>
            </h2>

            <p
              className={[
                "about-text",
                "about-single",
                "about-preline",
                animateReady ? "animate__animated animate__fadeInUp about-anim-delay" : "",
              ].join(" ")}
            >
              {aboutText}
            </p>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default About;
