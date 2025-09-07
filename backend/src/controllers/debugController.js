import { firestore } from '../config/firebase.js';

export const logDebug = async (req, res) => {
  try {
    const record = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl || req.url,
      headers: req.headers,
      params: req.params,
      query: req.query,
      body: req.body,
      user: req.user || null,
      ip: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress
    };

    // Console log for immediate visibility
    console.debug('[DEBUG API] incoming request:', JSON.stringify(record, null, 2));

    // Try to save to Firestore if available
    let docRefId = null;
    try {
      const docRef = await firestore.collection('debugLogs').add(record);
      docRefId = docRef.id;
    } catch (e) {
      console.warn('[DEBUG API] failed to write debug log to Firestore:', e?.message || e);
    }

    return res.status(200).json({ ok: true, id: docRefId });
  } catch (err) {
    console.error('[DEBUG API] unexpected error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to log debug info' });
  }
};