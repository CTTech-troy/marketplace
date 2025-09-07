import express from 'express';
import { logDebug } from '../controllers/debugController.js';
import verifyFirebaseToken from '../middlewares/authMiddleware.js';

const router = express.Router();

// Add this root route so GET /debug responds
router.get('/', (req, res) => {
  res.json({ ok: true, message: 'Debug endpoint. Use /debug/ping /debug/log /debug/scan' });
});

// Public debug endpoint (no auth) - change to verifyFirebaseToken to require auth
router.post('/log', /* verifyFirebaseToken, */ logDebug);

// Quick GET to inspect
router.get('/ping', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// Diagnostic scanner: dynamically imports modules and checks named exports
router.get('/scan', async (req, res) => {
  const checks = [
    { path: '../controllers/authController.js', expect: ['signup','login','googleAuth','session','getProfile','updateProfile','sendVerificationCode','verifyCode'] },
    { path: '../controllers/debugController.js', expect: ['logDebug'] },
    { path: '../middlewares/authMiddleware.js', expect: ['default'] }, // default export is ok
    { path: '../routes/authRoutes.js', expect: ['default'] },
    // add other modules you want scanned below
  ];

  const results = [];
  for (const c of checks) {
    try {
      const mod = await import(c.path);
      const exported = Object.keys(mod);
      const missing = (c.expect || []).filter(name => {
        if (name === 'default') return 'default' in mod;
        return exported.includes(name);
      }).filter(x => {
        // convert 'default' check to boolean
        if (x === 'default') return !( 'default' in mod);
        return false;
      });

      // Compute which expected were actually present
      const present = (c.expect || []).map(name => ({
        name,
        present: name === 'default' ? ('default' in mod) : (exported.includes(name))
      }));

      results.push({ module: c.path, loaded: true, exports: exported, expect: c.expect, present, missing: present.filter(p => !p.present).map(p=>p.name) });
    } catch (err) {
      results.push({ module: c.path, loaded: false, error: (err && (err.message || String(err))) });
    }
  }

  res.json({ ts: new Date().toISOString(), results });
});

export default router;