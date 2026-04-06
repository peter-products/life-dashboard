import cron from 'node-cron';
import { refreshWeather } from './services/weather.js';
import { scrapeHomework } from './services/homework.js';
import { isAuthenticated, refreshCalendar, refreshEmails, refreshContacts, refreshTodos } from './services/google.js';

async function refreshAll(includeContacts = false) {
  console.log(`[cron] Starting ${includeContacts ? 'morning' : 'afternoon'} refresh...`);
  try { await refreshWeather(); } catch (e) { console.error('[cron] weather error:', e.message); }
  try { await scrapeHomework(); } catch (e) { console.error('[cron] homework error:', e.message); }

  if (isAuthenticated()) {
    try { await refreshCalendar(); } catch (e) { console.error('[cron] calendar error:', e.message); }
    try { await refreshEmails(); } catch (e) { console.error('[cron] email error:', e.message); }
    try { await refreshTodos(); } catch (e) { console.error('[cron] todos error:', e.message); }
    if (includeContacts) {
      try { await refreshContacts(); } catch (e) { console.error('[cron] contacts error:', e.message); }
    }
  }
  console.log('[cron] Refresh complete.');
}

export function startCron() {
  // 6:00 AM Pacific (morning refresh with contacts)
  cron.schedule('0 6 * * *', () => refreshAll(true), { timezone: 'America/Los_Angeles' });

  // 4:00 PM Pacific (afternoon refresh)
  cron.schedule('0 16 * * *', () => refreshAll(false), { timezone: 'America/Los_Angeles' });

  // Run on startup
  refreshAll(true);
}
