# Security Design Document — Tracker Endpoint Protection

## Status: Implemented

This document covers the security architecture implemented for protecting the event ingestion API (`POST /api/events`). Both layers — site token validation and rate limiting — are live in the codebase. The dashboard is separately protected with JWT-based admin authentication.

---

## Problem Statement

The `tracker.js` script is designed to be embedded on any webpage. When a page loads the script, the browser's network tab immediately reveals the backend endpoint it posts to:

```
POST http://<backend>/api/events
```

Because this endpoint must remain accessible without user authentication (the tracker runs in a public browser context and cannot safely hold a secret), any party who observes this URL can:

- **Flood the database** with arbitrary, malformed, or fabricated event data
- **Corrupt analytics** by injecting fake sessions, clicks, or page views
- **Exhaust server resources** through high-volume automated requests

This is not a theoretical risk — the endpoint is trivially discoverable in any browser and requires zero authentication to abuse.

---

## Threat Model

| Threat | Likelihood | Impact |
|---|---|---|
| Casual abuse via browser console | High | Medium — dirty data in DB |
| Automated flood from a script | Medium | High — DB bloat, server strain |
| Competitor injecting false analytics | Low | High — misleading business data |
| Credential theft (no secret in tracker) | N/A | Not applicable by design |

The primary attack surface is **unauthenticated write access to a publicly visible endpoint**. There is no sensitive data being read — **data integrity and availability** are the concerns.

---

## Implemented Solution: Site Tokens + Rate Limiting

### Layer 1 — Public Site Tokens (Source Validation)

Each website that legitimately embeds the tracker is issued a **public site token** (e.g. `pk_live_demo1234`). This token is:

- Stored in a `Site` collection in MongoDB with the allowed origin URL and an `active` flag
- Set on the host page via `window.__ANALYTICS_SITE_TOKEN__` before `tracker.js` loads
- Included in every event payload as `site_token`
- Validated by the `validateSiteToken` middleware on every `POST /api/events` request

```html
<!-- Host page -->
<script>
  window.__ANALYTICS_BACKEND__ = 'http://localhost:4000';
  window.__ANALYTICS_SITE_TOKEN__ = 'pk_live_demo1234';
</script>
<script src="http://localhost:3000/tracker.js"></script>
```

The backend rejects any request with a missing, unknown, or revoked token:

```
HTTP 403 Forbidden — { "error": "Invalid site token." }
HTTP 403 Forbidden — { "error": "Site token has been revoked." }
HTTP 403 Forbidden — { "error": "Origin not allowed for this token." }
```

**Why this is safe to make public:**
The token identifies the *source*, not a secret credential. If abused it can be revoked instantly by flipping `active: false` in the database — no code change or redeployment needed. This is the same model used by Segment (`write_key`), PostHog (`project_api_key`), and Google Analytics (`G-XXXXXXX`).

**Why this stops casual abuse:**
An attacker injecting tracker.js into a random site via the browser console would have no valid token. Without a registered token the request is rejected before touching the events collection.

---

### Layer 2 — Rate Limiting (Abuse Throttling)

Even with a valid token, a compromised or abused token should not be able to flood the backend. Two rate limiters are applied in sequence before token validation:

- **Per-IP limit** (`eventLimiter`): 120 requests / minute — catches automated scripts from a single IP with no DB involvement
- **Per-token limit** (`tokenLimiter`): 500 requests / minute — catches distributed abuse across multiple IPs using the same token

Both are implemented with `express-rate-limit`. The per-token limiter uses a custom `keyGenerator` that reads `req.body.site_token`.

```
Exceeded response: HTTP 429 — { "error": "Too many requests, slow down." }
```

---

## Request Pipeline — `POST /api/events`

```
Browser (demo page or any embedded site)
    │
    │  POST /api/events
    │  { site_token, session_id, event_type, x, y, vw, vh, ... }
    ▼
┌─────────────────────────────────────────────────┐
│                  Express Backend                │
│                                                 │
│  1. eventLimiter (express-rate-limit)           │
│     └─ 120 req/min per IP → 429 if exceeded     │
│                                                 │
│  2. tokenLimiter (express-rate-limit)           │
│     └─ 500 req/min per site_token → 429         │
│                                                 │
│  3. validateSiteToken middleware                 │
│     ├─ missing token          → 403             │
│     ├─ token not in DB        → 403             │
│     ├─ token active: false    → 403             │
│     └─ origin mismatch        → 403             │
│                                                 │
│  4. eventsRouter — store in MongoDB             │
└─────────────────────────────────────────────────┘
```

