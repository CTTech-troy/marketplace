// Simple integration test runner for backend APIs. Run after starting your backend server.
// Usage (PowerShell/cmd):
//   cd c:\Users\Abdulsalam Korede\Desktop\marketPlace\backend
//   node test\api-test.js

const BASE = process.env.BASE_URL || "http://localhost:5000";
const timeout = (ms) => new Promise((r) => setTimeout(r, ms));

async function req(path, opts = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, opts);
  let body = null;
  try { body = await res.json(); } catch (e) { body = await res.text().catch(() => null); }
  return { status: res.status, body };
}

async function run() {
  console.log("Running API integration tests against", BASE);
  const now = Date.now();
  const sender = `test-sender-${now}`;
  const receiver = `test-receiver-${now}`;

  const results = [];

  // 1) Create/open chat (no auth token required by these endpoints in current server code)
  console.log("1) POST /api/chats -> create or open chat");
  let r = await req("/api/chats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid: sender, otherId: receiver }),
  });
  results.push({ test: "create chat", status: r.status, body: r.body });
  if (r.status !== 201) { console.error("FAILED create chat", r); return finish(false, results); }
  const chatId = r.body.chatId || (r.body.chat && r.body.chat.id);
  console.log("   chatId:", chatId);

  // 2) Send a message
  console.log("2) POST /api/chats -> send message");
  r = await req("/api/chats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, uid: sender, text: "Hello from integration test" }),
  });
  results.push({ test: "send message", status: r.status, body: r.body });
  if (r.status !== 201) { console.error("FAILED send message", r); return finish(false, results); }
  const messageId = r.body.message?.id || r.body.messageId || "unknown";
  console.log("   messageId:", messageId);

  // 3) GET messages
  console.log("3) GET /api/chats/:chatId/messages -> fetch messages");
  r = await req(`/api/chats/${encodeURIComponent(chatId)}/messages?limit=200`);
  results.push({ test: "get messages", status: r.status, body: r.body });
  if (r.status !== 200) { console.error("FAILED get messages", r); return finish(false, results); }
  const found = Array.isArray(r.body.messages) && r.body.messages.some(m => (m.id === messageId) || (m.text && m.text.includes("integration test")));
  console.log("   message present:", !!found);

  // 4) GET notifications for receiver (chat send should have created one)
  console.log("4) GET /api/notifications/:userId -> fetch notifications for receiver");
  // allow short delay for notification write to propagate
  await timeout(500);
  r = await req(`/api/notifications/${encodeURIComponent(receiver)}`);
  results.push({ test: "get notifications", status: r.status, body: r.body });
  if (r.status !== 200) {
    console.warn("WARN: notifications endpoint returned", r.status, r.body);
  } else {
    console.log("   notifications count:", (r.body.notifications && r.body.notifications.length) || 0);
  }

  // 5) Create a notification via POST /api/notifications
  console.log("5) POST /api/notifications -> create manual notification");
  r = await req("/api/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: receiver, title: "Integration test", message: "This is a test" }),
  });
  results.push({ test: "create notification", status: r.status, body: r.body });
  if (r.status !== 201) { console.error("FAILED create notification", r); return finish(false, results); }
  const notifId = r.body.notification?.id || null;
  console.log("   notifId:", notifId);

  // 6) PATCH mark notification read
  if (notifId) {
    console.log("6) PATCH /api/notifications/:id/read -> mark read");
    r = await req(`/api/notifications/${encodeURIComponent(notifId)}/read`, { method: "PATCH" });
    results.push({ test: "mark notification read", status: r.status, body: r.body });
    if (r.status !== 200) { console.error("FAILED mark read", r); return finish(false, results); }
  } else {
    console.warn("Skipping mark-read because notifId missing");
  }

  return finish(true, results);

  function finish(ok, results) {
    console.log("\nTest summary:");
    results.forEach((res, i) => {
      console.log(`${i + 1}. ${res.test} -> ${res.status}`);
    });
    process.exit(ok ? 0 : 1);
  }
}

run().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(2);
});