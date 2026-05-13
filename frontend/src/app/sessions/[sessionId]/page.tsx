import { getSessionEvents, AnalyticsEvent } from '@/lib/api';
import { cookies } from 'next/headers';
import Link from 'next/link';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export default async function SessionDetailPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const token = cookies().get('auth_token')?.value;
  const sessionId = decodeURIComponent(params.sessionId);
  let events: AnalyticsEvent[] = [];
  let error = '';

  try {
    events = await getSessionEvents(sessionId, token);
  } catch {
    error = 'Failed to load session events.';
  }

  const pageViews = events.filter((e) => e.event_type === 'page_view').length;
  const clicks = events.filter((e) => e.event_type === 'click').length;
  const duration =
    events.length > 1
      ? (() => {
          const ms =
            new Date(events[events.length - 1].timestamp).getTime() -
            new Date(events[0].timestamp).getTime();
          const s = Math.round(ms / 1000);
          return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
        })()
      : '—';

  // Unique pages that have at least one click in this session
  const pagesWithClicks = [
    ...new Set(
      events.filter((e) => e.event_type === 'click').map((e) => e.page_url)
    ),
  ];

  // All unique pages visited (for the session info table)
  const allPages = [...new Set(events.map((e) => e.page_url))];

  return (
    <>
      <Link href="/" className="back-link">
        ← Back to Sessions
      </Link>

      <h1>User Journey</h1>
      <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.5rem', fontFamily: 'monospace' }}>
        {sessionId}
      </p>

      {error && <div className="error">{error}</div>}

      {/* ── Stats ── */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="label">Total Events</div>
          <div className="value">{events.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Page Views</div>
          <div className="value">{pageViews}</div>
        </div>
        <div className="stat-card">
          <div className="label">Clicks</div>
          <div className="value">{clicks}</div>
        </div>
        <div className="stat-card">
          <div className="label">Duration</div>
          <div className="value" style={{ fontSize: '1.25rem' }}>{duration}</div>
        </div>
      </div>

      {/* ── Event Timeline ── */}
      <div className="card">
        <h2>Event Timeline</h2>
        {events.length === 0 && !error ? (
          <p className="empty">No events found for this session.</p>
        ) : (
          <ul className="timeline">
            {events.map((ev, i) => (
              <li key={ev._id ?? i} className={ev.event_type === 'click' ? 'click-event' : ''}>
                <span>
                  <span
                    className="badge"
                    style={{
                      background: ev.event_type === 'click' ? '#fff7ed' : '#eff6ff',
                      color: ev.event_type === 'click' ? '#c2410c' : '#1d4ed8',
                    }}
                  >
                    {ev.event_type === 'page_view' ? '📄 page_view' : '🖱️ click'}
                  </span>
                  {ev.event_type === 'click' && ev.x != null && (
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '0.5rem' }}>
                      ({ev.x}, {ev.y})
                    </span>
                  )}
                  <span className="ev-time">{formatTime(ev.timestamp)}</span>
                </span>
                <span className="ev-url">{ev.page_url}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Heatmap Navigation ── */}
      {pagesWithClicks.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2>Click Heatmap</h2>
            <span className="badge badge-green">{clicks} clicks recorded</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1.25rem' }}>
            View click positions plotted on a heatmap canvas for each page visited in this session.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pagesWithClicks.map((page) => {
              const clickCount = events.filter(
                (e) => e.event_type === 'click' && e.page_url === page
              ).length;
              return (
                <div
                  key={page}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.2rem' }}>
                      Page URL
                    </div>
                    <div
                      style={{
                        fontSize: '0.85rem',
                        wordBreak: 'break-all',
                        color: '#1e293b',
                        fontFamily: 'monospace',
                      }}
                    >
                      {page}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    <span className="badge badge-blue">{clickCount} clicks</span>
                    <Link
                      href={`/heatmap?page=${encodeURIComponent(page)}`}
                      className="btn-primary"
                      style={{
                        padding: '0.45rem 1rem',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        textDecoration: 'none',
                        display: 'inline-block',
                        background: '#0f172a',
                        color: '#fff',
                      }}
                    >
                      View Heatmap →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Session Info ── */}
      {events.length > 0 && (
        <div className="card">
          <h2>Session Info</h2>
          <table style={{ fontSize: '0.85rem' }}>
            <tbody>
              <tr>
                <td style={{ padding: '0.4rem 0.75rem', color: '#64748b', width: '140px' }}>Started</td>
                <td style={{ padding: '0.4rem 0.75rem' }}>{formatDate(events[0].timestamp)}</td>
              </tr>
              <tr>
                <td style={{ padding: '0.4rem 0.75rem', color: '#64748b' }}>Last Event</td>
                <td style={{ padding: '0.4rem 0.75rem' }}>{formatDate(events[events.length - 1].timestamp)}</td>
              </tr>
              <tr>
                <td style={{ padding: '0.4rem 0.75rem', color: '#64748b' }}>Pages Visited</td>
                <td style={{ padding: '0.4rem 0.75rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {allPages.map((p) => (
                      <span key={p} style={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '0.4rem 0.75rem', color: '#64748b' }}>Session ID</td>
                <td style={{ padding: '0.4rem 0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {sessionId}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
