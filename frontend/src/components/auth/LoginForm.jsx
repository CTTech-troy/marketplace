import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../firebase.js";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Login({ onLogin, onToggleForm }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate(); 

  // 🔹 handle email/password login - FIXED: Correct field name
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Login failed");
        return;
      }

      if (data.idToken) sessionStorage.setItem("idToken", data.idToken);
      if (data.user) sessionStorage.setItem("user", JSON.stringify(data.user));

      if (onLogin) onLogin(data.user || null);

      setSuccess("Login successful! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // 🔹 handle Google login - FIXED: Correct API endpoint
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    setSuccess("");

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();

      // Call our backend to verify the Google token
      const res = await fetch(`${API}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Google login failed");
      }

      sessionStorage.setItem("idToken", data.idToken || idToken);
      sessionStorage.setItem(
        "user",
        JSON.stringify({ email: user.email, uid: user.uid, firstName: user.displayName?.split(' ')[0], lastName: user.displayName?.split(' ').slice(1).join(' ') })
      );

      if (onLogin) onLogin({ 
        email: user.email, 
        uid: user.uid,
        firstName: user.displayName?.split(' ')[0],
        lastName: user.displayName?.split(' ').slice(1).join(' ')
      });

      setSuccess("Google login successful! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err) {
      console.error("Google login failed:", err);
      setError(err?.message || "Google login failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 p-8 rounded-3xl transition-all duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold mb-2">Login</h2>
        <p className="text-gray-600">Please enter your details to log in.</p>
      </div>

      {/* 🔹 Feedback messages */}
      {error && (
        <div className="mb-3 bg-red-100 text-red-500 border border-red-200 rounded" style = {{paddingLeft: '10px', paddingTop: '5px', paddingBottom: '5px'}}>
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 border border-green-400 rounded">
          {success}
        </div>
      )}

      {/* 🔹 Form wired up */}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
            placeholder="Email Address"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <a href="#" className="text-xs text-gray-600 hover:underline">
              Forgot Password?
            </a>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
            placeholder="Password"
            required
          />
        </div>

        <div className="flex items-center">
          <input
            id="remember"
            type="checkbox"
            className="h-4 w-4 text-black border-gray-300 rounded"
          />
          <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
            Keep me logged in
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {/* 🔹 Google login */}
      <div className="mt-6">
        <p className="text-center text-sm text-gray-600 mb-6">
          Don't have an account?{" "}
          <button
            onClick={onToggleForm}
            className="text-black font-medium hover:underline"
          >
            Create account
          </button>
        </p>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gray-100 text-gray-500">
              or continue with
            </span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <span>{googleLoading ? "Signing in..." : "Sign in with Google"}</span>
        </button>
      </div>
    </div>
  );
}