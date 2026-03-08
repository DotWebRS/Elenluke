import { Link } from "react-router-dom";
import "../style/Footer.css";

type Brand = {
  href: string;
  logo: string;
  name: string;
  isCurrent?: boolean;
  isMidGlow?: boolean;
};

export default function Footer() {
  const brands: Brand[] = [
    {
      href: "https://pcr-landing-page.vercel.app/",
      logo: "/branding/pcp-logo.png",
      name: "Purple Crunch Publishing",
    },
    {
      href: "https://example.com",
      logo: "/branding/pmg.png",
      name: "Purple Music Group",
      isMidGlow: true,
    },
    {
      href: "#",
      logo: "/branding/publishing.png",
      name: "Purple Crunch Publishing",
      isCurrent: true,
    },
  ];

  return (
    <footer className="pcp-footer" id="contact-us">
      <section className="pcp-footer__brands" aria-label="Partners">
        <div className="pcp-footer__brandsInner">
          <h2 className="pcp-footer__title">
            <span className="pcp-footer__titleLight">OUR</span>{" "}
            <span className="pcp-footer__titleGrad type-gradient">PARTNERS</span>
          </h2>

          <div className="pcp-footer__brandsGrid">
            {brands.map((b, i) => (
              <a
                key={`${b.name}_${i}`}
                className={[
                  "pcp-footer__brandLink",
                  b.isCurrent ? "is-current" : "",
                  b.isMidGlow ? "is-midGlow" : "",
                ].join(" ")}
                href={b.href}
                target={b.href === "#" ? undefined : "_blank"}
                rel={b.href === "#" ? undefined : "noreferrer"}
                aria-label={b.name}
                title={b.name}
              >
                <img
                  className="pcp-footer__brandLogo"
                  src={b.logo}
                  alt={b.name}
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                />
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="pcp-footer__inner">
        <div className="pcp-footer__bottom">
          <div className="pcp-footer__social" aria-label="Social links">
            <a
              href="https://www.instagram.com/purplecrunchrecords?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
              aria-label="Instagram"
              title="Instagram"
              target="_blank"
              rel="noreferrer"
            >
              <i className="fa-brands fa-instagram" />
            </a>

            <a
              href="https://www.tiktok.com/@purplecrunchrecords?is_from_webapp=1&sender_device=pc"
              aria-label="TikTok"
              title="TikTok"
              target="_blank"
              rel="noreferrer"
            >
              <i className="fa-brands fa-tiktok" />
            </a>

            <a href="#" aria-label="Spotify" title="Spotify">
              <i className="fa-brands fa-spotify" />
            </a>

            <a href="#" aria-label="YouTube" title="YouTube">
              <i className="fa-brands fa-youtube" />
            </a>
          </div>

          <div className="pcp-footer__legal">
            <Link to="/cookie-policy">Cookie Policy</Link>
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms">Terms &amp; Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
