import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";

type NavChild = {
  id: string;
  label: string;
  route: string;
};

type NavItem = {
  id: string;
  label: string;
  route?: string;
  children?: NavChild[];
};

const NAV_HEIGHT = 84;

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  const items: NavItem[] = useMemo(
    () => [
      { id: "home", label: "HOME" },
      { id: "about", label: "ABOUT US" },
      {
        id: "releases-trends",
        label: "RELEASES",
        children: [
          { id: "releases-hub", label: "RELEASES HUB", route: "/releases-hub" },
        ],
      },
      { id: "services", label: "SERVICES" },
      { id: "contact", label: "CONTACT", route: "/contact" },
    ],
    []
  );

  const closeAll = () => {
    setExpanded(false);
  };

  const scrollToSection = (id: string) => {
    if (id === "home") {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
      return;
    }

    const el = document.getElementById(id);
    if (!el) return;

    const y = el.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;

    window.scrollTo({
      top: y,
      left: 0,
      behavior: "smooth",
    });
  };

  const handleNavClick = (item: NavItem) => {
    closeAll();

    if (item.route) {
      navigate(item.route);
      return;
    }

    if (location.pathname === "/") {
      scrollToSection(item.id);
      const nextUrl = item.id === "home" ? "/" : `/#${item.id}`;
      window.history.replaceState(null, "", nextUrl);
      return;
    }

    if (item.id === "home") {
      navigate("/");
    } else {
      navigate(`/#${item.id}`);
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
            navigate("/");
            closeAll();
          }}
        >
          <img
            src="/logo/pcp-logo.png"
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
          <Nav className="nav-center nav-center--new">
            {items.map((item) =>
              item.children ? (
                <div key={item.id} className="nav-item-with-menu">
                  <Nav.Link
                    href={item.id === "home" ? "/" : `/#${item.id}`}
                    className="nav-link nav-link-with-menu"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item);
                    }}
                  >
                    {item.label}
                  </Nav.Link>

                  <div className="nav-hover-menu">
                    {item.children.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        className="nav-hover-menu__item"
                        onClick={() => {
                          closeAll();
                          navigate(child.route);
                        }}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <Nav.Link
                  key={item.id}
                  href={item.route ? item.route : item.id === "home" ? "/" : `/#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item);
                  }}
                >
                  {item.label}
                </Nav.Link>
              )
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}