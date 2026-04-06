import { Router } from 'express';
import { getCache } from '../db.js';
import { refreshWeather } from '../services/weather.js';

const router = Router();

router.get('/weather', (req, res) => {
  const cached = getCache('weather');
  if (cached) {
    res.json({ data: JSON.parse(cached.data), fetchedAt: cached.fetched_at });
  } else {
    res.json({ data: null, fetchedAt: null });
  }
});

router.post('/weather/refresh', async (req, res) => {
  try {
    await refreshWeather();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
