import { google } from 'googleapis';
import { setCache, queryAll, queryOne, run } from '../db.js';
import { filterArray } from './content-filter.js';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
];

function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl() {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });
}

export async function handleCallback(code) {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);

  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const { data } = await oauth2.userinfo.get();

  run(
    `INSERT OR REPLACE INTO google_tokens (id, access_token, refresh_token, expiry_date, email)
     VALUES (1, ?, ?, ?, ?)`,
    [tokens.access_token, tokens.refresh_token, tokens.expiry_date, data.email]
  );

  return data.email;
}

export function isAuthenticated() {
  const row = queryOne('SELECT refresh_token FROM google_tokens WHERE id = 1');
  return !!row?.refresh_token;
}

export function getAuthStatus() {
  const row = queryOne('SELECT email FROM google_tokens WHERE id = 1');
  return { authenticated: !!row?.email, email: row?.email || null };
}

function getAuthClient() {
  const row = queryOne('SELECT * FROM google_tokens WHERE id = 1');
  if (!row?.refresh_token) return null;

  const client = createOAuth2Client();
  client.setCredentials({
    access_token: row.access_token,
    refresh_token: row.refresh_token,
    expiry_date: row.expiry_date,
  });

  client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      run(
        'UPDATE google_tokens SET access_token = ?, expiry_date = ?, refresh_token = ? WHERE id = 1',
        [tokens.access_token, tokens.expiry_date, tokens.refresh_token]
      );
    } else {
      run(
        'UPDATE google_tokens SET access_token = ?, expiry_date = ? WHERE id = 1',
        [tokens.access_token, tokens.expiry_date]
      );
    }
  });

  return client;
}

// --- Calendar ---

export async function refreshCalendar() {
  const auth = getAuthClient();
  if (!auth) return;

  const calendar = google.calendar({ version: 'v3', auth });

  // Get all calendars the user has access to
  const calListRes = await calendar.calendarList.list();
  const calendars = (calListRes.data.items || []).filter(c => !c.deleted);
  console.log(`[calendar] Found ${calendars.length} calendars: ${calendars.map(c => c.summary).join(', ')}`);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const twoWeeksOut = new Date();
  twoWeeksOut.setDate(twoWeeksOut.getDate() + 13);
  twoWeeksOut.setHours(23, 59, 59, 999);

  const allEvents = [];

  for (const cal of calendars) {
    try {
      const res = await calendar.events.list({
        calendarId: cal.id,
        timeMin: yesterday.toISOString(),
        timeMax: twoWeeksOut.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        timeZone: 'America/Los_Angeles',
        maxResults: 250,
      });

      const events = (res.data.items || []).map(e => ({
        id: e.id,
        summary: e.summary || '(No title)',
        start: e.start.dateTime || e.start.date,
        end: e.end.dateTime || e.end.date,
        allDay: !!e.start.date,
        location: e.location || null,
        description: e.description || null,
        calendar: cal.summary,
        calendarColor: cal.backgroundColor || null,
      }));

      allEvents.push(...events);
    } catch (err) {
      console.log(`[calendar] Skipping calendar "${cal.summary}": ${err.message}`);
    }
  }

  // Sort all events by start time
  allEvents.sort((a, b) => new Date(a.start) - new Date(b.start));

  setCache('calendar:rolling', filterArray(allEvents, ['summary', 'description', 'location']));
  console.log(`[calendar] Cached ${allEvents.length} events from ${calendars.length} calendars`);
}

// --- Gmail ---

export async function refreshContacts() {
  const auth = getAuthClient();
  if (!auth) return;

  const gmail = google.gmail({ version: 'v1', auth });
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: 'in:sent newer_than:180d',
    maxResults: 200,
  });

  const messageIds = (res.data.messages || []).map(m => m.id);

  for (const id of messageIds) {
    const msg = await gmail.users.messages.get({
      userId: 'me',
      id,
      format: 'metadata',
      metadataHeaders: ['To', 'Cc'],
    });

    const headers = msg.data.payload.headers || [];
    for (const h of headers) {
      if (h.name === 'To' || h.name === 'Cc') {
        const addresses = parseAddresses(h.value);
        for (const addr of addresses) {
          run(
            'INSERT OR REPLACE INTO known_contacts (email, display_name, last_seen) VALUES (?, ?, ?)',
            [addr.email.toLowerCase(), addr.name || addr.email, Date.now()]
          );
        }
      }
    }
  }

  const count = queryOne('SELECT COUNT(*) as n FROM known_contacts');
  console.log(`[contacts] ${count?.n || 0} known contacts`);
}

