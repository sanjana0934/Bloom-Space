import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import authRoutes from "./routes/auth.js";
import epdsRoutes from "./routes/epds.js";
import crisisRoutes from "./routes/crisis.js";
import chatRoutes from "./routes/chat.js";
import nurseRoutes from "./routes/nurse.js";
import { JWT_SECRET } from "./middleware/auth.js";
import { HELPLINES } from "./data/helplines.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.set("io", io);
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "bloom-backend" }));
app.get("/api/helplines", (req, res) => res.json({ helplines: HELPLINES }));

app.use("/api/auth", authRoutes);
app.use("/api/epds", epdsRoutes);
app.use("/api/crisis", crisisRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/nurse", nurseRoutes);

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Not authenticated"));
    socket.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    next(new Error("Invalid session"));
  }
});

io.on("connection", (socket) => {
  socket.join("general");
  socket.on("disconnect", () => {});
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on our end" });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Bloom backend running on http://localhost:${PORT}`);
});