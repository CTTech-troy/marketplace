import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase"; // adjust path if different
import { createUserWithEmailAndPassword } from "firebase/auth";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const API = import.meta.env.FIREBASE_API_URL || "http://localhost:5000";

export default function SignUp({ onSwitch }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Handle normal signup (no Google)
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      // create Firebase user client-side
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      // get ID token to call backend verify endpoint
      const idToken = await userCred.user.getIdToken();

      // ask backend to generate & send 2FA code
      await fetch(`${API}/api/verify`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });

      // store pending data so Verify component can pre-fill / sign-in
      sessionStorage.setItem(
        "pendingVerify",
        JSON.stringify({ email, password })
      );

      // navigate to verify page (user must input code before dashboard)
      navigate("/verify");
    } catch (err) {
      console.error("Signup request error:", err);
      alert(err?.message || "Signup failed");
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
