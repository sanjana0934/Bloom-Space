// frontend/src/components/HelplineList.jsx
import { HELPLINES } from "../data/helplines.js";

export default function HelplineList() {
  return (
    <div>
      {HELPLINES.map((h) => (
        <div className="helpline-card" key={h.name}>
          <div className="hl-name">{h.name}</div>
          <div className="hl-detail">{h.detail}</div>
          <div className="hl-contact">{h.contact}</div>
        </div>
      ))}
    </div>
  );
}