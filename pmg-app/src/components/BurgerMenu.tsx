import { useEffect, useState } from "react";

type Props = {
  onNavigate: (path: string) => void;
};

export default function BurgerMenu({ onNavigate }: Props) {
  const [open, setOpen] = useState(false);

  // ESC close
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // lock scroll when open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = open ? "hidden" : prev;
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const go = (path: string) => {
    setOpen(false);
    onNavigate(path);
  };

  return (
    <>
      <button
        type="button"
        className={`hamburgerIcon ${open ? "hamburgerIcon--open" : ""}`}
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="hamburgerIcon__lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      {/* Overlay stays mounted for smooth close animation */}
      <div
        className={`menuOverlay ${open ? "menuOverlay--open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
      >
        <button
          type="button"
          className="menuOverlay__backdrop"
          aria-label="Close"
          onClick={() => setOpen(false)}
          tabIndex={open ? 0 : -1}
        />

        <aside className="menuOverlay__panel" aria-label="Sidebar menu">
          <div className="menuOverlay__top">
            <button
              type="button"
              className="menuOverlay__close"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              tabIndex={open ? 0 : -1}
            >
              ✕
            </button>
          </div>

          <nav className="menuOverlay__nav">
            <button
              type="button"
              className="menuOverlay__link"
              onClick={() => go("/")}
              tabIndex={open ? 0 : -1}
            >
              Home
            </button>

            <button
              type="button"
              className="menuOverlay__link"
              onClick={() => go("/contact")}
              tabIndex={open ? 0 : -1}
            >
              Contact
            </button>
          </nav>
        </aside>
      </div>
    </>
  );
}