function parseAddresses(header) {
  const results = [];
  const parts = header.split(',');
  for (const part of parts) {
    const match = part.match(/<([^>]+)>/);
    const email = match ? match[1] : part.trim();
    const name = match ? part.replace(/<[^>]+>/, '').trim().replace(/^"|"$/g, '') : '';
    if (email.includes('@')) results.push({ email, name });
  }
  return results;
}

export async function refreshEmails() {
  const auth = getAuthClient();
  if (!auth) return;

  const gmail = google.gmail({ version: 'v1', auth });
  const knownEmails = new Set(
    queryAll('SELECT email FROM known_contacts').map(r => r.email)
  );
  const userEmail = queryOne('SELECT email FROM google_tokens WHERE id = 1')?.email;

  // Check if we've done the initial deep scan
  const deepScanDone = queryOne("SELECT data FROM cache WHERE key = 'emails:deep_scan_done'");

  // First run: scan 30 days. Subsequent runs: scan 7 days only
  const timeRange = deepScanDone ? '7d' : '30d';
  const maxResults = deepScanDone ? 50 : 200;

  // Keywords that indicate an email is important regardless of sender
  const importantPatterns = /\b(practice|game|schedule|baseball|softball|soccer|basketball|football|swim|track|match|tournament|pickup|drop.?off|carpool|school|class|homework|field trip|recital|concert|rehearsal|coach|team|roster|lineup|rainout|cancelled|rescheduled|snack|volunteer|dugout|inning|league|little league|clinic|tryout|registration|season|picture day|spirit day|pta|bake sale|fun run|recess)\b/i;

  // Senders from kids activity platforms — always include
  const importantSenders = /teamsnap|sportsengine|leagueapps|gamechanger|blue\s?sombrero|stack\s?sports|sportsconnect|shutterfly|konstella|bloomz|classdojo|remind\.com|signupgenius/i;

  const res = await gmail.users.messages.list({
    userId: 'me',
    q: `-category:promotions -category:social newer_than:${timeRange} in:inbox`,
    maxResults,
  });

  const messageIds = (res.data.messages || []).map(m => m.id);
  const emails = [];

  for (const id of messageIds) {
    const msg = await gmail.users.messages.get({
      userId: 'me',
      id,
      format: 'metadata',
      metadataHeaders: ['From', 'Subject', 'Date'],
    });

    const headers = msg.data.payload.headers || [];
    const from = headers.find(h => h.name === 'From')?.value || '';
    const subject = headers.find(h => h.name === 'Subject')?.value || '(No subject)';
    const date = headers.find(h => h.name === 'Date')?.value || '';

    const fromEmail = (from.match(/<([^>]+)>/) || [null, from.trim()])[1].toLowerCase();

    if (userEmail && fromEmail === userEmail.toLowerCase()) continue;

    // Include if: known contact OR subject/sender matches important patterns OR from a kids activity platform
    const isKnown = knownEmails.has(fromEmail);
    const isImportant = importantPatterns.test(subject) || importantPatterns.test(from);
    const isActivityPlatform = importantSenders.test(from) || importantSenders.test(fromEmail);
    if (!isKnown && !isImportant && !isActivityPlatform) continue;

    const fromName = from.replace(/<[^>]+>/, '').trim().replace(/^"|"$/g, '') || fromEmail;

    emails.push({
      id: msg.data.id,
      from: fromName,
      fromEmail,
      subject,
      snippet: msg.data.snippet || '',
      date,
    });
  }

  // Sort by date descending
  emails.sort((a, b) => new Date(b.date) - new Date(a.date));

  setCache('emails:all', filterArray(emails, ['subject', 'snippet', 'from']));
  if (!deepScanDone) {
    setCache('emails:deep_scan_done', { done: true });
    console.log(`[email] Initial deep scan complete: ${emails.length} emails from last 30 days`);
  } else {
    console.log(`[email] Refreshed: ${emails.length} important emails from last 7 days`);
  }
}

