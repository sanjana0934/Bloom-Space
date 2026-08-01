import { Router } from "express";
import db, { genId } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// The 10 EPDS items. Each has 4 options scored 0-3.
// Items 3, 5, 6, 7, 8, 9, 10 are reverse-scored (most-symptomatic answer listed first).
export const EPDS_ITEMS = [
  { id: 1, text: "I have been able to laugh and see the funny side of things", options: ["As much as I always could", "Not quite so much now", "Definitely not so much now", "Not at all"], reverse: false },
  { id: 2, text: "I have looked forward with enjoyment to things", options: ["As much as I ever did", "Rather less than I used to", "Definitely less than I used to", "Hardly at all"], reverse: false },
  { id: 3, text: "I have blamed myself unnecessarily when things went wrong", options: ["Yes, most of the time", "Yes, some of the time", "Not very often", "No, never"], reverse: true },
  { id: 4, text: "I have been anxious or worried for no good reason", options: ["No, not at all", "Hardly ever", "Yes, sometimes", "Yes, very often"], reverse: false },
  { id: 5, text: "I have felt scared or panicky for no good reason", options: ["Yes, quite a lot", "Yes, sometimes", "No, not much", "No, not at all"], reverse: true },
  { id: 6, text: "Things have been getting on top of me", options: ["Yes, most of the time I haven't been able to cope", "Yes, sometimes I haven't been coping as well as usual", "No, most of the time I have coped quite well", "No, I have been coping as well as ever"], reverse: true },
  { id: 7, text: "I have been so unhappy that I have had difficulty sleeping", options: ["Yes, most of the time", "Yes, sometimes", "Not very often", "No, not at all"], reverse: true },
  { id: 8, text: "I have felt sad or miserable", options: ["Yes, most of the time", "Yes, quite often", "Not very often", "No, not at all"], reverse: true },
  { id: 9, text: "I have been so unhappy that I have been crying", options: ["Yes, most of the time", "Yes, quite often", "Only occasionally", "No, never"], reverse: true },
  { id: 10, text: "The thought of harming myself has occurred to me", options: ["Yes, quite often", "Sometimes", "Hardly ever", "Never"], reverse: true },
];

function scoreAnswers(answers) {
  // answers: array of 10 integers, each the index (0-3) of the chosen option, in item order
  let score = 0;
  for (let i = 0; i < EPDS_ITEMS.length; i++) {
    const item = EPDS_ITEMS[i];
    const chosenIndex = answers[i];
    // options are listed most-symptomatic-first when reverse=true, so score = 3 - index; otherwise score = index
    score += item.reverse ? 3 - chosenIndex : chosenIndex;
  }
  const selfHarmFlag = answers[9] <= 2 && answers[9] >= 0 ? answers[9] < 3 : false; // any answer other than "Never" (index 3)
  let riskLevel = "low";
  if (score >= 13) riskLevel = "high";
  else if (score >= 10) riskLevel = "moderate";
  return { score, riskLevel, selfHarmFlag: answers[9] !== 3 };
}

router.get("/items", requireAuth, (req, res) => {
  res.json({ items: EPDS_ITEMS.map(({ id, text, options }) => ({ id, text, options })) });
});

