// backend/firebaseAdmin.js
require("dotenv").config();
const admin = require('firebase-admin');
const path = require('path');

// load your service account JSON (adjust filename if different)
const serviceAccount = require(path.join(__dirname, 'marketplace-bf706-firebase-adminsdk-fbsvc-622dcca302.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// export auth + db + admin
const auth = admin.auth();
const db = admin.firestore();

module.exports = { admin, auth, db };
