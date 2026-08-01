import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import ShelterMark from "../components/ShelterMark.jsx";

export default function Register() {
  const [role, setRole] = useState("mom");
  const [form, setForm] = useState({ name: "", email: "", password: "", inviteCode: "", relation: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const payload =
        role === "mom"
          ? { name: form.name, email: form.email, password: form.password }
          : { name: form.name, email: form.email, password: form.password, inviteCode: form.inviteCode, relation: form.relation };
      const { token, user } = role === "mom" ? await api.registerMom(payload) : await api.registerFamily(payload);
      login(token, user);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-header">
          <ShelterMark className="brand-mark" />
          <h1>Join Bloom</h1>
          <p>A space to be honest about how you're really doing</p>
        </div>
        <div className="auth-tabs">
          <button type="button" className={`auth-tab ${role === "mom" ? "active" : ""}`} onClick={() => setRole("mom")}>
            I'm a mother
          </button>
          <button type="button" className={`auth-tab ${role === "family" ? "active" : ""}`} onClick={() => setRole("family")}>
            I'm supporting someone
          </button>
        </div>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Name</label>
            <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} required />
            <div className="hint">At least 8 characters</div>
          </div>
          {role === "family" && (
            <>
              <div className="field">
                <label>Invite code from the mother you're supporting</label>
                <input
                  value={form.inviteCode}
                  onChange={(e) => update("inviteCode", e.target.value.toUpperCase())}
                  placeholder="e.g. AZUYPT"
                  required
                />
              </div>
              <div className="field">
                <label>Your relation to her</label>
                <select value={form.relation} onChange={(e) => update("relation", e.target.value)}>
                  <option value="">Select...</option>
                  <option value="Partner">Partner</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="In-law">In-law</option>
                  <option value="Friend">Friend</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </>
          )}
          <button className="btn btn-primary" disabled={busy}>{busy ? "Creating account..." : "Create account"}</button>
        </form>
        <div className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
