import { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { useLocation, useNavigate } from "react-router-dom";

const BottomNav = () => {
  const [, setOpen] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  // ako kasnije ubaciš switch, poveži ovo sa state-om
  const [isOn] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.body.classList.toggle("theme-light", isOn);
    return () => document.body.classList.remove("theme-light");
  }, [isOn]);

  const closeAll = () => {
    setExpanded(false);
    setOpen(null);
  };

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    const navH = document.querySelector(".bottom-nav")?.clientHeight ?? 82;
    const y = el.getBoundingClientRect().top + window.scrollY - navH - 8;

    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  };

  useEffect(() => {
    const hash = (location.hash || "").replace("#", "").trim();
    if (!hash) return;

    window.setTimeout(() => scrollToId(hash), 0);
  }, [location.pathname, location.hash]);

  const goHomeTop = () => {
    closeAll();

    window.history.replaceState(null, "", "/");

    try {
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith("__scrolled_#"))
        .forEach((k) => sessionStorage.removeItem(k));
    } catch {}

    if (location.pathname !== "/") {
      navigate("/", { replace: false });
      window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goHomeAndScroll = (id: string) => {
    closeAll();

    if (location.pathname !== "/") {
      navigate(`/#${id}`, { replace: false });
      return;
    }

    window.history.replaceState(null, "", `/#${id}`);
    window.setTimeout(() => scrollToId(id), 0);
  };

  return (
    <Navbar
      fixed="top"
      expand="lg"
      expanded={expanded}
      onToggle={(v) => setExpanded(!!v)}
      className="bottom-nav nav-fade-in"
    >
      <Container fluid className="nav-wrap">
        <Navbar.Brand
          href="/"
          className="nav-brand"
          onClick={(e) => {
            e.preventDefault();
            goHomeTop();
          }}
        >
          <img src="/logo/pcp-logo.png" alt="Logo" className="nav-logo" draggable={false} />
        </Navbar.Brand>

        {/* hamburger samo na < lg */}
        <button
          className={`navbar-toggler custom-toggler d-lg-none ${expanded ? "is-open" : ""}`}
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setExpanded((p) => !p)}
        >
          <span className="bar bar1" />
          <span className="bar bar2" />
          <span className="bar bar3" />
        </button>

        <Navbar.Collapse className="justify-content-center">
          <Nav className="gap-5 align-items-center nav-center">
            <Nav.Link
              href="/"
              onClick={(e) => {
                e.preventDefault();
                goHomeTop();
              }}
            >
              HOME
            </Nav.Link>

            <Nav.Link
              href="#about"
              onClick={(e) => {
                e.preventDefault();
                goHomeAndScroll("about");
              }}
            >
              ABOUT US
            </Nav.Link>

            <Nav.Link
              href="#releases-trends"
              onClick={(e) => {
                e.preventDefault();
                goHomeAndScroll("releases-trends");
              }}
            >
              RELEASES &amp; TRENDS
            </Nav.Link>

            <Nav.Link
              href="#tiktok-trends"
              onClick={(e) => {
                e.preventDefault();
                goHomeAndScroll("tiktok-trends");
              }}
            >
              TIKTOK TRENDS
            </Nav.Link>

            <Nav.Link
              href="#partners"
              onClick={(e) => {
                e.preventDefault();
                goHomeAndScroll("partners");
              }}
            >
              PARTNERS
            </Nav.Link>

            <Nav.Link
              href="#sync"
              onClick={(e) => {
                e.preventDefault();
                goHomeAndScroll("sync");
              }}
            >
              SYNC
            </Nav.Link>

            <Nav.Link
              href="#services"
              onClick={(e) => {
                e.preventDefault();
                goHomeAndScroll("services");
              }}
            >
              SERVICES
            </Nav.Link>

            <Nav.Link
              href="#team"
              onClick={(e) => {
                e.preventDefault();
                goHomeAndScroll("team");
              }}
            >
              TEAM
            </Nav.Link>

            <Nav.Link
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                goHomeAndScroll("contact");
              }}
            >
              CONTACT US
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default BottomNav;
