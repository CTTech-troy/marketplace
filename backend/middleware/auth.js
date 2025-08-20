const { admin } = require('../firebaseAdmin');

module.exports = async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer (.+)$/);
  if (!match) return res.status(401).json({ error: 'Missing or invalid Authorization header' });

  const idToken = match[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = decoded; // uid, email, etc.
    next();
  } catch (err) {
    console.error('Token verification failed:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};