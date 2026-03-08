import { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { useLocation, useNavigate } from "react-router-dom";

const BottomNav = () => {
  const [, setOpen] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
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

  const getNavOffset = (id?: string) => {
    const isMobile = window.innerWidth <= 991.98;

    if (id === "about-anchor") {
      return isMobile ? 76 : 86;
    }

    if (id === "hero") {
      return isMobile ? 84 : 96;
    }

    if (id === "top-tracks") {
      return isMobile ? 82 : 94;
    }

    return isMobile ? 88 : 100;
  };

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    const offset = getNavOffset(id);
    const y = el.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({
      top: Math.max(0, y),
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (location.pathname === "/" && (location.state as any)?.scrollTo) {
      const target = (location.state as any).scrollTo as string;

      const t = window.setTimeout(() => {
        scrollToId(target);
        navigate(location.pathname, { replace: true, state: {} });
      }, 180);

      return () => window.clearTimeout(t);
    }
  }, [location, navigate]);

  const goHomeAndScroll = (id: string) => {
    closeAll();

    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: id } });
    } else {
      scrollToId(id);
    }
  };

  const goToPathTop = (path: string) => {
    closeAll();

    if (location.pathname !== path) {
      navigate(path);
      window.setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 0);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <Navbar
      fixed="top"
      expand="lg"
      expanded={expanded}
      onToggle={(v) => setExpanded(!!v)}
      className="bottom-nav"
    >
      <Container fluid className="nav-wrap">
        <Navbar.Brand
          href="/"
          className="nav-brand"
          onClick={(e) => {
            e.preventDefault();
            goToPathTop("/");
          }}
        >
          <img
            src="/branding/publishing.png"
            alt="Logo"
            className="nav-logo"
            draggable={false}
          />
        </Navbar.Brand>

        <button
          className={`navbar-toggler custom-toggler ${expanded ? "is-open" : ""}`}
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setExpanded((p) => !p)}
        >
          <span className="bar bar1" />
          <span className="bar bar2" />
          <span className="bar bar3" />
        </button>

        <Navbar.Collapse className="justify-content-center">
          <Nav className="nav-center">
            <Nav.Link
              href="#hero"
              onClick={(e) => {
                e.preventDefault();
                goHomeAndScroll("hero");
              }}
            >
              HOME
            </Nav.Link>

            <Nav.Link
              href="#about-anchor"
              onClick={(e) => {
                e.preventDefault();
                goHomeAndScroll("about-anchor");
              }}
            >
              ABOUT US
            </Nav.Link>

            <Nav.Link
              href="#top-tracks"
              onClick={(e) => {
                e.preventDefault();
                goHomeAndScroll("top-tracks");
              }}
            >
              TALENTS
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
              href="/sync-licensing"
              onClick={(e) => {
                e.preventDefault();
                goToPathTop("/sync-licensing");
              }}
            >
              SYNC
            </Nav.Link>

            <Nav.Link
              href="/submitform"
              onClick={(e) => {
                e.preventDefault();
                goToPathTop("/submitform");
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