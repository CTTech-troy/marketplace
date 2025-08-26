require('dotenv').config(); // must be first
const express = require("express");
const cors = require("cors");
const path = require("path");
const signupRoutes = require("./api/signup.js");
const loginRoutes = require("./api/login.js");
const googleAuthRoutes = require("./api/google-auth.js");
const usersRoutes = require("./api/users.js");
const { db, serviceAccount, auth: adminAuth } = require("./firebaseAdmin.js");

const app = express();

// parse JSON and form bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// enable CORS for dev and production origins (adjust as needed)
app.use(cors());

// mount API routers (ensure filenames match your /api files)
const signupRouter = require("./api/signup");
const loginRouter = require("./api/login");
const verifyRouter = require("./api/verify");
const usersRouter = require("./api/users");
const dashboardRouter = require("./api/dashboard");
const chatRouter = require("./api/chat");
const productsRouter = require("./api/products");
const commentsRouter = require("./api/comments");
const confirmRouter = require("./api/confirm");
const userProfileRouter = require("./api/userprofile"); // import user profile router
// add other routers as needed...

app.use("/api/signup", signupRouter);
app.use("/api/login", loginRouter);
app.use("/api/verify", verifyRouter);
app.use("/api/users", usersRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/chats", require("./api/chat.js"));
app.use("/api/products", productsRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/confirm", confirmRouter);
app.use ("/api/userprofile", userProfileRouter)
// notifications API
app.use("/api/notifications", require("./api/notifications.js"));

// Health endpoint to check Firestore connectivity
app.get("/api/_health", async (req, res) => {
  try {
    // try a simple read that should always work (non-existent doc retrieval)
    await db.doc("health/check").get();
    res.json({ status: "ok", firestore: true });
  } catch (err) {
    console.error("Health check Firestore error:", err);
    res.status(500).json({ status: "error", firestore: false, details: err.message });
  }
});

// Debug endpoint — do not expose in production
app.get('/api/_debug', async (req, res) => {
  try {
    // Show the loaded service account project_id (masked)
    const projectId = serviceAccount && serviceAccount.project_id ? serviceAccount.project_id : null;
    // Try a simple Firestore op
    let firestoreOk = true;
    let firestoreError = null;
    try {
      await db.doc('debug/ping').get();
    } catch (err) {
      firestoreOk = false;
      firestoreError = err.message || String(err);
    }

    res.json({
      projectId,
      firestoreOk,
      firestoreError
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get("/", (req, res) => {
  res.send(`
    <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;font-size:2rem;">
      🟢 Backend Server Running
      <div style="text-align:center;margin-top:20px;">
        Visit <a href="/api/signup">/api/signup</a> to test signup
      </div>
      <div style="text-align:center;margin-top:10px;">
        Visit <a href="/api/login">/api/login</a> to test login
      </div>
      <div style="text-align:center;margin-top:10px;">
        Visit <a href="/api/google_auth">/api/google_auth</a> for Google authentication
      </div>
      <div style="text-align:center;margin-top:10px;">
        Visit <a href="/api/dashboard.js">/api/dashboard.js</a> to fetch user details
      </div>
    </div>
  `);
});

// Catch-all 404 handler with details
app.use((req, res) => {
  res.status(404).send(`
    <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;font-size:2rem;color:red;">
      ❌ Error: Page not found<br>
      <span style="font-size:1rem;">Reason: No route matches [${req.method}] ${req.originalUrl}</span>
    </div>
  `);
});
// 🔹 Test Firestore connection once at startup
(async () => {
  try {
    const testDoc = db.collection("test").doc("ping");
    await testDoc.set({ alive: true, timestamp: new Date() });
    console.log("✅ Firestore write success");
  } catch (err) {
    console.error("❌ Firestore test failed:", err.message);
  }
})();

const http = require("http");
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server, {
  cors: { origin: "*" },
});

// simple presence map uid -> Set(socketId)
const presence = new Map();

function setUserOnline(uid, socketId) {
  const set = presence.get(uid) || new Set();
  set.add(socketId);
  presence.set(uid, set);
  io.emit("presence:update", { uid, online: true });
}

function setUserOffline(uid, socketId) {
  const set = presence.get(uid);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) {
    presence.delete(uid);
    io.emit("presence:update", { uid, online: false });
  } else {
    presence.set(uid, set);
  }
}

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("authenticate", async ({ token }) => {
    try {
      if (!token) return;
      const decoded = await adminAuth.verifyIdToken(token);
      const uid = decoded.uid;
      socket.data.uid = uid;
      socket.join(`user:${uid}`);
      setUserOnline(uid, socket.id);
      socket.emit("presence:initial", { uid, online: true });
    } catch (err) {
      console.warn("Socket auth failed:", err);
      socket.emit("authenticate:error", { error: String(err) });
    }
  });

  socket.on("join:chat", ({ chatId }) => {
    if (!chatId) return;
    socket.join(`chat:${chatId}`);
  });

  socket.on("leave:chat", ({ chatId }) => {
    if (!chatId) return;
    socket.leave(`chat:${chatId}`);
  });

  socket.on("typing", ({ chatId, typing }) => {
    if (!chatId) return;
    socket.to(`chat:${chatId}`).emit("typing", { chatId, uid: socket.data.uid, typing });
  });

  socket.on("disconnect", () => {
    const uid = socket.data.uid;
    if (uid) setUserOffline(uid, socket.id);
  });
});

// expose io to routes
app.set("io", io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});