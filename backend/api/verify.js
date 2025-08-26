// api/verify.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

// Load the HTML template once
const templatePath = path.join(__dirname, "templates", "2fa.html");
let htmlTemplate = fs.readFileSync(templatePath, "utf-8");

// load env from backend .env so verify.js can read SMTP and other vars
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const authenticate = require("../middleware/auth");
const { admin, db } = require("../firebaseAdmin");
const nodemailer = require("nodemailer");

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

async function sendEmail(to, subject, htmlContent) {
  // read env values (loaded above)
  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const SMTP_SECURE = process.env.SMTP_SECURE === "true";
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

  // if explicit SMTP host provided, use it
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT || 587,
      secure: SMTP_SECURE === true, // true for 465, false for other ports
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    try {
      await transporter.verify();
      const info = await transporter.sendMail({ from: SMTP_FROM, to, subject, html: htmlContent });
      console.log(`[verify] Email sent to ${to}. messageId=${info.messageId}`);
      return { ok: true, provider: "smtp", info };
    } catch (err) {
      console.error(`[verify] SMTP send failed for ${to}:`, err && (err.stack || err.message || err));
      return { ok: false, provider: "smtp", error: err && (err.stack || err.message || err) };
    }
  }

  // fallback: if Gmail creds present, try nodemailer 'gmail' service (requires app password)
  if (!SMTP_HOST && SMTP_USER && SMTP_PASS && SMTP_USER.includes("@gmail.com")) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });
      await transporter.verify();
      const info = await transporter.sendMail({ from: SMTP_FROM, to, subject, html: htmlContent });
      console.log(`[verify] Email sent via Gmail service to ${to}. messageId=${info.messageId}`);
      return { ok: true, provider: "gmail", info };
    } catch (err) {
      console.error(`[verify] Gmail send failed for ${to}:`, err && (err.stack || err.message || err));
      // continue to Ethereal fallback
    }
  }

  // Last-resort: Ethereal test account (developer preview only)
  try {
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    const info = await transporter.sendMail({ from: testAccount.user, to, subject, html: htmlContent });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[verify] Sent using Ethereal. Preview URL: ${previewUrl}`);
    return { ok: true, provider: "ethereal", info, previewUrl };
  } catch (err) {
    console.error(`[verify] Ethereal fallback failed for ${to}:`, err && (err.stack || err.message || err));
    return { ok: false, provider: "none", error: err && (err.stack || err.message || err) };
  }
}

router.post("/", authenticate, async (req, res) => {
  try {
    const uid = req.user.uid;
    const email = req.user.email;
    if (!email) {
      console.log(`[verify] No email available for uid=${uid} — cannot send code`);
      return res.status(400).json({ error: "User email not available" });
    }

    const code = generateCode();
    const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)); // 10 minutes

    await db.collection("users").doc(uid).set(
      { verificationCode: code, verificationExpires: expiresAt },
      { merge: true }
    );

    // Replace placeholders with dynamic content AFTER code is generated
    const finalHtml = htmlTemplate
      .replace("{{CODE}}", code)
      .replace("{{EXPIRY}}", "10 minutes");

    const emailResult = await sendEmail(
      email,
      "Your 2FA verification code",
      finalHtml
    );

    if (emailResult.ok) {
      if (emailResult.provider === "ethereal" && emailResult.previewUrl) {
        console.log(`[verify] Code for uid=${uid} sent via Ethereal preview: ${emailResult.previewUrl}`);
      } else {
        console.log(`[verify] Code for uid=${uid} successfully sent to ${email}`);
      }
    } else {
      console.log(`[verify] Code for uid=${uid} NOT sent to ${email}. Reason:`, emailResult.error);
    }

    return res.json({
      success: true,
      message: "Verification code generated.",
      emailSent: !!emailResult.ok,
      provider: emailResult.provider,
      previewUrl: emailResult.previewUrl || undefined,
      error: emailResult.error ? String(emailResult.error) : undefined,
    });
  } catch (err) {
    console.error("verify error:", err && (err.stack || err));
    const msg = err && err.message ? err.message : String(err);
    if (msg.includes("PERMISSION_DENIED")) {
      return res.status(503).json({
        error:
          "Cloud Firestore API disabled for project. Enable it in GCP console: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=marketplace-bf706",
      });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
