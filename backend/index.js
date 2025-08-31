// backend/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import authRoutes from "./src/routes/authRoutes.js"; // add .js for ESM
import debugRoutes from './src/routes/debugRoutes.js';

dotenv.config();
const app = express();

// ✅ Setup CORS first with correct options
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000", // Vite default port
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true })); // good for form data

// ✅ Routes
app.use("/auth", authRoutes);
app.use('/debug', debugRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

app.get("/", (req, res) => {
  console.log("✅ Root route hit");
  res.send("🚀 Firebase Auth Server Running");
});

// other routes remain; ensure routes that required Mongo are refactored or removed

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend listening on port ${PORT}`);
});
