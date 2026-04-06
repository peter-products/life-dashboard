import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';
import { setCache } from '../db.js';
import { filterText } from './content-filter.js';

export async function scrapeHomework() {
  const url = process.env.HOMEWORK_URL;
  const password = process.env.HOMEWORK_PASSWORD;
  if (!url || !password) { console.log('[homework] No URL/password, skipping'); return; }

  const jar = new CookieJar();
  const client = wrapper(axios.create({ jar, withCredentials: true }));

  await client.post(
    url + 'wp-login.php?action=postpass',
    new URLSearchParams({ post_password: password }),
    { maxRedirects: 5, validateStatus: s => s >= 200 && s < 400 }
  );

  const { data: html } = await client.get(url);
  const $ = cheerio.load(html);

  // Extract the weekly homework table
  let homeworkTableHtml = '';
  const table = $('figure.wp-block-table').first();
  if (table.length) {
    homeworkTableHtml = $.html(table);
  }

  // Extract the Google Calendar iframe
  let calendarIframeHtml = '';
  const calendarBlock = $('div.wp-block-jetpack-google-calendar').first();
  if (calendarBlock.length) {
    calendarIframeHtml = $.html(calendarBlock);
  }

  if (!homeworkTableHtml && !calendarIframeHtml) {
    console.log('[homework] Could not find homework table or calendar, page may still be locked');
    return;
  }

  const combined = `
    <h2 style="text-align:center;margin-bottom:12px;">Weekly Homework Calendar</h2>
    ${homeworkTableHtml}
    <h2 style="text-align:center;margin-top:24px;margin-bottom:12px;">Monthly Calendar</h2>
    ${calendarIframeHtml}
  `;

  setCache('homework', { html: filterText(combined), fetchedAt: new Date().toISOString() });
  console.log('[homework] Cache updated');
}
