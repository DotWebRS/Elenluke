// src/components/BurgerMenu.tsx
import { useEffect, useState } from "react";

type Props = {
  onNavigate: (path: string) => void;
};

export default function BurgerMenu({ onNavigate }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Drawer nav: DO NOT lock body scroll.

  const go = (path: string) => {
    setOpen(false);
    onNavigate(path);
  };

  return (
    <>
      <button
        type="button"
        className={`hamburgerIcon ${open ? "hamburgerIcon--open" : ""}`}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="hamburgerIcon__lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      {/* Right drawer wrapper (kept mounted for smooth close animation) */}
      <div className={`menuOverlay ${open ? "menuOverlay--open" : ""}`} aria-hidden={!open}>
        {/* Transparent click-outside area */}
        <button
          type="button"
          className="menuOverlay__backdrop"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          tabIndex={open ? 0 : -1}
        />

        <aside className="menuOverlay__panel" aria-label="Sidebar menu">
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
