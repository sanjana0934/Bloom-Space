export const FAMILY_REMINDERS = [
  "Have you asked her how she's really doing today — not just 'fine'?",
  "Offer to hold the baby for a stretch so she can rest, shower, or just sit quietly.",
  "Spend a few minutes with her without your phone out.",
  "Bring her food or water without being asked.",
  "Tell her she's doing a good job — specifically, not just in passing.",
  "Ask if she's slept, and if not, see if you can cover a feed or nap shift.",
  "Check in on her, not just the baby, when you visit or call.",
  "Let her vent without jumping straight to advice or fixing it.",
  "Notice if she's gone quiet or withdrawn — that's worth a gentle check-in.",
  "Take something off her plate today, even something small.",
];

function dayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getRemindersOfDay(count = 3) {
  const startIdx = dayOfYear() % FAMILY_REMINDERS.length;
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(FAMILY_REMINDERS[(startIdx + i) % FAMILY_REMINDERS.length]);
  }
  return result;
}