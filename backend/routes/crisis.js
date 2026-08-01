import { Router } from "express";
import db, { genId } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { HELPLINES } from "../data/helplines.js";
import { generateReply } from "../services/llm.js";

const router = Router();

const CRISIS_KEYWORDS = [
  "kill myself", "end my life", "suicide", "want to die", "hurt myself",
  "harm myself", "no reason to live", "better off without me", "can't go on",
  "cant go on", "emergency help", "need help now", "urgent help",
];
const OKAY_KEYWORDS = [
  "i'm okay", "im okay", "i'm ok", "im ok", "i'm fine", "im fine",
  "just tired", "doing alright", "doing okay", "not bad", "pretty good",
];

const BABY_TOPICS = {
  breastfeeding: {
    triggers: ["breastfeed", "brestfeed", "breast feed", "nursing", "latch", "milk supply", "engorge", "pump", "pumping", "cluster feed"],
    tip:
      "A few breastfeeding basics: aim for a deep latch (baby's mouth covers most of the areola, not just the nipple) -- " +
      "if it hurts throughout the feed, gently break suction and try again. Feed on demand rather than a strict clock, " +
      "especially in the early weeks (8-12 times a day is normal). Cluster feeding in the evenings is common and doesn't mean low supply. " +
      "If latch pain, cracked skin, or supply worries continue, a lactation consultant can help far more than general tips can.",
  },
  sleep: {
    triggers: ["baby sleep", "sleep training", "won't sleep", "wont sleep", "naps", "napping", "sleep schedule", "night waking"],
    tip:
      "Newborn sleep is chaotic by design -- babies wake every 2-4 hours to feed, and that's normal, not a sign you're doing something wrong. " +
      "A simple wind-down routine (dim lights, quiet, same order of steps) starts helping baby tell day from night around 6-8 weeks. " +
      "For your own sleep: sleep when the baby sleeps when you can, and don't be afraid to hand off a feed or a nap shift to your support person.",
  },
  crying: {
    triggers: ["colic", "won't stop crying", "wont stop crying", "baby crying", "baby won't settle", "baby wont settle", "fussy"],
    tip:
      "Crying is a baby's only language, and some babies are just more vocal than others. Run through the basics -- hungry, wet, gassy, " +
      "overtired, too hot/cold -- then try close contact (skin-to-skin, swaying, white noise). If crying is prolonged, high-pitched, or paired " +
      "with fever or feeding refusal, that's worth a same-day call to your pediatrician rather than waiting it out.",
  },
  feeding: {
    triggers: ["formula", "weaning", "solids", "feeding schedule", "bottle feed"],
    tip:
      "Whether it's breast, formula, or a mix -- fed is what matters, and there's no single right way to do it. " +
      "For solids, most babies are ready around 6 months (sitting with support, showing interest in food, losing the tongue-thrust reflex). " +
      "Start with single ingredients, one at a time, and don't stress about exact amounts early on.",
  },
  selfcare: {
    triggers: ["self care", "self-care", "no time for myself", "haven't showered", "havent showered", "no time to eat"],
    tip:
      "This one's easy to hear and hard to do, but even 10 minutes counts -- a shower, food you didn't have to prep one-handed, sitting outside. " +
      "If you have any support around, that's the thing to ask for: not 'watch the baby while I do chores' but 'watch the baby while I do nothing for 15 minutes.'",
  },
  bonding: {
    triggers: ["don't feel connected", "dont feel connected", "not bonding", "no bond", "feel nothing for"],
    tip:
      "Bonding isn't always instant, and feeling like it hasn't 'clicked' yet doesn't mean anything is wrong with you or your baby. " +
      "Skin-to-skin time, talking or singing during routine care, and simply giving it time all help -- but if this feeling is sticking around " +
      "for weeks and comes with a flat or low mood generally, it's worth mentioning to a doctor. It can be a sign worth screening for, not a character flaw.",
  },
};

