import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { api, getToken } from "../api.js";

const EMOJIS = ["🤍", "🫂", "💪", "🙏", "😢"];

export default function AnonymousChat() {
  const [identity, setIdentity] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [pickerFor, setPickerFor] = useState(null);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    async function init() {
      const [idn, msgs] = await Promise.all([api.anonIdentity(), api.anonMessages()]);
      setIdentity(idn);
      setMessages(msgs.messages);
    }
    init();

    const socket = io("/", { auth: { token: getToken() }, path: "/socket.io" });
    socketRef.current = socket;
    socket.on("message:new", (msg) => {
      setMessages((prev) => [...prev, { ...msg, isMine: false }]);
    });
    socket.on("message:update", (msg) => {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...msg, isMine: m.isMine } : m)));
    });
    socket.on("message:delete", ({ id }) => {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, deleted: true, content: "[message deleted]" } : m)));
    });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function findMessage(id) {
    return messages.find((m) => m.id === id);
  }

  async function handleSend(e) {
    e.preventDefault();
    const content = input.trim();
    if (!content) return;
    if (editingId) {
      const updated = await api.anonEdit(editingId, content);
      setMessages((prev) => prev.map((m) => (m.id === editingId ? { ...updated, isMine: true } : m)));
      setEditingId(null);
    } else {
      const created = await api.anonSend(content, replyTo?.id);
      setMessages((prev) => [...prev, { ...created, isMine: true }]);
      setReplyTo(null);
    }
    setInput("");
  }

  async function handleDelete(id) {
    await api.anonDelete(id);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, deleted: true, content: "[message deleted]" } : m)));
  }

  function handleEdit(msg) {
    setEditingId(msg.id);
    setInput(msg.content);
    setReplyTo(null);
  }

  async function handleReact(id, emoji) {
    const updated = await api.anonReact(id, emoji);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...updated, isMine: m.isMine } : m)));
    setPickerFor(null);
  }

  async function handleReport(id) {
    await api.anonReport(id);
    setPickerFor(null);
  }

  if (!identity) return <div className="loading-state">Joining the space...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Bloom Space</h2>
        <p>Talk to others who understand, without anyone knowing it's you.</p>
      </div>
      <div className="anon-alias-banner">
        You're posting as <strong>{identity.alias}</strong> — no one can see your real name here.
      </div>
      <div className="chat-wrap">
        <div className="chat-messages">
          {messages.length === 0 && <div className="empty-state">No messages yet. Be the first to say hello.</div>}
          {messages.map((m) => {
            const replySource = m.replyToId ? findMessage(m.replyToId) : null;
            return (
              <div key={m.id} className={`anon-msg ${m.isMine ? "mine" : ""}`}>
                <div className="anon-msg-meta">
                  {m.deleted ? "" : m.alias} · {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {m.editedAt && !m.deleted ? " · edited" : ""}
                </div>
                {replySource && !m.deleted && (
                  <div className="anon-reply-preview">
                    Replying to {replySource.deleted ? "[deleted]" : `${replySource.alias}: ${replySource.content?.slice(0, 60)}`}
                  </div>
                )}
                <div className={`chat-bubble ${m.isMine ? "user" : "bot"}`}>
                  {m.deleted ? <span className="deleted-msg">message deleted</span> : m.content}
                </div>
                {!m.deleted && m.reactions?.length > 0 && (
                  <div className="reactions-row">
                    {m.reactions.map((r) => (
                      <button
                        key={r.emoji}
                        className={`reaction-chip ${m.myReactions?.includes(r.emoji) ? "mine" : ""}`}
                        onClick={() => handleReact(m.id, r.emoji)}
                      >
                        {r.emoji} {r.count}
                      </button>
                    ))}
                  </div>
                )}
                {!m.deleted && (
                  <div className="anon-msg-actions">
                    <button onClick={() => setReplyTo(m)}>Reply</button>
                    <button onClick={() => setPickerFor(pickerFor === m.id ? null : m.id)}>React</button>
                    {m.isMine ? (
                      <>
                        <button onClick={() => handleEdit(m)}>Edit</button>
                        <button onClick={() => handleDelete(m.id)}>Delete</button>
                      </>
                    ) : (
                      <button onClick={() => handleReport(m.id)}>Report</button>
                    )}
                  </div>
                )}
                {pickerFor === m.id && (
                  <div className="reaction-picker">
                    {EMOJIS.map((e) => (
                      <button key={e} onClick={() => handleReact(m.id, e)}>{e}</button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <form className="chat-input-row" onSubmit={handleSend} style={{ flexDirection: "column", gap: 8 }}>
          {(replyTo || editingId) && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ink-soft)", padding: "0 6px" }}>
              <span>
                {editingId ? "Editing your message" : `Replying to ${replyTo?.alias}`}
              </span>
              <button
                type="button"
                style={{ background: "none", border: "none", color: "var(--rose)" }}
                onClick={() => { setReplyTo(null); setEditingId(null); setInput(""); }}
              >
                Cancel
              </button>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, width: "100%" }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Share what's on your mind..." />
            <button type="submit">{editingId ? "Save" : "Send"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
