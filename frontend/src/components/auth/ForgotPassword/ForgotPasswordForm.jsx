import React, { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // API base URL from environment (fallback to local backend)
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("✅ Password reset link sent! Check your email.");
        setEmail(""); // clear input
      } else {
        setError(data.error || "Failed to send password reset link.");
      }
    } catch (err) {
      console.error("❌ Forgot Password API error:", err);
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white flex items-center justify-center p-4">
      <div className="flex flex-col md:flex-row max-w-5xl w-full overflow-hidden">
        {/* Left side - Illustration */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-4">
          <img
            src="../../../assets/fog.jpg"
            alt="Forgot Password Illustration"
            className="w-full h-auto max-h-[500px] object-contain"
          />
        </div>

        {/* Right side - Form */}
        <form
          onSubmit={handleSubmit}
          className="w-full md:w-1/2 flex flex-col justify-center gap-6 p-6"
        >
          <h1 className="text-4xl md:text-5xl font-bold font-[Inter] leading-tight">
            Forgot Password?
          </h1>

          <p className="text-lg md:text-xl font-[Inter] text-gray-700 leading-snug">
            Enter the email address associated with this account.
          </p>

          <div className="flex flex-col gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full border-b-2 border-[#8FC854] focus:outline-none text-lg py-2"
            />
          </div>

          {/* Show errors or success messages */}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}

          <div className="flex flex-row flex-nowrap items-center justify-between gap-4">
            <button
              type="button"
              className="font-[Inter] font-medium text-lg text-gray-600 hover:text-gray-800"
              onClick={() => alert("Alternate recovery flow goes here.")}
            >
              Try another way
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`bg-[#8FC854] text-white rounded-full px-8 py-2 hover:opacity-90 whitespace-nowrap ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Checking..." : "Next"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ForgotPasswordForm;
