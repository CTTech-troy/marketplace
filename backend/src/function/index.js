// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const firestore = admin.firestore();
const messaging = admin.messaging();

/**
 * Scheduled function to clear anonymous chats every day at 23:59
 */
exports.clearAnonymousChats = functions.pubsub
  .schedule('every day 23:59')
  .onRun(async (context) => {
    try {
      const chatsSnapshot = await firestore
        .collection('chats')
        .where('isAnonymous', '==', true)
        .get();

      const batch = firestore.batch();

      for (const chatDoc of chatsSnapshot.docs) {
        // Delete all messages subcollection
        const messagesSnapshot = await chatDoc.ref.collection('messages').get();
        messagesSnapshot.forEach((msgDoc) => {
          batch.delete(msgDoc.ref);
        });

        // Delete chat doc itself
        batch.delete(chatDoc.ref);
      }

      await batch.commit();
      console.log('✅ Anonymous chats cleared after market close');
    } catch (error) {
      console.error('❌ Error clearing anonymous chats:', error);
    }
  });

/**
 * Firestore trigger: on new chat message
 */
exports.onNewChatMessage = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const chatId = context.params.chatId;

    try {
      // Update lastMessage and lastUpdated in chat doc
      await firestore.collection('chats').doc(chatId).update({
        lastMessage: message.text,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Fetch chat participants
      const chatDoc = await firestore.collection('chats').doc(chatId).get();
      const chatData = chatDoc.data();
      if (!chatData) return null;

      const recipients = (chatData.participants || []).filter(
        (uid) => uid !== message.senderId
      );

      // Notify each recipient
      for (const recipientId of recipients) {
        // Create notification doc
        await firestore
          .collection('users')
          .doc(recipientId)
          .collection('notifications')
          .add({
            type: 'message',
            message: `New message from ${message.senderId}`,
            isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

        // Send push notification if recipient has FCM token
        const userDoc = await firestore.collection('users').doc(recipientId).get();
        const userData = userDoc.data();
        if (userData && userData.fcmToken) {
          const payload = {
            notification: {
              title: 'New Message',
              body: `New message from ${message.senderId}`,
              clickAction: 'FLUTTER_NOTIFICATION_CLICK', // adjust for your app
            },
          };
          await messaging.sendToDevice(userData.fcmToken, payload);
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error in onNewChatMessage:', error);
      return null;
    }
  }); 
