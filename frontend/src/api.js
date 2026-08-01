// frontend/src/api.js — replace whole file
const BASE = "/api";

function getToken() {
  return localStorage.getItem("thanal_token");
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

export const api = {
  registerMom: (payload) => request("/auth/register/mom", { method: "POST", body: payload, auth: false }),
  registerFamily: (payload) => request("/auth/register/family", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload, auth: false }),
  me: () => request("/auth/me"),

  epdsItems: () => request("/epds/items"),
  epdsSubmit: (answers) => request("/epds/submit", { method: "POST", body: { answers } }),
  epdsMine: () => request("/epds/mine"),
  epdsFamily: (momId) => request(`/epds/family/${momId}`),
  epdsFamilySummary: (momId) => request(`/epds/family/${momId}/summary`),
  checkin: (payload) => request("/epds/checkin", { method: "POST", body: payload }),
  checkinsMine: () => request("/epds/checkins/mine"),

  crisisMessage: (message) => request("/crisis/message", { method: "POST", body: { message } }),
  crisisHistory: () => request("/crisis/history"),

  nurseScan: (mood, confidence) => request("/nurse/scan", { method: "POST", body: { mood, confidence } }),
  nurseHistory: () => request("/nurse/history"),
  nurseFamily: (momId) => request(`/nurse/family/${momId}`),

  helplines: () => request("/helplines", { auth: false }),

  anonIdentity: () => request("/chat/identity"),
  anonMessages: () => request("/chat/messages"),
  anonSend: (content, replyToId) => request("/chat/messages", { method: "POST", body: { content, replyToId } }),
  anonEdit: (id, content) => request(`/chat/messages/${id}`, { method: "PATCH", body: { content } }),
  anonDelete: (id) => request(`/chat/messages/${id}`, { method: "DELETE" }),
  anonReact: (id, emoji) => request(`/chat/messages/${id}/react`, { method: "POST", body: { emoji } }),
  anonReport: (id) => request(`/chat/messages/${id}/report`, { method: "POST" }),
};

export { getToken };