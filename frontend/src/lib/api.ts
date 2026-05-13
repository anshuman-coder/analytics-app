const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export interface Session {
  session_id: string;
  event_count: number;
  first_seen: string;
  last_seen: string;
  pages_visited: number;
}

export interface AnalyticsEvent {
  _id: string;
  session_id: string;
  event_type: 'page_view' | 'click';
  page_url: string;
  timestamp: string;
  x?: number;
  y?: number;
}

export interface ClickPoint {
  x: number;
  y: number;
  vw?: number;
  vh?: number;
  timestamp: string;
}

function authHeaders(token?: string): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getSessions(token?: string): Promise<Session[]> {
  const res = await fetch(`${BASE}/api/sessions`, {
    cache: 'no-store',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
}

export async function getSessionEvents(sessionId: string, token?: string): Promise<AnalyticsEvent[]> {
  const res = await fetch(`${BASE}/api/sessions/${sessionId}`, {
    cache: 'no-store',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to fetch session events');
  return res.json();
}

export async function getHeatmapData(page: string, token?: string): Promise<ClickPoint[]> {
  const res = await fetch(`${BASE}/api/heatmap?page=${encodeURIComponent(page)}`, {
    cache: 'no-store',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to fetch heatmap data');
  return res.json();
}

export async function getHeatmapPages(token?: string): Promise<string[]> {
  const res = await fetch(`${BASE}/api/heatmap/pages`, {
    cache: 'no-store',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to fetch pages');
  return res.json();
}
