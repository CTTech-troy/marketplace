import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebase";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SignUp({ onSignup, onSwitch }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      alert(data.message || "Signup successful. Please login.");
      onSwitch && onSwitch(); // switch to login
    } catch (err) {
      console.error("Signup failed", err);
      alert("Signup failed: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const res = await fetch(`${API}/api/google-auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.exists) {
          alert(data.message || "Account exists. Please login.");
          onSwitch && onSwitch();
          return;
        }
        throw new Error(data.error || "Google signup failed");
      }

      onSignup(data.user);
      alert(data.message || "Signed up with Google");
    } catch (err) {
      console.error("Google signup failed", err);
      alert("Google signup failed: " + (err.message || err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold mb-4 text-center">Sign Up</h2>
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
