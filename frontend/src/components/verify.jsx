import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase.js";
import { signInWithEmailAndPassword } from "firebase/auth";

const API = import.meta.env.FIREBASE_API_URL || "http://localhost:5000";

export default function Verify2FA() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // prefill credentials saved by signup flow
    const pending = sessionStorage.getItem("pendingVerify");
    if (pending) {
      try {
        const { email: e, password: p } = JSON.parse(pending);
        if (e) setEmail(e);
        if (p) setPassword(p);
      } catch (err) {
        console.error("Failed to parse pendingVerify:", err);
      }
    }
  }, []);

  async function handleVerify(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Acquire idToken:
      // - if we have password (email signup) sign in to get token
      // - otherwise try to use current authenticated user (Google signup)
      let idToken = null;

      if (password) {
        try {
          const uc = await signInWithEmailAndPassword(auth, email, password);
          idToken = await uc.user.getIdToken();
        } catch (err) {
          // fallback: if missing-password or user already signed-in via Google, try currentUser
          if (auth.currentUser) {
            idToken = await auth.currentUser.getIdToken();
          } else {
            console.error("Email sign-in failed:", err);
            alert(err?.message || "Sign-in failed. Please sign in first.");
            setSubmitting(false);
            return;
          }
        }
      } else {
        // no password provided (likely Google signup). Use currentUser
        if (auth.currentUser) {
          idToken = await auth.currentUser.getIdToken();
        } else {
          alert("No password stored. Please sign in with Google first to proceed with verification.");
          setSubmitting(false);
          return;
        }
      }

      // call backend confirm endpoint with idToken + code
      const res = await fetch(`${API}/api/confirm`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      const body = await res.json();
      if (res.ok && body.success) {
        sessionStorage.removeItem("pendingVerify");
        sessionStorage.setItem("idToken", idToken);
        navigate("/dashboard");
      } else {
        // backend returns reason (invalid, expired, etc.)
        alert(body?.error || "Verification failed. Please check the code and try again.");
      }
    } catch (err) {
      console.error("Confirm request failed:", err);
      alert(err?.message || "Confirm request failed. See console.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleVerify} className="w-full max-w-md bg-white p-6 rounded shadow space-y-4">
        <h2 className="text-xl font-bold">Enter verification code</h2>
        <p className="text-sm">We sent a code to: <strong>{email || "your email"}</strong></p>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter verification code"
          required
          className="w-full px-3 py-2 border rounded"
        />

        <button type="submit" disabled={submitting} className="w-full bg-green-600 text-white py-2 rounded">
          {submitting ? "Verifying..." : "Verify"}
        </button>
      </form>
    </div>
  );
}
