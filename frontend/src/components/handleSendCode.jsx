import React, { useState } from "react";

export default function EmailConfirmation() {
  const [step, setStep] = useState("email"); // "email" | "code"
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  const handleSendCode = () => {
    // 🔹 Here you would call your backend to send the code
    setStep("code");
    setMessage("✅ Confirmation code sent to your email.");
  };

  const handleVerifyCode = () => {
    // 🔹 Here you would call your backend to verify the code
    if (code === "123456") {
      setMessage("🎉 Email confirmed successfully!");
    } else {
      setMessage("❌ Invalid confirmation code.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 rounded-2xl shadow-md border bg-white">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Email Confirmation
      </h1>

      {step === "email" && (
        <>
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full border px-3 py-2 rounded mb-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            onClick={handleSendCode}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Send Code
          </button>
        </>
      )}

      {step === "code" && (
        <>
          <input
            type="text"
            placeholder="Enter confirmation code"
            className="w-full border px-3 py-2 rounded mb-4"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button
            onClick={handleVerifyCode}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            Verify Code
          </button>
        </>
      )}

      {message && (
        <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
      )}
    </div>
  );
}
