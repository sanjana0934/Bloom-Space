import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";

export default function EPDSForm() {
  const [items, setItems] = useState(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.epdsItems().then((d) => setItems(d.items));
  }, []);

  if (!items) return <div className="loading-state">Loading screening...</div>;

  const item = items[step];
  const progress = ((step) / items.length) * 100;

  function selectOption(optionIndex) {
    const next = [...answers];
    next[step] = optionIndex;
    setAnswers(next);
  }

  async function goNext() {
    if (answers[step] === undefined) return;
    if (step < items.length - 1) {
      setStep(step + 1);
    } else {
      try {
        const res = await api.epdsSubmit(answers);
        setResult(res);
      } catch (e) {
        setError(e.message);
      }
    }
  }

  function goBack() {
    if (step > 0) setStep(step - 1);
  }

  if (result) {
    return (
      <div>
        <div className="page-header"><h2>Screening complete</h2></div>
        <div className="card" style={{ textAlign: "center", padding: 36 }}>
          <div className="stat-label">Your EPDS score</div>
          <div className="stat-value" style={{ fontSize: 48, margin: "8px 0" }}>{result.score}</div>
          <span className={`risk-badge risk-${result.riskLevel}`}>{result.riskLevel} risk</span>
          {result.riskLevel !== "low" && (
            <p style={{ marginTop: 18, fontSize: 14, color: "var(--ink-soft)", maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
              This score is a screening signal, not a diagnosis. Consider talking to a doctor or counselor about how you've been feeling —
              and the immediate-help chat is here anytime you want to talk it through.
            </p>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
            <button className="btn btn-outline" onClick={() => navigate("/")}>Back to dashboard</button>
            <button className="btn btn-primary" style={{ width: "auto" }} onClick={() => navigate("/crisis")}>Talk to support chat</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>How have you been feeling this past week?</h2>
        <p>The Edinburgh Postnatal Depression Scale — 10 questions, be honest, there's no wrong answer.</p>
      </div>
      {error && <div className="error-banner">{error}</div>}
      <div className="card" style={{ maxWidth: 560, margin: "0 auto" }}>
        <div className="epds-progress">
          {items.map((_, i) => (
            <div key={i} className={`epds-progress-seg ${i <= step ? "done" : ""}`} />
          ))}
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-faint)", marginBottom: 8 }}>
          QUESTION {step + 1} OF {items.length}
        </div>
        <div className="epds-question">{item.text}</div>
        <div className="epds-options">
          {item.options.map((opt, i) => (
            <label key={i} className={`epds-option ${answers[step] === i ? "selected" : ""}`}>
              <input type="radio" name={`q${step}`} checked={answers[step] === i} onChange={() => selectOption(i)} />
              {opt}
            </label>
          ))}
        </div>
        <div className="epds-nav">
          <button className="btn btn-outline" onClick={goBack} disabled={step === 0}>Back</button>
          <button className="btn btn-primary" style={{ width: "auto" }} onClick={goNext} disabled={answers[step] === undefined}>
            {step === items.length - 1 ? "Submit" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
