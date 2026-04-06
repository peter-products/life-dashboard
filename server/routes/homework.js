import { Router } from 'express';
import { getCache } from '../db.js';
import { scrapeHomework } from '../services/homework.js';

const router = Router();

router.get('/homework', (req, res) => {
  const cached = getCache('homework');
  if (cached) {
    res.json({ data: JSON.parse(cached.data), fetchedAt: cached.fetched_at });
  } else {
    res.json({ data: null, fetchedAt: null });
  }
});

router.post('/homework/refresh', async (req, res) => {
  try {
    await scrapeHomework();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