---

## Data Model — Site Collection

```ts
// backend/src/models/Site.ts
interface ISite {
  token: string;          // "pk_live_demo1234" — public, unique
  name: string;           // human label, e.g. "Demo Store"
  allowed_origin: string; // "http://127.0.0.1:5500" — checked against Origin header
  active: boolean;        // flip to false to revoke instantly
  createdAt: Date;        // auto-managed by Mongoose timestamps
}
```

Revocation is a single DB update — no code change or server restart required.

---

## Implementation — What Was Built

### Backend (`backend/src/`)

| File | What it does |
|---|---|
| `models/Site.ts` | Mongoose model for registered sites |
| `middleware/siteToken.ts` | `eventLimiter`, `tokenLimiter`, `validateSiteToken` |
| `index.ts` | Wires middlewares to `POST /api/events`; seeds demo site on startup |

Startup seeding in `index.ts`:
```ts
async function seedDemoSite() {
  const token = 'pk_live_demo1234';
  const exists = await Site.findOne({ token });
  if (!exists) {
    await Site.create({
      token,
      name: 'Demo Store',
      allowed_origin: 'http://127.0.0.1:5500',
      active: true,
    });
    console.log(`Demo site seeded — token: ${token}`);
  }
}
```

### Tracker (`frontend/public/tracker.js`)

- Reads `window.__ANALYTICS_SITE_TOKEN__` at initialisation
- Includes `site_token` in every event via `baseEvent()`
- Emits a `console.warn` if no token is configured

### Demo Page (`demo/index.html`)

```html
<script>
  window.__ANALYTICS_BACKEND__ = 'http://localhost:4000';
  window.__ANALYTICS_SITE_TOKEN__ = 'pk_live_demo1234';
</script>
```

---

## Dashboard Authentication

Separate from tracker security, the analytics dashboard itself is protected:

- `POST /api/auth/login` — validates email + bcrypt password against the `admins` collection, returns a signed 7-day JWT
- `GET /api/sessions`, `GET /api/heatmap/*` — require `Authorization: Bearer <token>`
- `POST /api/events` — site-token protected (not JWT — tracker has no user session)
- Next.js middleware redirects unauthenticated users to `/login` before any page renders
- JWT stored as an httpOnly cookie — not accessible via JavaScript

Admin credentials are seeded automatically on backend startup alongside the demo site token.

---

## Local Development

No manual setup is required beyond running `npm run dev` in the backend. On first startup:

1. Admin user `admin@admin.com` is created with a bcrypt-hashed password
2. Demo site `pk_live_demo1234` is registered for origin `http://127.0.0.1:5500`

The tracker in `demo/index.html` already has `window.__ANALYTICS_SITE_TOKEN__` set to `pk_live_demo1234`, so it works out of the box.

> If you add the tracker to a different local URL, create a new `Site` document in MongoDB with the correct `allowed_origin` and use that token in your page.

---

## Trade-offs & Limitations

| Consideration | Detail |
|---|---|
| Token is visible in page source | By design — it identifies the source, not a secret. Revocation is the mitigation. |
| Origin header can be spoofed server-side | `curl` can send any `Origin`. The token is the primary control; origin is a secondary check that stops browser-based abuse. |
| In-memory rate limit store | Resets on server restart. A Redis-backed store (`ioredis`) would be needed for multi-instance production deployments. |
| Distributed abuse with a valid token | A botnet could stay under per-IP limits. Per-token limits cap total damage regardless of source count. |
| No fabrication prevention for valid token holders | A legitimate site owner could post fake events. Out of scope — trust is granted at token issuance. |

---

## Out of Scope

- **HMAC request signing** — requires exposing a signing secret in the browser, defeating the purpose
- **Bot detection / behavioural analysis** — valid production extension, separate concern
- **Pagination and DB-level write quotas** — infrastructure concern, complementary but independent
- **Multi-tenant site management UI** — a dashboard page to issue/revoke tokens per site would be the natural next step
