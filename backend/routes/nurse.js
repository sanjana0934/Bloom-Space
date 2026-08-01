import { Router } from "express";
import db, { genId } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { HELPLINES } from "../data/helplines.js";

const router = Router();

const MOOD_INSTRUCTIONS = {
  happy: { text: "You look like you're having a good moment -- that's worth noticing. Keep doing whatever's working right now, even if it's small.", severity: "positive" },
  neutral: { text: "You seem calm right now. A good moment for a glass of water, a few deep breaths, or just sitting for a minute before the next thing.", severity: "neutral" },
  surprised: { text: "Something catch you off guard? Take a moment to settle -- a few slow breaths can help you reset.", severity: "neutral" },
  sad: { text: "It looks like today might be heavier than usual. That's okay. Try reaching out to someone nearby, or open the Immediate Help chat if you want to talk it through.", severity: "concern" },
  angry: { text: "Looks like frustration is building. Step away for a minute if you safely can -- even 60 seconds of space helps. It's okay to hand the baby to someone else for a bit.", severity: "concern" },
  fearful: { text: "You seem anxious right now. Try grounding: name 5 things you can see, 4 you can touch, 3 you can hear. The Immediate Help chat is there if you want more support.", severity: "concern" },
  disgusted: { text: "Something's clearly bothering you. Whatever it is, it's valid -- give yourself permission to step back from it for a bit.", severity: "neutral" },
};

function buildInstructions(mood, confidence) {
  const entry = MOOD_INSTRUCTIONS[mood] || MOOD_INSTRUCTIONS.neutral;
  let text = entry.text;
  if (entry.severity === "concern" && confidence > 0.6) {
    text += " If this feeling has been sticking around for more than a couple of weeks, please consider talking to a doctor.";
  }
  return { text, severity: entry.severity };
}

// Mom submits a mood reading. Only the detected mood + confidence are sent/stored -- never the photo itself.
router.post("/scan", requireAuth, (req, res) => {
  if (req.user.role !== "mom") return res.status(403).json({ error: "The AI Nurse is for mothers" });
  const { mood, confidence } = req.body;
  if (!mood || confidence == null) return res.status(400).json({ error: "A detected mood and confidence score are required" });

  const { text, severity } = buildInstructions(mood, confidence);
  const id = genId("nrs");
  db.prepare(
    "INSERT INTO ai_nurse_scans (id, mom_id, mood, confidence, instructions) VALUES (?, ?, ?, ?, ?)"
  ).run(id, req.user.id, mood, confidence, text);

  const response = { id, mood, confidence, instructions: text, severity };
  if (severity === "concern" && confidence > 0.6) {
    response.helplines = HELPLINES;
  }
  res.status(201).json(response);
});

router.get("/history", requireAuth, (req, res) => {
  if (req.user.role !== "mom") return res.status(403).json({ error: "The AI Nurse is for mothers" });
  const rows = db
    .prepare("SELECT id, mood, confidence, instructions, created_at FROM ai_nurse_scans WHERE mom_id = ? ORDER BY created_at DESC LIMIT 20")
    .all(req.user.id);
  res.json({ scans: rows });
});

// Family sees only the latest mood label + when it was recorded -- no photo, no raw detail beyond that.
router.get("/family/:momId", requireAuth, (req, res) => {
  if (req.user.role !== "family") return res.status(403).json({ error: "Only family members can view this" });
  const link = db.prepare("SELECT 1 FROM family_links WHERE mom_id = ? AND family_id = ?").get(req.params.momId, req.user.id);
  if (!link) return res.status(403).json({ error: "You are not linked to this account" });

  const latest = db
    .prepare("SELECT mood, created_at FROM ai_nurse_scans WHERE mom_id = ? ORDER BY created_at DESC LIMIT 1")
    .get(req.params.momId);
  res.json({ latest: latest || null });
});

export default router;