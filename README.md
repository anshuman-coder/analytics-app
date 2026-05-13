# User Analytics Application

A full-stack application that tracks user interactions on a webpage and displays them in a real-time analytics dashboard.

## Assignment Checklist

### Required
- [x] **Tracking Script** — Vanilla JS script embeddable on any webpage
- [x] **`page_view` event** — fired on page load
- [x] **`click` event** — fired on every click with `x/y` coordinates
- [x] **Event fields** — `session_id`, `event_type`, `page_url`, `timestamp`, `x/y` (clicks)
- [x] **Session ID** — generated with `crypto.randomUUID()`, persisted in `localStorage`
- [x] **Backend API** — Node.js + Express
- [x] **Receive & store events** — `POST /api/events` (batch supported)
- [x] **List sessions with event counts** — `GET /api/sessions`
- [x] **Fetch all events for a session** — `GET /api/sessions/:sessionId`
- [x] **Fetch click data for heatmap** — `GET /api/heatmap?page=<url>`
- [x] **MongoDB** — all events stored via Mongoose
- [x] **Sessions View** — lists all sessions with event count, duration, pages visited
- [x] **User Journey** — click a session to see ordered event timeline
- [x] **Heatmap View** — select a page URL, visualise click positions on a canvas
- [x] **Demo webpage** — `demo/index.html` mock e-commerce store with tracker embedded
- [x] **README** — setup steps, tech stack, assumptions & trade-offs

### Beyond Requirements
- [x] **Dashboard authentication** — JWT login with bcrypt-hashed admin credentials in MongoDB
- [x] **Event API protection** — site token validation + per-IP and per-token rate limiting (see [`SECURITY.md`](./SECURITY.md))
- [x] **TypeScript** — full type safety across backend and frontend
- [x] **Viewport-aware heatmap** — click coordinates normalised to canvas using recorded `vw/vh`, accurate across all screen resolutions
- [x] **Event batching** — tracker batches and flushes every 3s, surviving page unload via `keepalive`

---

## Demo