// --- Todos (action items from emails via Claude) ---

export async function refreshTodos() {
  const auth = getAuthClient();
  if (!auth) return;

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('[todos] No ANTHROPIC_API_KEY, skipping action item extraction');
    return;
  }

  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const gmail = google.gmail({ version: 'v1', auth });
  const knownEmails = new Set(
    queryAll('SELECT email FROM known_contacts').map(r => r.email)
  );

  // Get emails from the last 7 days — broad filter for action items
  // No category filter here: sports/kids activities come from platforms like TeamSnap etc.
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: '-category:promotions -category:social newer_than:7d in:inbox',
    maxResults: 50,
  });

  const messageIds = (res.data.messages || []).map(m => m.id);

  const emailSummaries = [];
  const processedIds = new Set(
    queryAll('SELECT gmail_id FROM todos WHERE gmail_id IS NOT NULL').map(r => r.gmail_id)
  );

  for (const id of messageIds) {
    if (processedIds.has(id)) continue;

    const msg = await gmail.users.messages.get({
      userId: 'me',
      id,
      format: 'full',
      metadataHeaders: ['From', 'Subject', 'Date'],
    });

    const headers = msg.data.payload.headers || [];
    const from = headers.find(h => h.name === 'From')?.value || '';
    const subject = headers.find(h => h.name === 'Subject')?.value || '(No subject)';
    const date = headers.find(h => h.name === 'Date')?.value || '';

    const body = extractTextBody(msg.data.payload) || msg.data.snippet || '';
    const fromName = from.replace(/<[^>]+>/, '').trim().replace(/^"|"$/g, '') || from;

    emailSummaries.push({
      gmailId: id,
      from: fromName,
      subject,
      date,
      body: body.substring(0, 1000),
    });
  }

  if (emailSummaries.length === 0) {
    console.log('[todos] No new emails to process');
    return;
  }

  // Send to Claude for action item extraction
  const emailText = emailSummaries.map((e, i) =>
    `EMAIL ${i + 1} (from: ${e.from}, subject: ${e.subject}, date: ${e.date}):\n${e.body}`
  ).join('\n\n---\n\n');

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Extract action items from these emails. Include:
1. Things specifically being asked of me (requests, tasks, deadlines)
2. Kids' activities: sports practices, games, school events, pickups/dropoffs, schedule changes
3. Appointments or commitments I need to attend or prepare for

Skip: marketing, newsletters, pure FYIs with nothing I need to do, receipts, shipping notifications.

For each action item, output a JSON array of objects with:
- "emailIndex": the EMAIL number (1-based)
- "task": a short summary (10 words max)
- "from": who sent it

If no action items, return an empty array [].
Return ONLY the JSON array, no markdown formatting, no code fences.

${emailText}`
      }],
    });

    let text = response.content[0].text.trim();
    // Strip markdown code fences if present
    text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

    let actionItems = [];
    try {
      actionItems = JSON.parse(text);
    } catch {
      console.log('[todos] Could not parse Claude response:', text.substring(0, 200));
      return;
    }

    for (const item of actionItems) {
      const email = emailSummaries[item.emailIndex - 1];
      if (!email) continue;

      run(
        'INSERT OR IGNORE INTO todos (subject, snippet, gmail_id, created_at) VALUES (?, ?, ?, ?)',
        [item.task, `From: ${item.from}`, email.gmailId, new Date(email.date).getTime()]
      );
    }

    console.log(`[todos] Extracted ${actionItems.length} action items from ${emailSummaries.length} emails`);
  } catch (err) {
    console.error('[todos] Claude API error:', err.message);
  }
}

function extractTextBody(payload) {
  if (!payload) return '';

  // Direct text/plain part
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }

  // Multipart: recurse into parts
  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractTextBody(part);
      if (text) return text;
    }
  }

  return '';
}
