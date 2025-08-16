const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

let serviceAccount;
const keyPath = path.join(__dirname, "serviceAccountKey.json");

// load service account: prefer env var (JSON string) then local file
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (err) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT env var:", err.message);
    serviceAccount = null;
  }
} else if (fs.existsSync(keyPath)) {
  serviceAccount = require(keyPath);
} else {
  console.error("No serviceAccountKey.json found and FIREBASE_SERVICE_ACCOUNT not set.");
  serviceAccount = null;
}

// determine projectId and databaseURL
const projectId = process.env.FIREBASE_PROJECT_ID || (serviceAccount && serviceAccount.project_id);
const databaseURL = process.env.FIREBASE_DATABASE_URL || (serviceAccount && serviceAccount.database_url) || undefined;

if (!serviceAccount) {
  console.error("Firebase service account is missing. Firestore calls will fail until this is fixed.");
}

try {
  admin.initializeApp({
    credential: serviceAccount ? admin.credential.cert(serviceAccount) : admin.credential.applicationDefault(),
    projectId: projectId,
    ...(databaseURL ? { databaseURL } : {}),
  });
  console.log("Firebase Admin initialized. projectId =", projectId);
} catch (err) {
  console.error("Failed to initialize Firebase Admin SDK:", err && err.stack ? err.stack : err);
  throw err;
}

const auth = admin.auth();
const db = admin.firestore();

module.exports = { admin, auth, db, serviceAccount };
