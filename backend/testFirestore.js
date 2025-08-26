// testFirestore.js
// require the exported db from firebaseAdmin
const { db } = require('./firebaseAdmin');

if (!db) {
  console.error('Firestore test failed: "db" is not exported from firebaseAdmin.js');
  process.exit(1);
}

async function runTest() {
  try {
    const docRef = db.collection('health-check').doc('test');
    const snap = await docRef.get();
    console.log('Firestore test OK — doc exists:', !!snap.exists);
    process.exit(0);
  } catch (err) {
    console.error('Firestore test failed:', err && (err.stack || err.message || err));
    process.exit(1);
  }
}

runTest();
