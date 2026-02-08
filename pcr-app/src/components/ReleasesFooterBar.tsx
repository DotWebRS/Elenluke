import Container from "react-bootstrap/Container";
import { Link } from "react-router-dom";

const InstaIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
    <path
      d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="2" />
    <path d="M17.5 6.5h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
    <path
      d="M14 3v10.2a4.8 4.8 0 1 1-4-4.73"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M14 7c1.6 2.2 3.6 3.3 6 3.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
    <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" stroke="currentColor" strokeWidth="2" />
    <path d="M7.6 10.2c3.6-1 7.2-.8 9.9.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8.2 13.3c2.9-.7 5.7-.5 7.8.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8.8 16.2c2.1-.5 4-.3 5.5.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
    <path
      d="M21 12s0-3.2-.4-4.6a2.6 2.6 0 0 0-1.8-1.8C17.4 5 12 5 12 5s-5.4 0-6.8.6A2.6 2.6 0 0 0 3.4 7.4C3 8.8 3 12 3 12s0 3.2.4 4.6a2.6 2.6 0 0 0 1.8 1.8C6.6 19 12 19 12 19s5.4 0 6.8-.6a2.6 2.6 0 0 0 1.8-1.8c.4-1.4.4-4.6.4-4.6z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M10 9.8v4.4l4-2.2-4-2.2z" fill="currentColor" stroke="none" />
  </svg>
);

export default function ReleasesFooterBar() {
  return (
    <Container fluid className="rFooterFluid">
      <div className="rFooterBar">
        <div className="rFooterSocials" aria-label="Social links">
          <a
            className="rFooterSocial"
            href="https://www.instagram.com/purplecrunchrecords?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw%3D%3D"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            title="Instagram"
          >
            <InstaIcon />
          </a>
          <a
            className="rFooterSocial"
            href="https://www.tiktok.com/@purplecrunchrecords?is_from_webapp=1&sender_device=pc"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
            title="TikTok"
          >
            <TikTokIcon />
          </a>
          <a
            className="rFooterSocial"
            href="https://open.spotify.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Spotify"
            title="Spotify"
          >
            <SpotifyIcon />
          </a>
          <a
            className="rFooterSocial"
            href="https://youtube.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            title="YouTube"
          >
            <YouTubeIcon />
          </a>
        </div>

        <nav className="rFooterLinks" aria-label="Legal links">
          <Link className="rFooterLink" to="/cookies">
            Cookie Policy
          </Link>
          <Link className="rFooterLink" to="/privacy">
            Privacy Policy
          </Link>
          <Link className="rFooterLink" to="/terms">
            Terms &amp; Conditions
          </Link>
          <Link className="rFooterLink" to="/impressum">
            Impressum
          </Link>
        </nav>
      </div>
    </Container>
  );
}
