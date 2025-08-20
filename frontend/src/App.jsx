import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./components/login";
import Signup from "./components/signup";
import Verify from "./components/verify";
import Dashboard from "./components/Dashboard";
import MessageList from "./components/MessageList";
import ChatPage from "./components/ChatPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/messages" element={<MessageList />} />
      <Route path="/chat/:id" element={<ChatPage />} />
    </Routes>
  );
}
