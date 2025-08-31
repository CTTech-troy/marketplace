// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/auth/authPage"
// import Signup from "./components/Signup";
import Verify from "./components/Verify";
import Dashboard from "./components/Dashboard";
import ChatLayout from "./pages/ChatLayout";   
import UserProfile from "./components/UserProfile"; 

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Auth />} />
      {/* <Route path="/signup" element={<Signup />} /> */}
      <Route path="/verify/:token" element={<Verify />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Full Chat UI */}
      <Route path="/chat/*" element={<ChatLayout />} />

      {/* User Profile */}
      <Route path="/user/:userId" element={<UserProfile />} />
    </Routes>
  );
}
