import { Router } from 'express';
import { getCache } from '../db.js';
import { refreshEmails } from '../services/google.js';

const router = Router();

router.get('/emails', (req, res) => {
  const cached = getCache('emails:all');
  if (cached) {
    res.json({ data: JSON.parse(cached.data), fetchedAt: cached.fetched_at });
  } else {
    res.json({ data: [], fetchedAt: null });
  }
});

router.post('/emails/refresh', async (req, res) => {
  try {
    await refreshEmails();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
