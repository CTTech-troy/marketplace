const { db, auth, serviceAccount } = require('./firebaseAdmin');

(async () => {
  console.log('serviceAccount present?', !!serviceAccount);
  console.log('FIREBASE_PROJECT_ID env:', process.env.FIREBASE_PROJECT_ID || '(not set)');

  try {
    // Firestore read test
    try {
      const snap = await db.collection('__debug_test__').limit(1).get();
      console.log('firestore read OK. docs:', snap.size);
    } catch (dbErr) {
      console.error('firestore test read failed:', dbErr && dbErr.message ? dbErr.message : dbErr);
    }

    // Auth test
    try {
      const list = await auth.listUsers(1);
      console.log('auth.listUsers OK. count:', list.users.length);
    } catch (authErr) {
      console.error('auth test failed:', authErr && authErr.message ? authErr.message : authErr);
    }
  } catch (err) {
    console.error('debug script error:', err && err.message ? err.message : err);
  }
})();