import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SignUp({ onToggleForm }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // ✅ Normal Signup - FIXED: Correct API endpoint and payload
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // Call backend signup endpoint directly
      const response = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          firstName: firstName.trim(), 
          lastName: lastName.trim(), 
          email: email.trim(), 
          password 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      // If using email verification, redirect to verification page
      if (data.verificationLink) {
        // In a real app, you would send the verification email
        // For demo, we'll show the link in console and redirect to login
        console.log("Verification link:", data.verificationLink);
        alert("Signup successful! Please check your email for verification. Redirecting to login...");
        onToggleForm();
      } else {
        alert("Signup successful! Redirecting to login...");
        onToggleForm();
      }
    } catch (error) {
      console.error("❌ Signup error:", error);
      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Google Signup - FIXED: Correct API endpoint
  async function handleGoogleSignup() {
    setGoogleLoading(true);
    setError(null);
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();

      const response = await fetch(`${API}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Google signup failed");
      }

      // Store tokens and user data
      if (data.idToken) {
        sessionStorage.setItem("idToken", data.idToken);
        sessionStorage.setItem("user", JSON.stringify({
          uid: data.uid,
          email: data.email
        }));
      }

      alert("Google signup successful! Redirecting to dashboard...");
      navigate("/dashboard");
    } catch (err) {
      console.error("Google signup error:", err);
      setError(err.message || "Google signup failed");
    } finally {
      setGoogleLoading(false);
    }
  }



  return (
    <div className="bg-gray-100 p-8 rounded-3xl transition-all duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold mb-2">Create Account</h2>
      </div>

      {error && (
        <div
          className="mb-3 bg-red-100 text-red-500 border border-red-200 rounded"
          style={{
            paddingLeft: "10px",
            paddingTop: "5px",
            paddingBottom: "5px",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              First name
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
              placeholder="Enter your first name"
              required
            />
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Last name
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
              placeholder="Enter your last name"
              required
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
            placeholder="Enter your email"
            required
          />
        </div>
        <div>
          <label
            htmlFor="createPassword"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <input
            id="createPassword"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
            placeholder="Create Password"
            required
            minLength={6}
          />
          <p className="text-xs text-gray-400 text-right mt-1">
            Must be at least 6 characters
          </p>
        </div>
        <div className="flex items-center">
          <input
            id="terms"
            type="checkbox"
            required
            className="h-4 w-4 text-black border-gray-300 rounded"
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
            I agree with{" "}
            <a href="#" className="font-medium">
              Terms
            </a>{" "}
            and{" "}
            <a href="#" className="font-medium">
              Privacy Policy
            </a>
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gray-100 text-gray-500">OR</span>
          </div>
        </div>
        <button
          onClick={handleGoogleSignup}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <span>{googleLoading ? "Signing up..." : "Sign up with Google"}</span>
        </button>
        <p className="text-center text-sm text-gray-600 mt-2 mb-5">
          Already have an account?{" "}
          <button
            onClick={onToggleForm}
            className="text-black font-medium hover:underline"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}