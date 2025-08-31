// backend/src/services/firebaseService.js
import { admin, firestore } from "../config/firebase.js";

const messaging = admin.messaging();

export async function sendPushNotification(fcmToken, payload) {
  if (!fcmToken) {
    console.warn("⚠️ No FCM token provided, skipping push notification.");
    return;
  }
  try {
    const response = await messaging.sendToDevice(fcmToken, payload, {
      priority: "high",
      timeToLive: 60 * 60, // 1 hour
    });
    console.log("✅ Push notification sent:", response.successCount, "success");
    if (response.failureCount > 0) {
      console.warn("⚠️ Some notifications failed:", response.results);
    }
  } catch (error) {
    console.error("❌ Error sending push notification:", error.message);
  }
}

export async function createNotification(userId, type, message) {
  try {
    if (!userId) throw new Error("Missing userId for notification");
    const notificationsRef = firestore
      .collection("users")
      .doc(userId)
      .collection("notifications");

    await notificationsRef.add({
      type,
      message,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Notification created for user: ${userId}`);
  } catch (error) {
    console.error("❌ Error creating notification:", error.message);
  }
}

export async function addChatMessage(chatId, messageData) {
  try {
    if (!chatId) throw new Error("Missing chatId");
    if (!messageData?.senderId || !messageData?.text) {
      throw new Error("Invalid messageData");
    }

    const messagesRef = firestore
      .collection("chats")
      .doc(chatId)
      .collection("messages");

    await messagesRef.add({
      ...messageData,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    await firestore.collection("chats").doc(chatId).update({
      lastMessage: messageData.text,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Message added to chat ${chatId}`);

    if (messageData.recipientId) {
      await createNotification(
        messageData.recipientId,
        "message",
        `New message from ${messageData.senderId}`
      );
      if (messageData.recipientFcmToken) {
        await sendPushNotification(messageData.recipientFcmToken, {
          notification: {
            title: "New Message",
            body: messageData.text,
          },
          data: { chatId },
        });
      }
    }
  } catch (error) {
    console.error("❌ Error adding chat message:", error.message);
  }
}
