import { Router } from "express";
import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";
import db, { genId } from "../db/index.js";
import { signToken, requireAuth } from "../middleware/auth.js";

const router = Router();
const inviteAlphabet = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

const ANON_ADJECTIVES = ["Gentle", "Quiet", "Steady", "Warm", "Calm", "Kind", "Soft", "Brave", "Patient", "Hopeful"];
const ANON_NOUNS = ["Moon", "River", "Sparrow", "Harbor", "Willow", "Lantern", "Meadow", "Tide", "Petal", "Cloud"];

function randomAlias() {
  const adj = ANON_ADJECTIVES[Math.floor(Math.random() * ANON_ADJECTIVES.length)];
  const noun = ANON_NOUNS[Math.floor(Math.random() * ANON_NOUNS.length)];
  const num = Math.floor(Math.random() * 90 + 10);
  return `${adj}${noun}${num}`;
}

// Register as a mother — gets an invite code to share with family
router.post("/register/mom", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return res.status(409).json({ error: "An account with this email already exists" });

  const id = genId("usr");
  const hash = bcrypt.hashSync(password, 10);
  let code;
  do {
    code = inviteAlphabet();
  } while (db.prepare("SELECT 1 FROM users WHERE invite_code = ?").get(code));

  db.prepare(
    "INSERT INTO users (id, name, email, password_hash, role, invite_code) VALUES (?, ?, ?, ?, 'mom', ?)"
  ).run(id, name, email, hash, code);

  db.prepare("INSERT INTO anon_identities (user_id, alias, avatar_seed) VALUES (?, ?, ?)").run(
    id,
    randomAlias(),
    genId("seed")
  );

  const user = { id, name, role: "mom" };
  res.status(201).json({ token: signToken(user), user: { ...user, email, invite_code: code } });
});

// Register as a family member — requires the mom's invite code
router.post("/register/family", (req, res) => {
  const { name, email, password, inviteCode, relation } = req.body;
  if (!name || !email || !password || !inviteCode) {
    return res.status(400).json({ error: "Name, email, password, and the mother's invite code are required" });
  }
  const mom = db.prepare("SELECT * FROM users WHERE invite_code = ? AND role = 'mom'").get(inviteCode.toUpperCase());
  if (!mom) return res.status(404).json({ error: "Invite code not found. Check the code and try again" });

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return res.status(409).json({ error: "An account with this email already exists" });

  const id = genId("usr");
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    "INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, 'family')"
  ).run(id, name, email, hash);

  db.prepare("INSERT INTO anon_identities (user_id, alias, avatar_seed) VALUES (?, ?, ?)").run(
    id,
    randomAlias(),
    genId("seed")
  );

  db.prepare(
    "INSERT INTO family_links (id, mom_id, family_id, relation) VALUES (?, ?, ?, ?)"
  ).run(genId("lnk"), mom.id, id, relation || "family member");

  const user = { id, name, role: "family" };
  res.status(201).json({ token: signToken(user), user: { ...user, email, linkedMom: mom.name } });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Incorrect email or password" });
  }
  const token = signToken(user);
  const payload = { id: user.id, name: user.name, role: user.role, email: user.email };
  if (user.role === "mom") payload.invite_code = user.invite_code;
  res.json({ token, user: payload });
});

router.get("/me", requireAuth, (req, res) => {
  const user = db.prepare("SELECT id, name, email, role, invite_code FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  let linkedFamily = [];
  let linkedMom = null;
  if (user.role === "mom") {
    linkedFamily = db
      .prepare("SELECT u.id, u.name, fl.relation FROM family_links fl JOIN users u ON u.id = fl.family_id WHERE fl.mom_id = ?")
      .all(user.id);
  } else {
    linkedMom = db
      .prepare("SELECT u.id, u.name FROM family_links fl JOIN users u ON u.id = fl.mom_id WHERE fl.family_id = ?")
      .get(user.id);
  }
  res.json({ ...user, linkedFamily, linkedMom });
});

export default router;
