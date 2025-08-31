import admin from "firebase-admin";
import { createRequire } from "module";
import dotenv from "dotenv";

dotenv.config();
const require = createRequire(import.meta.url);

const serviceAccount = require("../../ctstore.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DB_URL,
  });
}

const auth = admin.auth();
const firestore = admin.firestore();

export { admin, auth, firestore };
