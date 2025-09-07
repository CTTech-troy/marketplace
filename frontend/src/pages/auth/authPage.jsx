import React, { useState } from "react";
import AuthLayout from "../../components/auth/AuthLayout";
import LoginForm from "../../components/auth/LoginForm";
import CreateAccountForm from "../../components/auth/CreateAccountForm";

export default function AuthPage() {
  const [activeForm, setActiveForm] = useState("login");

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-10">
      <div className="w-full max-w-7xl h-[calc(100vh-80px)] bg-white rounded-2xl shadow-lg overflow-hidden">
        <AuthLayout
          // ✅ flip layout when creating account
          darkOnRight={activeForm === "createAccount"}
          leftSideContent={
            activeForm === "login" ? "Welcome!" : "Let's Get Started!"
          }
        >
          {activeForm === "login" ? (
            <LoginForm onToggleForm={() => setActiveForm("createAccount")} />
          ) : (
            <CreateAccountForm onToggleForm={() => setActiveForm("login")} />
          )}
        </AuthLayout>
      </div>
    </div>
  );
}
