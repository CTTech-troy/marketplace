const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const signupRoutes = require("./api/signup.js");
const loginRoutes = require("./api/login.js");
const googleAuthRoutes = require("./api/google-auth.js");
const usersRoutes = require("./api/users.js");
const { db, serviceAccount } = require("./firebaseAdmin.js");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/signup", signupRoutes);
app.use("/api/login", loginRoutes);
app.use("/api/google-auth", googleAuthRoutes);
app.use("/api/users", usersRoutes);

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


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
