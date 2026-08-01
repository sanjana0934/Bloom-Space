import HelplineList from "../components/HelplineList.jsx";

export default function Helplines() {
  return (
    <div>
      <div className="page-header">
        <h2>Emergency Help</h2>
        <p>If you or someone you care about needs to talk to someone right now, these are available.</p>
      </div>
      <div className="card">
        <HelplineList />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
          If there is immediate danger to life, please call 112 or go to the nearest emergency room right away.
        </p>
      </div>
    </div>
  );
}