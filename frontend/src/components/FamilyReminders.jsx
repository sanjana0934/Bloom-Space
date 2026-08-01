// frontend/src/components/FamilyReminders.jsx
import { getRemindersOfDay } from "../data/reminders.js";

export default function FamilyReminders() {
  const reminders = getRemindersOfDay(3);
  return (
    <div className="card">
      <h3 style={{ marginBottom: 12, fontSize: 16 }}>Today's reminders</h3>
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        {reminders.map((r, i) => (
          <li key={i} style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 8, lineHeight: 1.5 }}>{r}</li>
        ))}
      </ul>
    </div>
  );
}