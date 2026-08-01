import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";

export default function CrisisChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [quickReplies, setQuickReplies] = useState(["I'm okay, just tired", "I'm struggling today", "I need emergency help"]);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.crisisHistory().then((d) => {
      if (d.history.length === 0) {
        setMessages([{ sender: "bot", message: "Hi, I'm here anytime you need to talk. How are you feeling right now?" }]);
      } else {
        setMessages(d.history);
      }
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    setMessages((m) => [...m, { sender: "user", message: content }]);
    setInput("");
    setQuickReplies([]);
    setBusy(true);
    try {
      const { reply } = await api.crisisMessage(content);
      setMessages((m) => [...m, { sender: "bot", message: reply.text, helplines: reply.helplines }]);
      setQuickReplies(reply.quickReplies || []);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Immediate Help</h2>
        <p>A judgment-free space to talk right now. This isn't a replacement for professional care, but it's here 24/7.</p>
      </div>
      <div className="chat-wrap">
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.sender}`}>
              {m.message}
              {m.helplines && (
                <div>
                  {m.helplines.map((h) => (
                    <div className="helpline-card" key={h.name}>
                      <div className="hl-name">{h.name}</div>
                      <div className="hl-detail">{h.detail}</div>
                      <div className="hl-contact">{h.contact}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {quickReplies.length > 0 && (
            <div className="chat-quick-replies">
              {quickReplies.map((q) => (
                <button key={q} onClick={() => send(q)}>{q}</button>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <form className="chat-input-row" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type how you're feeling..."
            disabled={busy}
          />
          <button type="submit" disabled={busy}>Send</button>
        </form>
      </div>
    </div>
  );
}
