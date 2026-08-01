import { Router } from "express";
import db, { genId } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const ROOM = "general";

function getIdentity(userId) {
  return db.prepare("SELECT alias, avatar_seed FROM anon_identities WHERE user_id = ?").get(userId);
}

function serializeMessage(row, currentUserId) {
  const reactions = db
    .prepare("SELECT emoji, COUNT(*) as count FROM anon_reactions WHERE message_id = ? GROUP BY emoji")
    .all(row.id);
  const myReactions = db
    .prepare("SELECT emoji FROM anon_reactions WHERE message_id = ? AND user_id = ?")
    .all(row.id, currentUserId)
    .map((r) => r.emoji);
  return {
    id: row.id,
    alias: row.deleted ? null : row.alias,
    content: row.deleted ? "[message deleted]" : row.content,
    replyToId: row.reply_to_id,
    deleted: !!row.deleted,
    isMine: row.user_id === currentUserId,
    createdAt: row.created_at,
    editedAt: row.edited_at,
    reactions,
    myReactions,
  };
}

router.get("/identity", requireAuth, (req, res) => {
  res.json(getIdentity(req.user.id));
});

router.get("/messages", requireAuth, (req, res) => {
  const rows = db
    .prepare("SELECT * FROM anon_messages WHERE room = ? ORDER BY created_at ASC LIMIT 200")
    .all(ROOM);
  res.json({ messages: rows.map((r) => serializeMessage(r, req.user.id)) });
});

router.post("/messages", requireAuth, (req, res) => {
  const { content, replyToId } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: "Message can't be empty" });
  const identity = getIdentity(req.user.id);
  const id = genId("msg");
  db.prepare(
    "INSERT INTO anon_messages (id, room, user_id, alias, content, reply_to_id) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, ROOM, req.user.id, identity.alias, content.trim(), replyToId || null);
  const row = db.prepare("SELECT * FROM anon_messages WHERE id = ?").get(id);
  const serialized = serializeMessage(row, req.user.id);
  req.app.get("io").to(ROOM).emit("message:new", { ...serialized, isMine: undefined });
  res.status(201).json(serialized);
});

router.patch("/messages/:id", requireAuth, (req, res) => {
  const { content } = req.body;
  const row = db.prepare("SELECT * FROM anon_messages WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Message not found" });
  if (row.user_id !== req.user.id) return res.status(403).json({ error: "You can only edit your own messages" });
  if (row.deleted) return res.status(400).json({ error: "Can't edit a deleted message" });
  db.prepare("UPDATE anon_messages SET content = ?, edited_at = datetime('now') WHERE id = ?").run(content.trim(), row.id);
  const updated = serializeMessage(db.prepare("SELECT * FROM anon_messages WHERE id = ?").get(row.id), req.user.id);
  req.app.get("io").to(ROOM).emit("message:update", { ...updated, isMine: undefined });
  res.json(updated);
});

router.delete("/messages/:id", requireAuth, (req, res) => {
  const row = db.prepare("SELECT * FROM anon_messages WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Message not found" });
  if (row.user_id !== req.user.id) return res.status(403).json({ error: "You can only delete your own messages" });
  db.prepare("UPDATE anon_messages SET deleted = 1, content = '' WHERE id = ?").run(row.id);
  req.app.get("io").to(ROOM).emit("message:delete", { id: row.id });
  res.json({ id: row.id, deleted: true });
});

router.post("/messages/:id/react", requireAuth, (req, res) => {
  const { emoji } = req.body;
  if (!emoji) return res.status(400).json({ error: "An emoji is required" });
  const row = db.prepare("SELECT * FROM anon_messages WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Message not found" });
  const existing = db
    .prepare("SELECT id FROM anon_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?")
    .get(row.id, req.user.id, emoji);
  if (existing) {
    db.prepare("DELETE FROM anon_reactions WHERE id = ?").run(existing.id);
  } else {
    db.prepare("INSERT INTO anon_reactions (id, message_id, user_id, emoji) VALUES (?, ?, ?, ?)").run(
      genId("rx"), row.id, req.user.id, emoji
    );
  }
  const updated = serializeMessage(db.prepare("SELECT * FROM anon_messages WHERE id = ?").get(row.id), req.user.id);
  req.app.get("io").to(ROOM).emit("message:update", { ...updated, isMine: undefined });
  res.json(updated);
});

router.post("/messages/:id/report", requireAuth, (req, res) => {
  const row = db.prepare("SELECT * FROM anon_messages WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Message not found" });
  db.prepare("UPDATE anon_messages SET reported = 1 WHERE id = ?").run(row.id);
  res.json({ id: row.id, reported: true });
});

export default router;
