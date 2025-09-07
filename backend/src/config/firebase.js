import admin from "firebase-admin";
import fs from "fs";
import path from "path";

// Use absolute path based on current file location
const serviceAccountPath = path.resolve("./CTTech.json");

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(`Firebase service account JSON not found at ${serviceAccountPath}`);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const firestore = admin.firestore();

export { admin, auth, firestore };