[![Watch Demo](https://img.shields.io/badge/Watch%20Demo-Vimeo-1ab7ea?style=for-the-badge&logo=vimeo&logoColor=white)](https://vimeo.com/1191883052)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB, Mongoose |
| Frontend | Next.js 14 (App Router), TypeScript |
| Tracking Script | Vanilla JavaScript |
| Auth | JWT + bcryptjs |
| Security | Site tokens + express-rate-limit |

## Project Structure

```
user-analytics-app/
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts     # JWT verification for dashboard routes
│   │   │   └── siteToken.ts         # Site token validation + rate limiters
│   │   ├── models/
│   │   │   ├── Admin.ts             # Admin credentials (bcrypt-hashed)
│   │   │   ├── Event.ts             # Tracked events (clicks, page views)
│   │   │   └── Site.ts              # Registered sites + tokens
│   │   ├── routes/
│   │   │   ├── auth.ts              # POST /api/auth/login
│   │   │   ├── events.ts            # POST /api/events (token-protected)
│   │   │   ├── heatmap.ts           # GET /api/heatmap (JWT-protected)
│   │   │   └── sessions.ts          # GET /api/sessions (JWT-protected)
│   │   ├── scripts/
│   │   │   └── seedAdmin.ts         # Standalone admin seed script
│   │   └── index.ts                 # App entry — seeds admin + demo site on startup
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/page.tsx        # Login page
│   │   │   ├── page.tsx              # Sessions list (JWT-gated)
│   │   │   ├── sessions/[sessionId]/ # Session detail / user journey
│   │   │   └── heatmap/              # Click heatmap
│   │   ├── components/
│   │   │   ├── HeatmapCanvas.tsx
│   │   │   ├── HeatmapClient.tsx
│   │   │   └── LogoutButton.tsx
│   │   └── lib/
│   │       ├── api.ts               # Backend API calls (auth-aware)
│   │       └── auth.ts              # Login / logout server actions
│   ├── middleware.ts                 # Route protection — redirects to /login
│   ├── public/tracker.js            # Embeddable tracking script
│   └── package.json
├── demo/
│   └── index.html                   # Demo e-commerce page with tracker embedded
├── SECURITY.md                      # Security design + implementation details
└── README.md
```

## Setup

### Prerequisites
- Node.js ≥ 18
- A MongoDB URI (local or Atlas)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in MONGODB_URI and JWT_SECRET
npm run dev            # starts on http://localhost:4000
```

On first run the backend automatically seeds:
- Admin user — `admin@admin.com` / `admin@1234!` (bcrypt-hashed)
- Demo site token — `pk_live_demo1234` for origin `http://127.0.0.1:5500`

Environment variables (`backend/.env`):

| Variable | Description |
|---|---|
| `PORT` | Port to listen on (default `4000`) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign admin JWTs |

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # edit if needed
npm run dev                  # starts on http://localhost:3000
```

Visit `http://localhost:3000` — you will be redirected to `/login`.

**Dashboard credentials:**
| Field | Value |
|---|---|
| Email | `admin@admin.com` |
| Password | `admin@1234!` |

Environment variables (`frontend/.env.local`):

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Backend base URL (default `http://localhost:4000`) |

### 3. Demo Page

The demo page must be served from `http://127.0.0.1:5500` — **not** `http://localhost:5500`. The demo site token registered in the database is bound to the origin `http://127.0.0.1:5500`. Opening the page from `localhost:5500` will cause the backend to reject all tracker events with `403 Forbidden`.

```bash
cd demo
npx serve ./ -p 5500
```

Then open **`http://127.0.0.1:5500`** in your browser (not `localhost:5500`).

Interact with the demo page — clicks and page views will appear in the dashboard at `http://localhost:3000`.

## API Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | None | Returns a signed JWT for the admin |
| `POST` | `/api/events` | Site token | Ingest one or more events (array supported) |
| `GET` | `/api/sessions` | JWT | List all sessions with event counts |
| `GET` | `/api/sessions/:sessionId` | JWT | All events for a session, ordered by timestamp |
| `GET` | `/api/heatmap?page=<url>` | JWT | Click coordinates for a specific page URL |
| `GET` | `/api/heatmap/pages` | JWT | Distinct page URLs that have click data |
| `GET` | `/health` | None | Health check |

### Event payload

```json
{
  "site_token": "pk_live_demo1234",
  "session_id": "sess_abc123",
  "event_type": "click",
  "page_url": "http://127.0.0.1:5500/index.html",
  "timestamp": "2026-05-13T10:00:00.000Z",
  "x": 640,
  "y": 360,
  "vw": 1280,
  "vh": 720
}
```

`x`, `y`, `vw`, `vh` are only present for `click` events.

## Embedding the Tracker

```html
<script>
  window.__ANALYTICS_BACKEND__ = 'http://localhost:4000';
  window.__ANALYTICS_SITE_TOKEN__ = 'pk_live_demo1234';
</script>
<script src="http://localhost:3000/tracker.js"></script>
```

The tracker:
- Assigns a `session_id` stored in `localStorage` (persists across page loads)
- Fires a `page_view` event on load
- Records `click` events with `(x, y)` coordinates and viewport dimensions `(vw, vh)`
- Batches events and flushes every 3 seconds or on page hide/unload
- Includes the `site_token` in every payload for backend validation

## Dashboard Features

### Login (`/login`)
- Full-screen login form — email + password
- Credentials validated against the `admins` collection (bcrypt)
- Issues a 7-day httpOnly JWT cookie on success
- All dashboard routes redirect here if unauthenticated

### Sessions View (`/`)
- Summary stats: total sessions, total events, average events per session
- Table of all sessions with event count, unique pages visited, duration, and last-seen time
- Click any session to drill into the user journey

### Session Detail (`/sessions/:sessionId`)
- Full event timeline in chronological order
- Badges distinguish `page_view` and `click` events
- Click coordinates shown inline
- Direct links to the heatmap for each page that has click data

### Heatmap View (`/heatmap`)
- Dropdown auto-populated with pages that have click data
- Canvas-based heatmap with radial gradient dots — orange = high density, blue = sparse
- Coordinates are normalised to the canvas using the recorded viewport size, so clicks from any screen resolution land in the correct position

## Assumptions & Trade-offs

- **Session persistence**: `localStorage` is used for the session ID, so sessions are per-browser. Cookie-based sessions would behave equivalently; `localStorage` was chosen for simplicity.
- **Coordinate system**: Clicks are recorded as `clientX/clientY` (viewport-relative) alongside `vw/vh`. The heatmap normalises these to the canvas, so positions are accurate regardless of the visitor's screen resolution.
- **Batching**: Events are flushed every 3 seconds or on page unload. This reduces HTTP round-trips at the cost of a small delay before data appears in the dashboard.
- **In-memory rate limit store**: The rate limiter resets on server restart. A Redis-backed store would be needed for multi-instance production deployments.
- **No pagination**: The sessions list and event timeline load all records. Cursor-based pagination would be needed for large datasets.

---

## Security

The application implements two layers of security — dashboard authentication and tracker endpoint protection. See [`SECURITY.md`](./SECURITY.md) for the full design, threat model, and implementation details.

**Dashboard** — protected with JWT-based admin authentication. Session and heatmap routes require a valid Bearer token. Login credentials are stored as bcrypt hashes in MongoDB.

**Tracker endpoint** — protected with public site tokens and rate limiting, following the same model used by Segment, PostHog, and Google Analytics. Every website that embeds the tracker must be registered with a site token; the backend rejects events from unknown or revoked tokens before they reach the database.