router.post("/submit", requireAuth, (req, res) => {
  if (req.user.role !== "mom") return res.status(403).json({ error: "Only mothers submit screenings" });
  const { answers } = req.body;
  if (!Array.isArray(answers) || answers.length !== 10 || answers.some((a) => a < 0 || a > 3)) {
    return res.status(400).json({ error: "Please answer all 10 questions" });
  }
  const { score, riskLevel, selfHarmFlag } = scoreAnswers(answers);
  const id = genId("epds");
  db.prepare(
    "INSERT INTO epds_responses (id, mom_id, answers, score, risk_level, self_harm_flag) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, req.user.id, JSON.stringify(answers), score, riskLevel, selfHarmFlag ? 1 : 0);

  res.status(201).json({ id, score, riskLevel, selfHarmFlag });
});

// Mom sees her own full history including scores
router.get("/mine", requireAuth, (req, res) => {
  if (req.user.role !== "mom") return res.status(403).json({ error: "Only mothers can view this" });
  const rows = db
    .prepare("SELECT id, score, risk_level, self_harm_flag, created_at FROM epds_responses WHERE mom_id = ? ORDER BY created_at ASC")
    .all(req.user.id);
  res.json({ history: rows });
});

// Family sees trend only (score + risk_level over time), never raw answers
router.get("/family/:momId", requireAuth, (req, res) => {
  if (req.user.role !== "family") return res.status(403).json({ error: "Only family members can view this" });
  const link = db.prepare("SELECT 1 FROM family_links WHERE mom_id = ? AND family_id = ?").get(req.params.momId, req.user.id);
  if (!link) return res.status(403).json({ error: "You are not linked to this account" });

  const rows = db
    .prepare("SELECT score, risk_level, created_at FROM epds_responses WHERE mom_id = ? ORDER BY created_at ASC")
    .all(req.params.momId);
  const latest = rows[rows.length - 1] || null;
  res.json({ trend: rows, latest });
});

// Daily mood/sleep micro check-in
router.post("/checkin", requireAuth, (req, res) => {
  if (req.user.role !== "mom") return res.status(403).json({ error: "Only mothers submit check-ins" });
  const { mood, sleep, note } = req.body;
  if (mood == null || sleep == null) return res.status(400).json({ error: "Mood and sleep ratings are required" });
  const id = genId("chk");
  db.prepare("INSERT INTO checkins (id, mom_id, mood, sleep, note) VALUES (?, ?, ?, ?, ?)").run(
    id, req.user.id, mood, sleep, note || null
  );
  res.status(201).json({ id });
});

router.get("/checkins/mine", requireAuth, (req, res) => {
  if (req.user.role !== "mom") return res.status(403).json({ error: "Only mothers can view this" });
  const rows = db.prepare("SELECT * FROM checkins WHERE mom_id = ? ORDER BY created_at ASC").all(req.user.id);
  res.json({ checkins: rows });
});

// Plain-language weekly summary for family — built from trend + check-ins, never raw EPDS answers
router.get("/family/:momId/summary", requireAuth, (req, res) => {
  if (req.user.role !== "family") return res.status(403).json({ error: "Only family members can view this" });
  const link = db.prepare("SELECT 1 FROM family_links WHERE mom_id = ? AND family_id = ?").get(req.params.momId, req.user.id);
  if (!link) return res.status(403).json({ error: "You are not linked to this account" });

  const mom = db.prepare("SELECT name FROM users WHERE id = ?").get(req.params.momId);
  const scores = db
    .prepare("SELECT score, risk_level, created_at FROM epds_responses WHERE mom_id = ? ORDER BY created_at ASC")
    .all(req.params.momId);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recentCheckins = db
    .prepare("SELECT mood, sleep FROM checkins WHERE mom_id = ? AND created_at >= ?")
    .all(req.params.momId, sevenDaysAgo);
  const latestScan = db
    .prepare("SELECT mood, created_at FROM ai_nurse_scans WHERE mom_id = ? ORDER BY created_at DESC LIMIT 1")
    .get(req.params.momId);

  if (scores.length === 0 && recentCheckins.length === 0 && !latestScan) {
    return res.json({ summary: `${mom.name} hasn't logged any screenings, check-ins, or AI Nurse scans yet — there's nothing to summarize this week.` });
  }

  const parts = [];
  if (scores.length > 0) {
    const latest = scores[scores.length - 1];
    const prev = scores.length > 1 ? scores[scores.length - 2] : null;
    parts.push(`${mom.name}'s most recent screening came back ${latest.risk_level} risk.`);
    if (prev) {
      if (latest.score > prev.score) parts.push("That's a rise since her last screening, which is worth some gentle extra attention.");
      else if (latest.score < prev.score) parts.push("That's an improvement from her last screening.");
      else parts.push("That's about the same as her last screening.");
    }
  } else {
    parts.push(`${mom.name} hasn't completed a screening yet.`);
  }

  if (recentCheckins.length > 0) {
    const avgMood = (recentCheckins.reduce((s, c) => s + c.mood, 0) / recentCheckins.length).toFixed(1);
    const avgSleep = (recentCheckins.reduce((s, c) => s + c.sleep, 0) / recentCheckins.length).toFixed(1);
    parts.push(`Over the last 7 days she logged ${recentCheckins.length} check-in${recentCheckins.length === 1 ? "" : "s"}, averaging ${avgMood}/10 for mood and ${avgSleep}/10 for sleep.`);
  } else {
    parts.push("No daily check-ins logged in the last 7 days.");
  }

  if (latestScan) {
    parts.push(`Her most recent AI Nurse check read her mood as "${latestScan.mood}".`);
  }

  res.json({ summary: parts.join(" ") });
});

export default router;