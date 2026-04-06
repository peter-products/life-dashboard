import { Router } from 'express';
import { getAuthUrl, handleCallback, getAuthStatus } from '../services/google.js';

const router = Router();

router.get('/google', (req, res) => {
  res.redirect(getAuthUrl());
});

router.get('/google/callback', async (req, res) => {
  try {
    const email = await handleCallback(req.query.code);
    console.log(`[auth] Authenticated as ${email}`);
    const devRedirect = process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:5173/';
    res.redirect(devRedirect);
  } catch (err) {
    console.error('[auth] Callback error:', err.message);
    res.status(500).send('Authentication failed. Check server logs.');
  }
});

router.get('/status', (req, res) => {
  res.json(getAuthStatus());
});

export default router;
