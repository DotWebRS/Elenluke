import { useEffect, useMemo, useState } from "react";

type NavItem = { id: string; label: string };

export default function BottomNav() {
  const items: NavItem[] = useMemo(
    () => [
      { id: "home", label: "HOME" },
      { id: "about", label: "ABOUT US" }, // ✅ promenjeno (bilo about-us)
      { id: "releases-trends", label: "RELEASES & TRENDS" },
      { id: "tiktok-trends", label: "TIKTOK TRENDS" },
      { id: "partners", label: "PARTNERS" },
      { id: "sync", label: "SYNC" },
      { id: "services", label: "SERVICES" },
      { id: "team", label: "TEAM" },
      { id: "faq", label: "FAQ" },
      { id: "contact-us", label: "CONTACT US" },
    ],
    []
  );

  const [expanded, setExpanded] = useState(false);

  const closeAll = () => setExpanded(false);

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    const navH = document.querySelector(".bottom-nav")?.clientHeight ?? 82;
    const y = el.getBoundingClientRect().top + window.scrollY - navH - 8;

    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  };

  const goHomeTop = () => {
    closeAll();
    window.history.replaceState(null, "", "/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goAndScroll = (id: string) => {
    closeAll();
    window.history.replaceState(null, "", `/#${id}`);
    window.setTimeout(() => scrollToId(id), 0);
  };

  useEffect(() => {
    const onHash = () => {
      const hash = (window.location.hash || "").replace("#", "").trim();
      if (hash) window.setTimeout(() => scrollToId(hash), 0);
    };

    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 992px)");
    const onChange = () => {
      if (mq.matches) setExpanded(false);
    };
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  return (
    <header className="bottom-nav nav-fade-in" role="banner">
      <div className="nav-wrap">
        <a
          className="nav-brand"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            goHomeTop();
          }}
        >
          <img
            src="/logo/pcp-logo.png"
            alt="Logo"
            className="nav-logo"
            draggable={false}
          />
        </a>

        <button
          className={`custom-toggler d-lg-none ${expanded ? "is-open" : ""}`}
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={expanded}
          onClick={() => setExpanded((p) => !p)}
        >
          <span className="bar bar1" />
          <span className="bar bar2" />
          <span className="bar bar3" />
        </button>

        <nav className={`nav-center ${expanded ? "is-open" : ""}`} aria-label="Primary">
          <a
            className="nav-link"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              goHomeTop();
            }}
          >
            HOME
          </a>

          {items
            .filter((x) => x.id !== "home")
            .map((x) => (
              <a
                key={x.id}
                className="nav-link"
                href={`#${x.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  goAndScroll(x.id);
                }}
              >
                {x.label}
              </a>
            ))}
        </nav>
      </div>
    </header>
  );
}
