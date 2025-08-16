import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebase";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Login({ onLogin, onSwitch }) {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      onLogin(data.user);
      alert("Login successful");
    } catch (err) {
      console.error("Login failed", err);
      alert("Login failed: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      console.log("Received ID Token:", idToken.slice ? idToken.slice(0, 40) + "..." : idToken);

      const res = await fetch(`${API}/api/google-auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        // if user exists, backend may return exists flag -> prompt login
        if (data.exists) {
          alert(data.message || "Account exists. Please login.");
          return;
        }
        throw new Error(data.error || "Google auth failed");
      }

      onLogin(data.user);
      alert(data.message || "Signed in with Google");
    } catch (err) {
      console.error("Google login failed", err);
      alert("Google login failed: " + (err.message || err));
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
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            placeholder="Username or email"
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
          <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="my-4 flex items-center">
          <hr className="flex-1" />
          <span className="px-2 text-sm text-gray-500">OR</span>
          <hr className="flex-1" />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full flex items-center justify-center border py-2 rounded hover:bg-gray-50"
        >
          <img src="https://img.icons8.com/color/24/google-logo.png" alt="Google" className="mr-2" />
          {googleLoading ? "Please wait..." : "Continue with Google"}
        </button>

        <p className="mt-4 text-center text-sm">
          Don't have an account?{" "}
          <button onClick={onSwitch} className="text-blue-600">
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}
