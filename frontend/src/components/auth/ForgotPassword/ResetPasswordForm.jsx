import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export function ResetPasswordForm() {
  const { token } = useParams(); // token from URL
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("✅ Password reset successfully!");
        setTimeout(() => navigate("/login"), 3000); // redirect after 3s
      } else {
        setError(data.error || "Failed to reset password.");
      }
    } catch (err) {
      console.error("Reset Password API error:", err);
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white flex items-center justify-center p-4">
      <div className="flex flex-col md:flex-row max-w-5xl w-full overflow-hidden">
        {/* Left side illustration */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-4">
          <img
            src="https://i.pinimg.com/736x/5f/d1/16/5fd116d64b8b7e3cfcb8da7f807ede72.jpg"
            alt="Reset Password Illustration"
            className="w-full h-auto max-h-[500px] object-contain"
          />
        </div>

        {/* Right side form */}
        <form
          onSubmit={handleSubmit}
          className="w-full md:w-1/2 flex flex-col justify-center gap-6 p-6"
        >
          <h1 className="text-4xl md:text-5xl font-bold font-[Inter] leading-tight">
            Reset Password
          </h1>

          <p className="text-lg md:text-xl font-[Inter] text-gray-700 leading-snug">
            Enter your new password below.
          </p>

          <div className="flex flex-col gap-4">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
              className="w-full border-b-2 border-[#8FC854] focus:outline-none text-lg py-2"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm New Password"
              className="w-full border-b-2 border-[#8FC854] focus:outline-none text-lg py-2"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}

          <button
            type="submit"
            disabled={loading || !token}
            className={`bg-[#8FC854] text-white rounded-full px-8 py-2 hover:opacity-90 whitespace-nowrap ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordForm;
