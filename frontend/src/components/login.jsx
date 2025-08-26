import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase.js";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const API = import.meta.env.FIREBASE_API_URL || "http://localhost:5000";

export default function Login({ onLogin, onSwitch }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });

      const body = await res.json();
      if (!res.ok) {
        alert(body?.error || "Login failed");
        return;
      }

      if (body.idToken) sessionStorage.setItem("idToken", body.idToken);
      if (body.user) sessionStorage.setItem("user", JSON.stringify(body.user));

      if (onLogin) onLogin(body.user || null);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed. See console for details.");
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();

      // store token and basic user info
      sessionStorage.setItem("idToken", idToken);
      sessionStorage.setItem("user", JSON.stringify({ email: user.email, uid: user.uid }));

      // navigate straight to dashboard (signup flow handles /verify)
      if (onLogin) onLogin({ email: user.email, uid: user.uid });
      navigate("/dashboard");
    } catch (err) {
      console.error("Google login failed:", err);
      alert(err?.message || "Google login failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Email or phone"
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
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="my-4 flex items-center">
          <hr className="flex-1" />
          <span className="px-2 text-sm text-gray-500">OR</span>
          <hr className="flex-1" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full flex items-center justify-center border py-2 rounded hover:bg-gray-50"
        >
          <img src="https://img.icons8.com/color/24/google-logo.png" alt="Google" className="mr-2" />
          {googleLoading ? "Please wait..." : "Continue with Google"}
        </button>

        <p className="mt-4 text-center text-sm">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => {
              if (onSwitch) return onSwitch();
              navigate("/signup");
            }}
            className="text-blue-600"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}
