import React, { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../../firebase.js";
import { onAuthStateChanged } from "firebase/auth";

const API = import.meta.env.FIREBASE_API_URL || "http://localhost:5000";

export default function Dashboard() {
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [collections, setCollections] = useState(null);
  const [error, setError] = useState(null);
  const [followState, setFollowState] = useState({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthed(!!user);
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  const loadDashboard = useCallback(async () => {
    setError(null);
    setCollections(null);

    let idToken = sessionStorage.getItem("idToken");
    if (!idToken && auth.currentUser) {
      try {
        idToken = await auth.currentUser.getIdToken();
        sessionStorage.setItem("idToken", idToken);
      } catch (err) {
        console.warn("Failed to get token from current user:", err);
      }
    }

    if (!idToken) {
      setError("No id token available. Please sign in.");
      return;
    }

    setLoadingData(true);
    try {
      const res = await fetch(`${API}/api/dashboard`, {
        method: "GET",
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error || "Failed to load dashboard");
      } else {
        const body = await res.json();
        // Backend returns { success: true, user, collections? } — we keep collections compatible
        setCollections(body.collections || { messages: [], users: [], products: [] });
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      setError("Failed to connect to server");
      // fallback dummy data
      setCollections({
        messages: [
          { id: "m1", from: "alice@example.com", text: "Welcome! Check out our new products." },
          { id: "m2", from: "bob@example.com", text: "Your order has shipped." },
        ],
        users: [
          { id: "u1", name: "Alice", email: "alice@example.com" },
          { id: "u2", name: "Bob", email: "bob@example.com" },
        ],
        products: [
          { id: "p1", title: "Sneaker", price: 79.99 },
          { id: "p2", title: "Handbag", price: 129.99 },
        ],
      });
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!loadingAuth && authed) loadDashboard();
  }, [loadingAuth, authed, loadDashboard]);

  if (loadingAuth) return null;
  if (!authed) return <Navigate to="/login" replace />;

  const handleOpenMessage = (msg) => {
    alert(`From: ${msg.from}\n\n${msg.text}`);
  };

  const toggleFollow = (userId) => {
    setFollowState((s) => ({ ...s, [userId]: !s[userId] }));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {loadingData && <p>Loading data...</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {!loadingData && collections && (
        <div className="space-y-6">
          <section className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold">Messages</h2>
              <button className="text-sm bg-gray-100 px-2 py-1 rounded" onClick={loadDashboard}>
                Refresh
              </button>
            </div>

            {Array.isArray(collections.messages) && collections.messages.length > 0 ? (
              <ul className="space-y-2">
                {collections.messages.map((m) => (
                  <li key={m.id} className="flex justify-between items-center border p-2 rounded">
                    <div>
                      <div className="text-sm font-medium">{m.from}</div>
                      <div className="text-xs text-gray-600 truncate" style={{ maxWidth: 420 }}>
                        {m.text}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded" onClick={() => handleOpenMessage(m)}>
                        Open
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No messages</p>
            )}
          </section>

          <section className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold mb-2">Users</h2>
            {Array.isArray(collections.users) && collections.users.length > 0 ? (
              <ul className="space-y-2">
                {collections.users.map((u) => (
                  <li key={u.id} className="flex justify-between items-center border p-2 rounded">
                    <div>
                      <div className="text-sm font-medium">{u.name || u.email}</div>
                      <div className="text-xs text-gray-600">{u.email}</div>
                    </div>
                    <button
                      className={`text-sm px-3 py-1 rounded ${followState[u.id] ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}
                      onClick={() => toggleFollow(u.id)}
                    >
                      {followState[u.id] ? "Unfollow" : "Follow"}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No users</p>
            )}
          </section>

          {Object.entries(collections)
            .filter(([key]) => !["messages", "users"].includes(key))
            .map(([colName, docs]) => (
              <section key={colName} className="bg-white p-4 rounded shadow">
                <h2 className="font-semibold mb-2">{colName}</h2>
                {Array.isArray(docs) ? (
                  docs.length === 0 ? (
                    <p className="text-sm text-gray-500">No documents</p>
                  ) : (
                    <pre className="text-xs max-h-48 overflow-auto">{JSON.stringify(docs, null, 2)}</pre>
                  )
                ) : (
                  <pre className="text-sm text-red-600">{JSON.stringify(docs, null, 2)}</pre>
                )}
              </section>
            ))}
        </div>
      )}
    </div>
  );
}