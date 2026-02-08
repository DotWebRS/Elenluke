import { useState } from "react";
import { Link } from "react-router-dom";

type ContactType = "LICENSING" | "GENERAL";

const Footer = () => {
  const [, ] = useState<ContactType>("LICENSING");
  const [, ] = useState<string>("Sync request");

  /*const topicOptions = useMemo(() => {
    return contactType === "LICENSING"
      ? ["Sync request"]
      : ["General question", "Follow-up", "Report a right issue"];
  }, [contactType]);*/

  /*const onTypeChange = (val: ContactType) => {
    setContactType(val);
    setTopic(val === "LICENSING" ? "Sync request" : "General question");
  };*/

  const brands = [
    {
      href: "https://pcr-landing-page.vercel.app/",
      logo: "/branding/pcp-logo.png",
      name: "Purple Crunch Publishing",
      isCurrent: false,
    },
    {
      href: "https://example.com",
      logo: "/branding/pmg.png",
      name: "Purple Music Group",
      isCurrent: false,
    },
    {
      href: "#",
      logo: "/branding/publishing.png",
      name: "Purple Crunch Publishing",
      isCurrent: true,
    },
  ];

  return (
    <footer className="pcp-footer" id="contact">
      <section className="pcp-footer__brands" aria-label="Brands">
        <div className="pcp-footer__brandsInner">
          <div className="services-head services-head--center">
            <h2 className="about-title about-title-centered">
              OUR <span className="about-us-animated">PARTNERS</span>
            </h2>
          </div>


          <div className="pcp-footer__brandsGrid">
            {brands.map((b, i) => (
              <a
                key={b.name}
                className={[
                  "pcp-footer__brandLink",
                  b.isCurrent ? "is-current" : "",
                  i === 1 ? "is-midGlow" : "",
                ].join(" ")}
                href={b.href}
                target={b.isCurrent ? undefined : "_blank"}
                rel={b.isCurrent ? undefined : "noreferrer"}
              >
                <img className="pcp-footer__brandLogo" src={b.logo} alt={b.name} draggable={false} loading="lazy" />
              </a>
            ))}

          </div>

        </div>
      </section>

      <div className="pcp-footer__inner">
        <div className="pcp-footer__bottom">
          <div className="pcp-footer__social">
            <a href="https://www.instagram.com/purplecrunchrecords?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" aria-label="Instagram" title="Instagram">
              <i className="fa-brands fa-instagram" />
            </a>
            <a href="https://www.tiktok.com/@purplecrunchrecords?is_from_webapp=1&sender_device=pc" aria-label="TikTok" title="TikTok">
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
};

export default Footer;
