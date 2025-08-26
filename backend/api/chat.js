const express = require("express");
const admin = require("firebase-admin");
const router = express.Router();
const db = admin.firestore();

// POST /api/chats
router.post("/", async (req, res) => {
  const { chatId, uid, otherId, text, imageUrl } = req.body;
  if (!uid) return res.status(400).json({ error: "Missing parameters: uid" });
  if (!chatId && !otherId) return res.status(400).json({ error: "Missing parameters: chatId or otherId" });

  try {
    // ensure chat doc
    let chatRef;
    let chatDoc;
    if (chatId) {
      chatRef = db.collection("chats").doc(chatId);
      chatDoc = await chatRef.get();
      if (!chatDoc.exists && otherId) {
        await chatRef.set({ participants: [uid, otherId], createdAt: admin.firestore.Timestamp.now() });
        chatDoc = await chatRef.get();
      }
    } else {
      chatRef = db.collection("chats").doc();
      await chatRef.set({ participants: [uid, otherId], createdAt: admin.firestore.Timestamp.now() });
      chatDoc = await chatRef.get();
    }

    // create message
    const msg = {
      text: text || "",
      uid,
      chatId: chatRef.id,
      ...(imageUrl ? { imageUrl } : {}),
      createdAt: admin.firestore.Timestamp.now(),
    };
    const msgRef = await chatRef.collection("messages").add(msg);
    const savedSnap = await msgRef.get();
    const saved = { id: msgRef.id, ...savedSnap.data() };

    // update chat metadata
    await chatRef.set(
      { updatedAt: admin.firestore.Timestamp.now(), lastMessageText: text || (imageUrl ? "📷 Image" : "") },
      { merge: true }
    );

    // Emit message immediately (so clients see it before notifications/FCM)
    try {
      const io = req.app.get("io");
      if (io) {
        io.to(`chat:${chatRef.id}`).emit("message", { ...saved, chatId: chatRef.id });
      }

      // determine receiver and emit private message
      const participants = chatDoc.exists ? chatDoc.data().participants || [] : (otherId ? [uid, otherId] : []);
      const receiverId = participants.find((p) => p !== uid);
      if (receiverId) {
        if (io) io.to(`user:${receiverId}`).emit("message:private", { ...saved, chatId: chatRef.id });
      }
    } catch (emitErr) {
      console.warn("emit message failed:", emitErr);
    }

    // create notification + attempt FCM (non-blocking for the response)
    (async () => {
      try {
        const participants = chatDoc.exists ? chatDoc.data().participants || [] : (otherId ? [uid, otherId] : []);
        const receiverId = participants.find((p) => p !== uid);
        if (!receiverId) return;

        // lookup sender name
        let senderName = uid;
        try {
          const sdoc = await db.collection("users").doc(uid).get();
          if (sdoc.exists) {
            const sd = sdoc.data();
            senderName = sd?.username || sd?.displayName || sd?.name || uid;
          }
        } catch (e) {
          /* ignore */
        }

        const shortMsg = text ? (typeof text === "string" && text.length > 120 ? text.slice(0, 117) + "..." : text) : "📷 Image";
        const notif = {
          user_id: receiverId,
          title: `${senderName} sent you a message`,
          message: shortMsg,
          type: "message",
          is_read: false,
          created_at: admin.firestore.Timestamp.now(),
          meta: { from: uid, fromName: senderName, chatId: chatRef.id },
        };

        const notifRef = db.collection("notifications").doc();
        await notifRef.set(notif);

        const io = req.app.get("io");
        if (io) io.to(`user:${receiverId}`).emit("notification", { id: notifRef.id, ...notif });

        // attempt FCM dispatch (non-blocking)
        try {
          // assemble tokens from user doc or fcm_tokens collection
          const tokens = [];
          try {
            const userDoc = await db.collection("users").doc(receiverId).get();
            if (userDoc.exists) {
              const ud = userDoc.data();
              if (Array.isArray(ud?.fcmTokens)) tokens.push(...ud.fcmTokens);
            }
            if (tokens.length === 0) {
              const snap = await db.collection("fcm_tokens").where("user_id", "==", receiverId).get();
              snap.forEach(d => { const dd = d.data(); if (dd?.token) tokens.push(dd.token); });
            }
          } catch (tkErr) { /* ignore token read errors */ }

          let adminSdk = admin;
          try {
            const fbAdmin = require("../firebaseAdmin.js");
            adminSdk = fbAdmin && fbAdmin.admin ? fbAdmin.admin : admin;
          } catch (e) { /* ignore */ }

          if (tokens.length > 0 && adminSdk && adminSdk.messaging) {
            const messagePayload = {
              notification: { title: notif.title, body: notif.message },
              data: { chatId: chatRef.id, senderId: uid, type: "message" },
            };
            await adminSdk.messaging().sendMulticast({ tokens, ...messagePayload });
          }
        } catch (fcmErr) {
          console.warn("FCM send failed:", fcmErr);
        }
      } catch (notifErr) {
        console.warn("notification creation failed:", notifErr);
      }
    })();

    // respond with saved message and chatId
    return res.status(201).json({ success: true, message: saved, chatId: chatRef.id });
  } catch (err) {
    console.error("chat.post error:", err && (err.stack || err));
    return res.status(500).json({ error: "Failed to send message" });
  }
});

module.exports = router;