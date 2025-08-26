// src/components/ChatPage.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../../firebase.js";
import { io } from "socket.io-client";

const API = import.meta.env.VITE_FIREBASE_API_URL || "http://localhost:5000";
const SOCKET_URL = import.meta.env.VITE_FIREBASE_API_URL || "http://localhost:5000";

export default function ChatPage() {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // support routes: /chat/:chatId  or /chat/user/:otherId
  const routeChatId = params.chatId || null;
  const routeOtherId = params.otherId || null;
  const passedUser = location.state?.user || null;

  const [chatId, setChatId] = useState(routeChatId);
  const [otherUser, setOtherUser] = useState(passedUser);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [typingRemote, setTypingRemote] = useState(false);

  const socketRef = useRef(null);
  const endRef = useRef(null);
  const pollRef = useRef(null);

  const scrollToBottom = useCallback((smooth = true) => {
    try {
      endRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    } catch (err) {
      // ignore scroll errors but reference err to avoid lint warnings
      void err;
    }
  }, []);

  const getIdToken = useCallback(async () => {
    if (auth.currentUser) {
      try {
        return await auth.currentUser.getIdToken(true);
      } catch (err) {
        console.warn("getIdToken failed", err);
      }
    }
    return null;
  }, []);

  // If routeOtherId present, create/open chat on load (server returns chatId)
  useEffect(() => {
    let mounted = true;
    const ensureChat = async () => {
      if (chatId) return;
      if (!routeOtherId) return;

      try {
        const token = await getIdToken();
        const senderId = auth.currentUser?.uid;
        if (!senderId) {
          navigate("/login");
          return;
        }

        const res = await fetch(`${API}/api/chats`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ uid: senderId, otherId: routeOtherId }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Failed to open chat");
        if (!mounted) return;
        const cid = body.chatId || (body.chat && body.chat.id) || routeOtherId;
        setChatId(cid);
      } catch (err) {
        console.error("ensureChat error:", err);
      }
    };
    ensureChat();
    return () => {
      mounted = false;
    };
  }, [routeOtherId, chatId, getIdToken, navigate]);

  // Fetch other user info if not passed (minimal)
  useEffect(() => {
    if (otherUser || !routeOtherId) return;
    (async () => {
      try {
        const token = await getIdToken();
        const res = await fetch(`${API}/api/users/${encodeURIComponent(routeOtherId)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const body = await res.json();
        setOtherUser(body.user || {
          id: routeOtherId,
          username: body.user?.username || routeOtherId,
          avatar: body.user?.avatar || `https://i.pravatar.cc/40?u=${routeOtherId}`
        });
      } catch (err) {
        console.warn("Failed to fetch other user", err);
        setOtherUser({ id: routeOtherId, username: routeOtherId, avatar: `https://i.pravatar.cc/40?u=${routeOtherId}` });
      }
    })();
  }, [routeOtherId, otherUser, getIdToken]);

  // main effect: attach socket listeners immediately, show cache, then fetch canonical messages
  useEffect(() => {
    if (!chatId) return;
    let mounted = true;
    let controller = new AbortController();
    const cacheKey = `chat_${chatId}_messages`;

    // Ensure socket exists and listeners attached first (real-time feel)
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, { transports: ["websocket"], autoConnect: true });
    }
    const socket = socketRef.current;

    const onConnect = async () => {
      try {
        const token = await getIdToken();
        socket.emit("authenticate", { token });
        socket.emit("join:chat", { chatId });
      } catch (err) {
        console.warn("socket onConnect error", err);
      }
    };

    // incoming message handler: append if not duplicate
    const onMessage = (m) => {
      if (!mounted) return;
      if (!m) return;
      if (m.chatId && m.chatId !== chatId) return;
      setMessages((prev) => {
        const exists = prev.some((x) => x.id && m.id && x.id === m.id);
        if (exists) return prev;
        const next = [...prev, m];
        try { sessionStorage.setItem(cacheKey, JSON.stringify(next)); } catch (err) { void err; }
        return next;
      });
      setTimeout(() => scrollToBottom(true), 50);
    };

    const onTyping = ({ uid, typing }) => {
      const me = auth.currentUser?.uid;
      if (uid && uid !== me) setTypingRemote(typing);
    };

    socket.on("connect", onConnect);
    socket.on("message", onMessage);
    socket.on("message:private", onMessage);
    socket.on("typing", onTyping);

    // show cached messages immediately to reduce perceived load
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length) {
          setMessages(parsed);
          setLoading(false);
          setTimeout(() => scrollToBottom(false), 20);
        }
      }
    } catch (err) {
      console.warn("chat cache read failed", err);
    }

    // fetch canonical recent messages (smaller window for speed)
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const token = await getIdToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API}/api/chats/${encodeURIComponent(chatId)}/messages?limit=50`, {
          headers,
          signal: controller.signal,
        });
        if (!res.ok) {
          console.warn("fetchMessages failed", res.status);
          return;
        }
        const body = await res.json();
        if (!mounted) return;
        const msgs = body.messages || [];
        setMessages(msgs);
        try { sessionStorage.setItem(cacheKey, JSON.stringify(msgs)); } catch (err) { void err; }
        setTimeout(() => scrollToBottom(false), 50);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("fetchMessages error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 60000);

    return () => {
      mounted = false;
      controller.abort();
      if (pollRef.current) clearInterval(pollRef.current);
      socket.emit("leave:chat", { chatId });
      socket.off("connect", onConnect);
      socket.off("message", onMessage);
      socket.off("message:private", onMessage);
      socket.off("typing", onTyping);
    };
  }, [chatId, getIdToken, scrollToBottom]);

  const sendMessage = async (ev) => {
    ev?.preventDefault();
    const trimmed = (text || "").trim();
    if (!trimmed) return;
    try {
      const token = await getIdToken();
      const senderId = auth.currentUser?.uid;
      const recipientId = otherUser?.id || otherUser?._id || routeOtherId || null;
      if (!chatId && !recipientId) throw new Error("Cannot determine chatId or recipient");

      const body = {
        ...(chatId ? { chatId } : {}),
        ...(recipientId ? { otherId: recipientId } : {}),
        uid: senderId,
        text: trimmed,
      };

      const res = await fetch(`${API}/api/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      // update chatId if server created one
      if (!chatId && data.chatId) setChatId(data.chatId);
      // optimistic UI: append saved message if returned
      const savedMsg = data.message || data.message;
      if (savedMsg) {
        setMessages((prev) => {
          const exists = prev.some((x) => x.id && savedMsg.id && x.id === savedMsg.id);
          if (exists) return prev;
          const next = [...prev, savedMsg];
          try { sessionStorage.setItem(`chat_${chatId || data.chatId}_messages`, JSON.stringify(next)); } catch (err) { void err; }
          return next;
        });
      }
      setText("");
      scrollToBottom(true);
      // notify socket typing end
      socketRef.current?.emit("typing", { chatId: chatId || data.chatId, typing: false });
    } catch (err) {
      console.error("sendMessage error", err);
      alert(err.message || "Failed to send message");
    }
  };

  // typing indicator (debounced)
  useEffect(() => {
    if (!chatId) return;
    const socket = socketRef.current;
    if (!socket) return;
    let timer = null;
    if (text && text.trim()) {
      socket.emit("typing", { chatId, typing: true });
      timer = setTimeout(() => socket.emit("typing", { chatId, typing: false }), 1500);
    } else {
      socket.emit("typing", { chatId, typing: false });
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [text, chatId]);

  const headerName = otherUser?.username || otherUser?.name || otherUser?.displayName || routeOtherId || "Chat";
  const avatar = otherUser?.avatar || otherUser?.profile?.profilePic || `https://i.pravatar.cc/40?u=${headerName}`;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-white border-b">
        <button onClick={() => navigate(-1)} className="px-2 py-1 rounded hover:bg-gray-100">←</button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
            <img src={avatar} alt={headerName} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-semibold">{headerName}</div>
            <div className="text-xs text-gray-500">{typingRemote ? "typing…" : ""}</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4">
        {loading && !messages.length ? (
          <div className="text-center text-sm text-gray-500">Loading messages…</div>
        ) : (
          <div className="space-y-3 max-w-3xl mx-auto">
            {messages.map((m) => {
              const isMine = m.uid === auth.currentUser?.uid;
              const time = m.createdAt && (typeof m.createdAt.toDate === "function"
                ? new Date(m.createdAt.toDate())
                : new Date(m.createdAt));
              return (
                <div key={m.id || (m.createdAt && time.getTime()) || Math.random()} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className={`p-2 rounded-lg ${isMine ? "bg-blue-600 text-white" : "bg-white border"} max-w-[70%]`}>
                    <div className="text-sm break-words">{m.text || m.message || ""}</div>
                    <div className="text-xs text-gray-400 mt-1 text-right">{time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-3 bg-white border-t flex gap-2 items-center">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border rounded px-3 py-2 resize-none"
          placeholder="Write a message..."
          rows={1}
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Send</button>
      </form>

      {typingRemote && otherUser && (
        <div className="text-xs text-gray-500 p-3 bg-white border-t">
          {otherUser.username} is typing…
        </div>
      )}
    </div>
  );
}
