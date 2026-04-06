import { Router } from 'express';
import { getCache } from '../db.js';
import { refreshCalendar } from '../services/google.js';

const router = Router();

router.get('/calendar', (req, res) => {
  const cached = getCache('calendar:rolling');
  if (cached) {
    res.json({ data: JSON.parse(cached.data), fetchedAt: cached.fetched_at });
  } else {
    res.json({ data: [], fetchedAt: null });
  }
});

router.post('/calendar/refresh', async (req, res) => {
  try {
    await refreshCalendar();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
