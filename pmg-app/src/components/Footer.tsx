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
          <a className="footer__link" href="/cookies">Cookies</a>
          <a className="footer__link" href="/privacy">Privacy Policy</a>
          <a className="footer__link" href="/terms">Terms of Use</a>
          <Link className="footer__link" to="/impressum">
            Impressum
          </Link>
        </div>
      </div>
    </footer>
  );
}
