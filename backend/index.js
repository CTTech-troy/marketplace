import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import walletRoutes from "./src/routes/walletRoutes.js";

dotenv.config();

const app = express();

// ✅ CORS Setup - allow local dev ports + production URL from .env
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL // for production deployment
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`❌ CORS blocked request from: ${origin}`);
        callback(new Error("CORS not allowed for this origin: " + origin));
      }
    },
    credentials: true, // required if you use cookies / auth tokens
  })
);

app.use(express.json());

// ==================== ROUTES ====================

// Auth API
app.use("/api/auth", authRoutes);

// User API
app.use("/api/users", userRoutes);

// Wallet API
app.use("/api/wallet", walletRoutes);

// ==================== ROOT ROUTE ====================
app.get("/", (req, res) => {
  res.send(`
    <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-10 font-sans">
      <h1 class="text-4xl font-bold text-gray-800 mb-8">API Documentation</h1>

      <!-- POST API Section -->
      <section class="w-full max-w-5xl bg-white shadow-lg rounded-lg p-6 mb-10">
        <h2 class="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">POST API Endpoints</h2>
        <table class="w-full border border-gray-300 border-collapse text-gray-700">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-300 px-4 py-2 text-left">Endpoint</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Method</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr class="hover:bg-gray-50">
              <td class="border border-gray-300 px-4 py-2">/api/auth/signup</td>
              <td class="border border-gray-300 px-4 py-2 font-medium text-blue-600">POST</td>
              <td class="border border-gray-300 px-4 py-2">Email/password signup with OTP</td>
            </tr>
            <tr class="hover:bg-gray-50">
              <td class="border border-gray-300 px-4 py-2">/api/auth/verify-otp</td>
              <td class="border border-gray-300 px-4 py-2 font-medium text-blue-600">POST</td>
              <td class="border border-gray-300 px-4 py-2">Verify OTP from email</td>
            </tr>
            <tr class="hover:bg-gray-50">
              <td class="border border-gray-300 px-4 py-2">/api/auth/resend-otp</td>
              <td class="border border-gray-300 px-4 py-2 font-medium text-blue-600">POST</td>
              <td class="border border-gray-300 px-4 py-2">Resend OTP</td>
            </tr>
            <tr class="hover:bg-gray-50">
              <td class="border border-gray-300 px-4 py-2">/api/auth/forgot-password</td>
              <td class="border border-gray-300 px-4 py-2 font-medium text-blue-600">POST</td>
              <td class="border border-gray-300 px-4 py-2">Sends password reset link via email</td>
            </tr>
            <tr class="hover:bg-gray-50">
              <td class="border border-gray-300 px-4 py-2">/api/auth/reset-password</td>
              <td class="border border-gray-300 px-4 py-2 font-medium text-blue-600">POST</td>
              <td class="border border-gray-300 px-4 py-2">Resets password using token</td>
            </tr>
            <tr class="hover:bg-gray-50">
              <td class="border border-gray-300 px-4 py-2">/api/auth/login</td>
              <td class="border border-gray-300 px-4 py-2 font-medium text-blue-600">POST</td>
              <td class="border border-gray-300 px-4 py-2">Email/password login</td>
            </tr>
            <tr class="hover:bg-gray-50">
              <td class="border border-gray-300 px-4 py-2">/api/auth/google</td>
              <td class="border border-gray-300 px-4 py-2 font-medium text-blue-600">POST</td>
              <td class="border border-gray-300 px-4 py-2">Google signup/login</td>
            </tr>
            <tr class="hover:bg-gray-50">
              <td class="border border-gray-300 px-4 py-2">/api/wallet/fund</td>
              <td class="border border-gray-300 px-4 py-2 font-medium text-blue-600">POST</td>
              <td class="border border-gray-300 px-4 py-2">Initialize wallet funding via Monnify</td>
            </tr>
            <tr class="hover:bg-gray-50">
              <td class="border border-gray-300 px-4 py-2">/api/wallet/verify</td>
              <td class="border border-gray-300 px-4 py-2 font-medium text-blue-600">POST</td>
              <td class="border border-gray-300 px-4 py-2">Verify Monnify payment and credit wallet</td>
            </tr>
            <tr class="hover:bg-gray-50">
              <td class="border border-gray-300 px-4 py-2">/api/wallet/credit</td>
              <td class="border border-gray-300 px-4 py-2 font-medium text-blue-600">POST</td>
              <td class="border border-gray-300 px-4 py-2">Manually credit wallet (admin only)</td>
            </tr>
            <tr class="hover:bg-gray-50">
              <td class="border border-gray-300 px-4 py-2">/api/wallet/debit</td>
              <td class="border border-gray-300 px-4 py-2 font-medium text-blue-600">POST</td>
              <td class="border border-gray-300 px-4 py-2">Debit wallet for a purchase</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- GET API Section -->
      <section class="w-full max-w-5xl bg-white shadow-lg rounded-lg p-6">
        <h2 class="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">GET API Endpoints</h2>
        <table class="w-full border border-gray-300 border-collapse text-gray-700">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-300 px-4 py-2 text-left">Endpoint</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Method</th>
              <th class="border border-gray-300 px-4 py-2 text-left">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr class="hover:bg-gray-50">
              <td class="border border-gray-300 px-4 py-2">/api/users</td>
              <td class="border border-gray-300 px-4 py-2 font-medium text-green-600">GET</td>
              <td class="border border-gray-300 px-4 py-2">Get all users</td>
            </tr>
            <tr class="hover:bg-gray-50">
              <td class="border border-gray-300 px-4 py-2">/api/users/:id</td>
              <td class="border border-gray-300 px-4 py-2 font-medium text-green-600">GET</td>
              <td class="border border-gray-300 px-4 py-2">Get user by ID</td>
            </tr>
            <tr class="hover:bg-gray-50">
              <td class="border border-gray-300 px-4 py-2">/api/wallet</td>
              <td class="border border-gray-300 px-4 py-2 font-medium text-green-600">GET</td>
              <td class="border border-gray-300 px-4 py-2">Get wallet balance</td>
            </tr>
            <tr class="hover:bg-gray-50">
              <td class="border border-gray-300 px-4 py-2">/api/wallet/transactions</td>
              <td class="border border-gray-300 px-4 py-2 font-medium text-green-600">GET</td>
              <td class="border border-gray-300 px-4 py-2">Get wallet transaction history</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  `);
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal Server Error" });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
