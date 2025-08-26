import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase.js";
// changed: use Firebase auth create/update functions
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// changed: ensure API constant and clearer default
const API = import.meta.env.VITE_FIREBASE_API_URL || "http://localhost:5000";

export default function SignUp({ onSwitch }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // ✅ Handle normal signup (no Google)
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // short-circuit if required fields missing
    if (!username.trim() || !email.trim() || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      // 1) Create Firebase auth user
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = cred.user;

      // 2) Set display name (username)
      try {
        await updateProfile(user, { displayName: username.trim() });
      } catch (updErr) {
        console.warn("updateProfile failed:", updErr);
      }

      // 3) Inform backend (optional)
      try {
        const idToken = await user.getIdToken(true);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(`${API}/api/signup`, {
          method: "POST",
          mode: "cors",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: username.trim(), email: email.trim() }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          console.warn("Backend signup returned non-OK:", body);
        } else {
          console.log("Backend signup succeeded");
        }
      } catch (backendErr) {
        console.warn("Backend signup failed (non-fatal):", backendErr);
      }

      // navigate to verify page so user can enter verification code
      // prefer route with uid so verify page can look up user or pre-fill email
      navigate(`/verify/${user.uid}`);
    } catch (err) {
      console.error("Signup request error:", err);
      const msg =
        (err?.code && err.code.replace("auth/", "").replace(/-/g, " ")) ||
        err.message ||
        "Signup failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // ✅ Handle Google signup but skip if Firestore API is disabled
  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();

      // ask backend to generate & send 2FA code
      await fetch(`${API}/api/verify`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      // store pending so Verify can continue if needed
      sessionStorage.setItem("pendingVerify", JSON.stringify({ email: user.email || "" }));
      navigate("/verify");
    } catch (err) {
      console.error("Google signup error:", err);
      alert(err?.message || "Google signup failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold mb-4 text-center">Sign Up</h2>

        {/* Normal Email Signup */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
            className="w-full px-3 py-2 border rounded"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            required
            className="w-full px-3 py-2 border rounded"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            required
            className="w-full px-3 py-2 border rounded"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded"
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <div className="my-4 flex items-center">
          <hr className="flex-1" />
          <span className="px-2 text-sm text-gray-500">OR</span>
          <hr className="flex-1" />
        </div>

        {/* Google Signup */}
        <button
          onClick={handleGoogleSignup}
          disabled={googleLoading}
          className="w-full flex items-center justify-center border py-2 rounded hover:bg-gray-50"
        >
          <img
            src="https://img.icons8.com/color/24/google-logo.png"
            alt="Google"
            className="mr-2"
          />
          {googleLoading ? "Please wait..." : "Continue with Google"}
        </button>

        <p className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <button onClick={onSwitch} className="text-blue-600">
            Login
          </button>
        </p>
      </div>
    </div>
  );
}
