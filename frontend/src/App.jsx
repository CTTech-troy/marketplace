import React, { useState } from "react";
import Login from "./components/login";
import Signup from "./components/signup";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [user, setUser] = useState(null);
  const [showSignup, setShowSignup] = useState(false);

  if (!user) {
    return showSignup ? (
      <Signup onSignup={(u) => setUser(u)} onSwitch={() => setShowSignup(false)} />
    ) : (
      <Login onLogin={(u) => setUser(u)} onSwitch={() => setShowSignup(true)} />
    );
  }

  return <Dashboard user={user} />;
}
