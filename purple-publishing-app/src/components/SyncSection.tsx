import Container from "react-bootstrap/Container";
import { useNavigate } from "react-router-dom";
import FadeSection from "./FadeSection";

const SyncSection = () => {
  const navigate = useNavigate();

  return (
    <FadeSection id="sync" className="sync-section sync-section--simple">
      <Container className="site-container">
        <div className="sync-head sync-head--center">
          <h2 className="about-title about-title-centered">
            SYNC <span className="about-us-animated">LICENSING</span>
          </h2>

          <button
            type="button"
            className="artists-link artists-link--back sync-link-btn"
            onClick={() => navigate("/sync-licensing")}
          >
            LEARN MORE
          </button>
        </div>

        <div className="sync-simple-content">
          <h3 className="sync-subtitle sync-purple sync-main-title">
            Curating Sound. Driving Impact. Leveraging Global IP.
          </h3>

          <div className="sync-main-text">
            <p>
              Purple Crunch Publishing is not just a rights holder, we are a
              modern IP engine designed for the digital era.
            </p>
            <p>
              We provide bespoke one-stop licensing solutions for film,
              television, advertising, and gaming.
            </p>
            <p>
              Our global infrastructure ensures that rights clearance and
              royalty administration are handled with institutional precision,
              while our creative team bridges the gap between raw talent and
              high-value commercial placement.
            </p>
          </div>
        </div>
      </Container>
    </FadeSection>
  );
};

export default SyncSection;