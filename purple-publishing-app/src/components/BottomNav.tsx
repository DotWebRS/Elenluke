import { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
//import NavDropdown from "react-bootstrap/NavDropdown";
import { useLocation, useNavigate } from "react-router-dom";

const BottomNav = () => {
  const [ ,setOpen] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const [isOn, ] = useState(false);

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
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  
  const goHomeAndScroll = (id: string) => {
    closeAll();

    if (location.pathname !== "/") {
      navigate("/", { replace: false });
      window.setTimeout(() => scrollToId(id), 50);
    } else {
      scrollToId(id);
    }
  };

  const goToPathTop = (path: string) => {
    closeAll();

    if (location.pathname !== path) {
      navigate(path, { replace: false });
      window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  /*const goToPath = (path: string) => {
    closeAll();
    if (location.pathname !== path) navigate(path, { replace: false });
  };*/

  //const handleEnter = (menu: string) => setOpen(menu);
  //const handleLeave = () => setOpen(null);

  return (
    <Navbar
      fixed="top"
      expand="lg"
      expanded={expanded}
      onToggle={(v) => setExpanded(!!v)}
      className="bottom-nav nav-fade-in"
    >
      <Container fluid className="nav-wrap">
        {/* LOGO (levo) */}
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

        {/* HAMBURGER (animiran) */}
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
          <Nav className="gap-5 align-items-center nav-center">
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
              href="#about"
              onClick={(e) => {
                e.preventDefault();
                goHomeAndScroll("about");
              }}
            >
              ABOUT US
            </Nav.Link>

            {/* OUR TALENTS: */}
            <Nav.Link
              href="#top-tracks"
              onClick={(e) => {
                e.preventDefault();
                goHomeAndScroll("top-tracks");
                closeAll();
              }}
            >
              OUR TALENTS
            </Nav.Link>

            
            

            {/* OUR SERVICES: */}
            <Nav.Link
              href="#services"
              onClick={(e) => {
                e.preventDefault();
                goHomeAndScroll("services");
              }}
            >
              OUR SERVICES
            </Nav.Link>

            {/* SYNC:  */}
            

            <Nav.Link
              href="/sync-licensing"
              onClick={(e) => {
                e.preventDefault();
                goToPathTop("sync-licensing"); 
              }}
            >
              SYNC
            </Nav.Link>

            <Nav.Link
              href="/submitform"
              onClick={(e) => {
                e.preventDefault();
                goToPathTop("/submitform"); // umesto goToPath
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
