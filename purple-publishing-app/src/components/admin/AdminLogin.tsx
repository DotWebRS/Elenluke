import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const AdminLogin = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:5284/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!res.ok) {
        setError("Invalid username or password");
        return;
      }

      const data = await res.json();

      // snimamo JWT
      localStorage.setItem("token", data.token);

      // redirect u admin inbox
      navigate("/admin/submissions");
    } catch (err) {
      setError("Server error. Please try again.");
    }
  };

  return (
    <section className="admin-login-section">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <p className="admin-login-eyebrow">ADMIN AREA</p>
          <h2 className="admin-login-title">Sign in to Publishing</h2>
          <p className="admin-login-subtitle">
            Restricted access, please use your assigned credentials.
          </p>
        </div>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          {/* USERNAME */}
          <label className="admin-login-label">
            Username
            <div className="admin-login-input-wrap">
              <input
                type="text"
                className="admin-login-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </label>

          {/* PASSWORD */}
          <label className="admin-login-label">
            Password
            <div className="admin-login-input-wrap admin-login-input-wrap--password">
              <input
                type={showPassword ? "text" : "password"}
                className="admin-login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="admin-login-toggle-password"
                onClick={() => setShowPassword((p) => !p)}
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
              onClick={() =>
                alert("Please contact system administrator.")
              }
            >
              Forgot password?
            </button>
          </div>

          <button type="submit" className="admin-login-submit">
            Sign in
          </button>

          <p className="admin-login-hint">
            For security reasons, never share these credentials.
          </p>
        </form>
      </div>
    </section>
  );
};
