import type { Theme } from "../App";

type SideRailsProps = {
  theme: Theme;
  onThemeToggle: () => void;
};

export const SideRails: React.FC<SideRailsProps> = ({
  theme,
  onThemeToggle,
}) => {
  return (
    <>
      {/* LEVO – mali vertikalni toggle */}
      <div className="side-rail side-rail-left">
        <button
          type="button"
          className="toggle-vertical"
          onClick={onThemeToggle}
          aria-label="Toggle theme"
        >
          <div className="toggle-vertical-track">
            <div
              className={
                "toggle-vertical-knob " +
                (theme === "light" ? "toggle-vertical-knob--top" : "toggle-vertical-knob--bottom")
              }
            />
          </div>
        </button>
      </div>

      {/* DESNO – IG (gore) – rupa – Discord (dole) */}
      <div className="side-rail side-rail-right">
        <a href="#" className="side-social" aria-label="Instagram">
          <i className="fa-brands fa-instagram" />
        </a>
        <div className="side-gap" />
        <a href="#" className="side-social" aria-label="Discord">
          <i className="fa-brands fa-discord" />
        </a>
      </div>
    </>
  );
};