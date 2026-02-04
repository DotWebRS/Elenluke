import { useEffect } from "react";

export default function UnderConstruction() {
    useEffect(() => {
    document.body.classList.add("uc-page");
    return () => document.body.classList.remove("uc-page");
  }, []);
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#000", color: "#fff" }}>
      <div style={{ maxWidth: 720, textAlign: "center" }}>
        <h1 style={{ fontSize: 42, marginBottom: 12 }}>Under construction</h1>
        <p style={{ opacity: 0.8, lineHeight: 1.6 }}>
          We're working on something new. Please check back soon.
        </p>
      </div>
    </div>
  );
}
