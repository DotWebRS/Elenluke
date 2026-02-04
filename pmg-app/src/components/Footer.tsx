import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__left">
          <span className="footer__label">Follow us</span>
          <a
            className="footer__iconLink"
            href="https://www.linkedin.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
          >
            <i className="fa fa-linkedin" aria-hidden="true" />
          </a>
        </div>

        <div className="footer__right">  
          <Link className="footer__link" to="/cookies">
            Cookies
          </Link>
          <Link className="footer__link" to="/privacy">
            Privacy Policy
          </Link>
          <Link className="footer__link" to="/terms">
            Terms of Use
          </Link>
          <Link className="footer__link" to="/impressum">
            Impressum
          </Link>
        </div>
      </div>
    </footer>
  );
}
