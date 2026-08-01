// frontend/src/pages/FamilyDashboard.jsx — replace whole file
import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import TrendChart from "../components/TrendChart.jsx";
import QuoteCard from "../components/QuoteCard.jsx";
import FamilyReminders from "../components/FamilyReminders.jsx";
import { FAMILY_QUOTES, getQuoteOfDay } from "../data/quotes.js";

const TIPS = {
  low: "Things look steady. A simple 'how are you, really?' goes a long way -- keep showing up.",
  moderate: "There's been a dip. Consider offering concrete help: a meal, watching the baby so she can rest, or just sitting with her without trying to fix anything.",
  high: "Scores suggest she may be struggling significantly right now. Gently encourage her to speak with a doctor or counselor, and let her know you're there -- avoid judgment or pressure.",
};

export default function FamilyDashboard() {
  const { user } = useAuth();
  const [trend, setTrend] = useState(null);
  const [summary, setSummary] = useState(null);
  const [nurseLatest, setNurseLatest] = useState(null);
  const [error, setError] = useState("");
  const quote = getQuoteOfDay(FAMILY_QUOTES);

  useEffect(() => {
    if (!user?.linkedMom) return;
    api.epdsFamily(user.linkedMom.id)
      .then((d) => setTrend(d))
      .catch((e) => setError(e.message));
    api.epdsFamilySummary(user.linkedMom.id)
      .then((d) => setSummary(d.summary))
      .catch(() => {});
    api.nurseFamily(user.linkedMom.id)
      .then((d) => setNurseLatest(d.latest))
      .catch(() => {});
  }, [user]);

  if (!user?.linkedMom) {
    return (
      <div className="card">
        <p>No linked account found yet. Ask the mother you're supporting for her invite code and register with it.</p>
      </div>
    );
  }

  if (error) return <div className="error-banner">{error}</div>;

  const latest = trend?.latest;

  return (
    <div>
      <QuoteCard quote={quote} />
      <div className="page-header">
        <h2>{user.linkedMom.name}'s Team</h2>
        <p>You see overall trends and risk level -- never her individual answers. That's her space to keep private.</p>
      </div>

      {summary && (
        <div className="card summary-card" style={{ marginBottom: 16 }}>
          <div className="stat-label" style={{ marginBottom: 6 }}>This week's summary</div>
          <p>{summary}</p>
        </div>
      )}

      <div className="card-grid">
        <div className="card stat-card">
          <div className="stat-label">Current risk level</div>
          <div className="stat-value" style={{ fontSize: 22, marginTop: 8 }}>
            {latest ? <span className={`risk-badge risk-${latest.risk_level}`}>{latest.risk_level}</span> : "No data yet"}
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Screenings on record</div>
          <div className="stat-value">{trend ? trend.trend.length : "-"}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Latest AI Nurse mood</div>
          <div className="stat-value" style={{ fontSize: 20, marginTop: 8, textTransform: "capitalize" }}>
            {nurseLatest ? nurseLatest.mood : "No scan yet"}
          </div>
          {nurseLatest && (
            <div className="stat-sub">{new Date(nurseLatest.created_at).toLocaleDateString()}</div>
          )}
        </div>
      </div>

      <FamilyReminders />

      {trend && trend.trend.length > 0 ? (
        <div className="card">
          <h3 style={{ marginBottom: 12, fontSize: 16 }}>Trend over time</h3>
          <TrendChart data={trend.trend} />
        </div>
      ) : (
        <div className="card empty-state">She hasn't completed a screening yet. Trends will appear here once she does.</div>
      )}

      {latest && (
        <div className="card">
          <h3 style={{ marginBottom: 8, fontSize: 16 }}>How you might help right now</h3>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6 }}>{TIPS[latest.risk_level]}</p>
        </div>
      )}
    </div>
  );
}