import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Home from "./pages/Home";
import Contact from "./pages/Contact";
import BurgerMenu from "./components/BurgerMenu";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import Impressum from "./components/Impressum";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsOfUse from "./components/TermsOfUse";
import Cookies from "./components/Cookies";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // always show top of page on route change
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  return (
    <div className="app">
      <ScrollToTop /> 
      <BurgerMenu onNavigate={(path) => navigate(path)} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<Home />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfUse />} />
        <Route path="/cookies" element={<Cookies />} />
      </Routes>

      <Footer />
    </div>
  );
}
