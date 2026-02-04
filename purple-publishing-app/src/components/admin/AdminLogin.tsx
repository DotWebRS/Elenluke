import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../config/apiBase";
import BottomNav from "../BottomNav";

function buildUrl(path: string) {
  const base = String(API_BASE || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return base ? `${base}/${p}` : `/${p}`;
}

export const AdminLogin = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(buildUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        setError(res.status === 401 ? "Invalid username or password" : "Server error. Please try again.");
        return;
      }

      const data = await res.json().catch(() => null as any);

      if (!data?.token) {
        setError("Server error. Please try again.");
        return;
      }

      localStorage.setItem("token", data.token);
      navigate("/admin/submissions");
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="admin-login-section">
      <BottomNav />
      <div className="admin-login-card">
        <div className="admin-login-header">
          <p className="admin-login-eyebrow">ADMIN AREA</p>
          <h2 className="admin-login-title">Sign in to Publishing</h2>
          <p className="admin-login-subtitle">
            Restricted access, please use your assigned credentials.
          </p>
        </div>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <label className="admin-login-label">
            Username
            <div className="admin-login-input-wrap">
              <input
                type="text"
                className="admin-login-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                disabled={loading}
              />
            </div>
          </label>

          <label className="admin-login-label">
            Password
            <div className="admin-login-input-wrap admin-login-input-wrap--password">
              <input
                type={showPassword ? "text" : "password"}
                className="admin-login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="admin-login-toggle-password"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={loading}
              >
                {showPassword ? (
                  <i className="fa-solid fa-eye-slash"></i>
                ) : (
                  <i className="fa-solid fa-eye"></i>
                )}
              </button>
            </div>
          </label>

          {error && <p className="admin-login-error">{error}</p>}

          <div className="admin-login-row">
            <button
              type="button"
              className="admin-login-link"
              onClick={() => alert("Please contact system administrator.")}
              disabled={loading}
            >
              Forgot password?
            </button>
          </div>

          <button type="submit" className="admin-login-submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="admin-login-hint">
            For security reasons, never share these credentials.
          </p>
        </form>
      </div>
    </section>
  );
};
