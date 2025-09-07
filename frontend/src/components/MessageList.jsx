//components/MessageList.jsx

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";

const API = import.meta.env.VITE_FIREBASE_API_URL || "http://localhost:5000";

export default function MessageList() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);

  // 🔑 helper to get auth token
  const getIdToken = async () => {
    const auth = getAuth();
    if (auth.currentUser) {
      try {
        return await auth.currentUser.getIdToken(true);
      } catch (err) {
        console.warn("getIdToken failed", err);
      }
    }
    return null;
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingData(true);
      const idToken = await getIdToken();
      if (!idToken) {
        setError("No ID token available");
        return;
      }

      const res = await fetch(`${API}/api/users`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!res.ok) throw new Error("Failed to fetch users");

      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to fetch user list");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const startChat = (user) => {
    const otherId = user._id || user.id || user.uid;
    if (!otherId) return alert("No recipient id");

    const minimalUser = {
      id: otherId,
      username: user.username || user.displayName || user.name || user.email || otherId,
      avatar: user.profile?.profilePic || user.avatar || user.photoURL || `https://i.pravatar.cc/40?u=${otherId}`,
    };

    // navigate to full-screen ChatPage and pass minimal user info (id, name, avatar)
    navigate(`/chat/user/${encodeURIComponent(otherId)}`, { state: { user: minimalUser } });
  };

  return (
    <div className="w-80 bg-white shadow-md h-screen flex flex-col">
      <div className="p-4 border-b font-bold text-xl">Chats</div>

      <div className="flex-1 overflow-y-auto">
        {loadingData && <div className="p-3 text-gray-500">Loading...</div>}
        {error && <div className="p-3 text-red-500">{error}</div>}

        {users.map((user) => {
          const userId = user.id || user._id;
          const isOnline = user.isOnline; // 👈 backend must return this
          return (
            <div
              key={userId}
              className="flex items-center justify-between p-3 hover:bg-gray-100 cursor-pointer border-b"
              onClick={() => startChat(user)}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={
                      user.profile?.profilePic ||
                      `https://i.pravatar.cc/50?u=${userId}`
                    }
                    alt={user.username}
                    className="w-10 h-10 rounded-full"
                  />
                  {/* ✅ Online/Offline Indicator */}
                  <span
                    className={`absolute bottom-0 left-0 w-3 h-3 rounded-full border-2 border-white ${
                      isOnline ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                </div>
                <div>
                  <div className="font-medium">{user.username}</div>
                  <div className="text-sm text-gray-500 truncate w-40">
                    {user.lastMsg || "No messages yet"}
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-400">{user.time || ""}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// The following Chrome extension code is only valid in extension environments.
// Remove or wrap in a check to avoid errors in standard React apps.
/*
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === "doAsync") {
      return doAsyncWork(message.payload)
        .then(result => ({ ok: true, result }))
        .catch(err => ({ ok: false, error: err.message }));
      // no sendResponse, returning a Promise is allowed
    }
  });
}
*/
