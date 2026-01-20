import { useMemo, useState } from "react";

type ContactType = "LICENSING" | "GENERAL";

const Footer = () => {
  const [contactType, setContactType] = useState<ContactType>("LICENSING");
  const [topic, setTopic] = useState<string>("Sync request");

  const topicOptions = useMemo(() => {
    return contactType === "LICENSING"
      ? ["Sync request"]
      : ["General question", "Follow-up", "Report a right issue"];
  }, [contactType]);

  const onTypeChange = (val: ContactType) => {
    setContactType(val);
    setTopic(val === "LICENSING" ? "Sync request" : "General question");
  };

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
          <h2 className="about-title about-title-centered">
            OUR <span className="about-us-animated">BRANDS</span>
          </h2>

          <div className="pcp-footer__brandsGrid">
            {brands.map((b) => (
              <a
                key={b.name}
                className={`pcp-footer__brandLink ${b.isCurrent ? "is-current" : ""}`}
                href={b.href}
                target={b.isCurrent ? undefined : "_blank"}
                rel={b.isCurrent ? undefined : "noreferrer"}
                aria-label={`Open ${b.name}`}
                title={`Open ${b.name}`}
              >
                <img
                  className="pcp-footer__brandLogo"
                  src={b.logo}
                  alt={b.name}
                  draggable={false}
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="pcp-footer__inner">
        <div className="pcp-footer__bottom">
          <div className="pcp-footer__social">
            <a href="#" aria-label="Instagram" title="Instagram">
              <i className="fa-brands fa-instagram" />
            </a>
            <a href="#" aria-label="TikTok" title="TikTok">
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
            <a href="#">Cookie Policy</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms &amp; Conditions</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
