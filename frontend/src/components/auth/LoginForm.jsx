// src/components/auth/LoginForm.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../firebase.js";
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { FcGoogle } from "react-icons/fc"; 

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function LoginForm({ onLogin, onToggleForm }) { 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [remember, setRemember] = useState(false); 
  const navigate = useNavigate();

  // ----------------------- Email/Password Login -----------------------
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setError("Your email has not been verified. Please check your inbox for the verification email (OTP).");
        setLoading(false);
        return;
      }

      const idToken = await user.getIdToken();
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem("idToken", idToken);
      storage.setItem(
        "user",
        JSON.stringify({ uid: user.uid, email: user.email, displayName: user.displayName })
      );

      if (onLogin) onLogin({ uid: user.uid, email: user.email, displayName: user.displayName });

      setSuccess("Login successful! Redirecting to your dashboard...");
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err) {
      console.error("Login error:", err);

      // Friendly error messages
      switch (err.code) {
        case "auth/user-not-found":
          setError("No account found with this email. Please sign up first.");
          break;
        case "auth/wrong-password":
          setError("Incorrect password. Please try again or reset your password.");
          break;
        case "auth/invalid-email":
          setError("The email address you entered is invalid.");
          break;
        case "auth/too-many-requests":
          setError("Too many failed login attempts. Please try again later.");
          break;
        default:
          setError("Login failed. Please check your credentials and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ----------------------- Google Login -----------------------
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    setSuccess("");

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();

      const res = await fetch(`${API}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Google login failed");

      const storage = remember ? localStorage : sessionStorage;
      storage.setItem("idToken", idToken);
      storage.setItem(
        "user",
        JSON.stringify({
          email: user.email,
          uid: user.uid,
          firstName: user.displayName?.split(" ")[0],
          lastName: user.displayName?.split(" ").slice(1).join(" "),
        })
      );

      if (onLogin)
        onLogin({
          email: user.email,
          uid: user.uid,
          firstName: user.displayName?.split(" ")[0],
          lastName: user.displayName?.split(" ").slice(1).join(" "),
        });

      setSuccess("Google login successful! Redirecting to your dashboard...");
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err) {
      console.error("Google login failed:", err);
      setError("Google login failed. Please try again or use email and password login.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 p-8 rounded-3xl transition-all duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold mb-2 text-gray-700">Login</h2>
        <p className="text-gray-600">Please enter your details to log in.</p>
      </div>

      {error && (
        <div className="mb-3 bg-red-100 text-red-500 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 border border-[#8FC854] rounded">
          {success}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-[#8FC854] focus:outline-none focus:ring-2 focus:ring-[#8FC854]"
            placeholder="Email Address"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-xs text-gray-600 hover:underline"
            >
              Forgot Password?
            </button>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-[#8FC854] focus:outline-none focus:ring-2 focus:ring-[#8FC854]"
            placeholder="Password"
            required
          />
        </div>

        {/* Remember Me */}
        <div className="flex items-center">
          <input
            id="remember"
            type="checkbox"
            checked={remember}
            onChange={() => setRemember(!remember)}
            className="h-4 w-4 text-[#8FC854] border-[#8FC854] rounded focus:ring-[#8FC854]"
          />
          <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
            Keep me logged in
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#000000] text-white py-3 rounded-lg hover:bg-[#000000] transition-colors disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Signup link */}
        {onToggleForm && (
          <div className="mt-4 text-center text-sm text-gray-600">
            <p className="text-center text-sm text-gray-600 mb-6">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={onToggleForm}
                className="text-[#000000] font-medium hover:underline"
              >
                Create account
              </button>
            </p>
          </div>
        )}
      </form>

      <div className="mt-6">
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#8FC854]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gray-100 text-gray-500">or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 py-3 border border-[#8FC854] rounded-lg hover:bg-[#f8fff3] transition-colors disabled:opacity-50"
        >
          <FcGoogle className="w-5 h-5" />
          <span>{googleLoading ? "Signing in..." : "Sign in with Google"}</span>
        </button>
      </div>
    </div>
  );
}
