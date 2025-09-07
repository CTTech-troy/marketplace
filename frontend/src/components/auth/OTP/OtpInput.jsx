// frontend/src/components/auth/OTP/OtpInput.jsx
import React, { useRef } from "react";

export function OtpInput({ value, onChange }) {
  // ✅ Persist refs across renders
  const inputRefs = useRef([]);

  // ✅ Ensure value always has 4 slots
  const otpValue = Array(4)
    .fill("")
    .map((_, i) => value[i] || "");

  const handleChange = (e, index) => {
    const digit = e.target.value.replace(/[^0-9]/g, "").slice(0, 1);
    const newOtp = [...otpValue];
    newOtp[index] = digit;
    onChange(newOtp);

    // Auto focus next box if digit is entered
    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newOtp = [...otpValue];

      if (otpValue[index]) {
        // Clear current value first
        newOtp[index] = "";
        onChange(newOtp);
      } else if (index > 0) {
        // Move focus left if empty
        inputRefs.current[index - 1]?.focus();
        newOtp[index - 1] = "";
        onChange(newOtp);
      }
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 4);

    if (pastedData) {
      const newOtp = Array(4).fill("");
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      onChange(newOtp);

      // Focus next empty input or blur if filled
      if (pastedData.length < 4) {
        inputRefs.current[pastedData.length]?.focus();
      } else {
        inputRefs.current[3]?.blur();
      }
    }
  };

  return (
    <div className="flex justify-between gap-2">
      {otpValue.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          className="w-12 h-12 md:w-16 md:h-16 text-center text-xl font-bold border border-gray-300 rounded-md focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
}