const SYSTEM_PROMPT = `You are the support chat inside "Bloom", an app for new and postpartum mothers. Your role:
- Be warm, brief (2-4 sentences), and conversational -- not clinical.
- You can discuss emotional wellbeing AND practical new-mom topics (sleep, feeding, recovery, baby care) in general terms.
- Never provide medication dosages, diagnose any condition, or claim to replace a doctor.
- If the person expresses any thoughts of self-harm, suicide, or harming the baby, gently but clearly encourage them to contact a crisis helpline or emergency services right now, and keep your response short.
- If a topic is outside general new-parent support, gently redirect to what you can help with.
- Do not use markdown formatting -- plain conversational text only.`;

function findBabyTopic(lower) {
  for (const [key, topic] of Object.entries(BABY_TOPICS)) {
    if (topic.triggers.some((t) => lower.includes(t))) return key;
  }
  return null;
}

function classify(message) {
  const lower = message.toLowerCase();
  if (CRISIS_KEYWORDS.some((k) => lower.includes(k))) return "crisis";
  const babyTopic = findBabyTopic(lower);
  if (babyTopic) return "baby_" + babyTopic;
  if (OKAY_KEYWORDS.some((k) => lower.includes(k))) return "okay";
  return "open";
}

function crisisResponse() {
  return {
    text:
      "I'm really glad you told me. What you're feeling matters, and you don't have to carry it alone right now. " +
      "Please reach out to one of these helplines -- they have people trained for exactly this moment:",
    helplines: HELPLINES,
    suggestFamilyAlert: true,
    tier: "crisis",
  };
}

function babyTopicResponse(level) {
  const topic = BABY_TOPICS[level.replace("baby_", "")];
  return {
    text: topic.tip,
    quickReplies: ["That helps, thanks", "I want to talk about something else", "This isn't the issue, I need support"],
    tier: level,
  };
}

const FALLBACK_TEXT =
  "Thanks for sharing that. I'm here either way -- for talking things through, or for baby-care basics like breastfeeding, sleep, or soothing a fussy baby.";

router.post("/message", requireAuth, async (req, res) => {
  if (req.user.role !== "mom") return res.status(403).json({ error: "This support chat is for mothers" });
  const { message } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ error: "Message can't be empty" });

  const level = classify(message);

  let botReply;
  if (level === "crisis") {
    botReply = crisisResponse();
  } else if (level.startsWith("baby_")) {
    botReply = babyTopicResponse(level);
  } else {
    const recent = db
      .prepare("SELECT sender, message FROM crisis_logs WHERE mom_id = ? ORDER BY created_at DESC LIMIT 10")
      .all(req.user.id)
      .reverse();
    const history = recent.map((r) => ({ role: r.sender === "user" ? "user" : "assistant", content: r.message }));
    history.push({ role: "user", content: message });

    const llmText = await generateReply(SYSTEM_PROMPT, history);
    botReply = {
      text: llmText || FALLBACK_TEXT,
      quickReplies: level === "okay"
        ? ["Breastfeeding question", "Sleep question", "Nothing, just checking in"]
        : ["Tell me more", "I need baby-care tips", "I need emergency help"],
      tier: level,
      llmGenerated: !!llmText,
    };
  }

  const userMsgId = genId("cl");
  db.prepare("INSERT INTO crisis_logs (id, mom_id, sender, message, risk_flag) VALUES (?, ?, 'user', ?, ?)").run(
    userMsgId, req.user.id, message, level
  );
  const botMsgId = genId("cl");
  db.prepare("INSERT INTO crisis_logs (id, mom_id, sender, message, risk_flag) VALUES (?, ?, 'bot', ?, ?)").run(
    botMsgId, req.user.id, botReply.text, level
  );

  res.json({ reply: botReply });
});

router.get("/history", requireAuth, (req, res) => {
  if (req.user.role !== "mom") return res.status(403).json({ error: "This support chat is for mothers" });
  const rows = db
    .prepare("SELECT sender, message, created_at FROM crisis_logs WHERE mom_id = ? ORDER BY created_at ASC LIMIT 100")
    .all(req.user.id);
  res.json({ history: rows });
});

export default router;