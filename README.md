# Life Dashboard

A personal weekly dashboard that pulls calendar, important emails, to-dos, kids' homework, and weather into a single cache-first view. Designed to live on the wall (literally — runs on a low-power machine bound to the LAN, displayed on an old tablet).

## Why I built this

I was tired of context-switching between Google Calendar, Gmail, a to-do app, the kids' school portal, and a weather widget every morning. None of them played well together, none of them surfaced *just the things I needed*, and several of them shoved ads in my face.

I wanted a glanceable view of "what does this week actually look like?" — and I wanted full control over the data, the filtering rules, and the refresh schedule.

## What it does

- **Calendar**: Pulls Google Calendar events for the current week, color-coded by calendar
- **Emails**: Shows only emails from people I've recently corresponded with (a 180-day "people I actually talk to" allowlist), so newsletters and noise are filtered out automatically
- **To-dos**: Emails I send to *myself* are auto-converted into to-do items
- **Homework**: Scrapes a password-protected WordPress page (kids' school site) for upcoming assignments
- **Weather**: 7-day forecast for the current location

## Architectural decisions worth calling out

| Decision | Why |
|---|---|
| **Cache-first reads** | Cron refreshes data 2x/day (6 AM, 4 PM Pacific). The frontend always reads from the local cache, never hits Google APIs in the request path. Page loads are instant and the dashboard works offline if APIs are down. |
| **sql.js instead of better-sqlite3** | Pure JS SQLite, no native compilation. Works on any Node version without rebuilding when I upgrade. The performance hit is irrelevant for a single-user app with KB-sized tables. |
| **Express binds 0.0.0.0** | So I can hit it from any device on the LAN — phone, old tablet propped on the wall, laptop. |
| **"People I email" filter for inbox** | Most "important email" filters are spam-detection in disguise. The actual signal is *do I talk to this person*. If I've sent them an email in the last 180 days, they're a person worth surfacing. Drops Gmail's "Primary" tab from ~80 messages to ~5. |
| **Self-emails as to-dos** | The fastest todo-capture UX is the one I already use 100x a day: composing an email. Sending to myself with a subject = creating a todo. |
| **Content filter on cache writes** | Blocklist-based profanity filter applied to all text before it gets cached, because the dashboard is on the wall in a house with kids. |
| **Homework scraping via direct POST** | The school posts assignments behind a WordPress password-protected page. Standard HTTP POST to `wp-login.php` with the password gets the cookie, then a GET on the protected page parses the HTML. No browser automation needed. |

## Tech stack

- **Frontend**: React 18, Vite, Tailwind CSS v4, Recharts
- **Backend**: Node, Express, sql.js
- **Auth**: Google OAuth2 via `googleapis` (tokens stored in SQLite, auto-refresh)
- **APIs**: Google Calendar, Gmail, OpenWeatherMap

## Project structure

```
life-dashboard/
├── server/
│   ├── index.js          # Express on :3001, binds 0.0.0.0 for LAN
│   ├── cron.js           # Twice-daily refresh job
│   ├── db.js             # sql.js wrapper
│   ├── routes/           # /calendar, /email, /todos, /homework, /weather, /auth
│   └── services/         # Google API clients, weather, scrapers, content filter
├── src/
│   ├── App.jsx           # Main weekly view
│   ├── components/       # Cards for calendar, email, todos, homework, weather
│   └── hooks/            # Cache reads
└── public/
```

## Running locally

```bash
npm install
cp .env.example .env       # then fill in keys
npm run dev                # express + vite concurrently
```

You'll need a Google Cloud project with OAuth2 credentials for Calendar + Gmail scopes, an OpenWeatherMap API key, and (optionally) credentials for whatever password-protected page you want to scrape.

## Personal data note

This repo intentionally excludes:
- `.env` (API keys and OAuth secrets)
- `dashboard.db` (cached personal data — emails, calendar events, todos)
- Any actual scraping target URLs or credentials

The repo demonstrates the architecture and patterns; the live data stays on my machine.
