import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathname } = useLocation();

  // 1) isključi browser scroll restoration
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // 2) na svaku promenu rute idi na vrh (layout-safe)
  useLayoutEffect(() => {
    // probaj prvo window
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // 3) ako imaš scroll-container (često #root ili .page), skroluj i njega
    const root = document.getElementById("root");
    if (root) root.scrollTop = 0;

    const page = document.querySelector(".page") as HTMLElement | null;
    if (page) page.scrollTop = 0;

    // 4) i još jedan tick posle rendera (ako nešto pregazi odmah)
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (root) root.scrollTop = 0;
      if (page) page.scrollTop = 0;
    });
  }, [pathname]);

  return null;
}

export default ScrollToTop;
