// frontend/src/pages/MomDashboard.jsx — replace whole file
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import TrendChart from "../components/TrendChart.jsx";
import QuoteCard from "../components/QuoteCard.jsx";
import { MOM_QUOTES, getQuoteOfDay } from "../data/quotes.js";

function RiskBadge({ level }) {
  if (!level) return null;
  return <span className={`risk-badge risk-${level}`}>{level}</span>;
}

export default function MomDashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState(null);
  const [checkins, setCheckins] = useState(null);
  const [mood, setMood] = useState(5);
  const [sleep, setSleep] = useState(5);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  async function load() {
    const [h, c] = await Promise.all([api.epdsMine(), api.checkinsMine()]);
    setHistory(h.history);
    setCheckins(c.checkins);
  }

  useEffect(() => { load(); }, []);

  async function submitCheckin(e) {
    e.preventDefault();
    await api.checkin({ mood: Number(mood), sleep: Number(sleep), note });
    setNote("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    load();
  }

  function copyCode() {
    navigator.clipboard.writeText(user.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const latest = history && history.length ? history[history.length - 1] : null;
  const quote = getQuoteOfDay(MOM_QUOTES);

  return (
    <div>
      <QuoteCard quote={quote} />
      <div className="page-header">
        <h2>Hi {user?.name?.split(" ")[0]}, how are you today?</h2>
        <p>This is your private space. Only you see full detail — family sees trends, never raw answers.</p>
      </div>

      <div className="card-grid">
        <div className="card stat-card">
          <div className="stat-label">Latest EPDS score</div>
          <div className="stat-value">{latest ? latest.score : "—"}</div>
          <div className="stat-sub"><RiskBadge level={latest?.risk_level} /></div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Screenings completed</div>
          <div className="stat-value">{history ? history.length : "—"}</div>
          <div className="stat-sub">
            <Link to="/epds" style={{ color: "var(--teal)", fontWeight: 600 }}>Take a new screening →</Link>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Daily check-ins logged</div>
          <div className="stat-value">{checkins ? checkins.length : "—"}</div>
          <div className="stat-sub">Mood &amp; sleep, 30 seconds</div>
        </div>
      </div>

      {history && history.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: 12, fontSize: 16 }}>Your trend over time</h3>
          <TrendChart data={history} />
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: 14, fontSize: 16 }}>Quick daily check-in</h3>
        {saved && <div className="success-banner">Saved — thank you for checking in.</div>}
        <form onSubmit={submitCheckin}>
          <div className="slider-row">
            <label><span>Mood</span><span>{mood}/10</span></label>
            <input type="range" min="1" max="10" value={mood} onChange={(e) => setMood(e.target.value)} />
          </div>
          <div className="slider-row">
            <label><span>Sleep quality</span><span>{sleep}/10</span></label>
            <input type="range" min="1" max="10" value={sleep} onChange={(e) => setSleep(e.target.value)} />
          </div>
          <div className="field">
            <label>Anything you want to note (optional)</label>
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <button className="btn btn-primary" style={{ width: "auto" }}>Save check-in</button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 6, fontSize: 16 }}>Invite a family member</h3>
        <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
          Share this code so they can create a family account linked to yours. They'll see your trend and risk level only — never your individual answers.
        </p>
        <div className="invite-box">
          <span className="invite-code">{user?.invite_code}</span>
          <button className="btn btn-outline btn-sm" onClick={copyCode}>{copied ? "Copied!" : "Copy"}</button>
        </div>
      </div>
    </div>
  );
}