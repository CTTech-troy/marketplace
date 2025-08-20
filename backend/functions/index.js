const functions = require("firebase-functions");
const admin = require("firebase-admin");

// initialize admin (use environment or service account configured by Firebase Functions)
admin.initializeApp();

const db = admin.firestore();

exports.deleteFirestoreOnAuthDelete = functions.auth.user().onDelete(async (user) => {
  const uid = user.uid;
  try {
    await db.collection("users").doc(uid).delete();
    console.log(`Deleted Firestore user doc for uid=${uid}`);
  } catch (err) {
    console.error(`Failed to delete Firestore user doc for uid=${uid}`, err);
  }
});