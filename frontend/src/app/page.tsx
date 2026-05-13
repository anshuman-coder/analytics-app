import { getSessions, Session } from '@/lib/api';
import { cookies } from 'next/headers';
import Link from 'next/link';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

function duration(first: string, last: string) {
  const ms = new Date(last).getTime() - new Date(first).getTime();
  if (ms < 1000) return '<1s';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem}s`;
}

export default async function SessionsPage() {
  const token = cookies().get('auth_token')?.value;
  let sessions: Session[] = [];
  let error = '';

  try {
    sessions = await getSessions(token);
  } catch {
    error = 'Could not connect to the backend. Make sure it is running on port 4000.';
  }

  return (
    <>
      <h1>Sessions</h1>

      {error && <div className="error">{error}</div>}

      <div className="stats-row">
        <div className="stat-card">
          <div className="label">Total Sessions</div>
          <div className="value">{sessions.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Events</div>
          <div className="value">{sessions.reduce((s, x) => s + x.event_count, 0)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Avg Events / Session</div>
          <div className="value">
            {sessions.length
              ? Math.round(sessions.reduce((s, x) => s + x.event_count, 0) / sessions.length)
              : 0}
          </div>
        </div>
      </div>

      <div className="card">
        {sessions.length === 0 && !error ? (
          <p className="empty">
            No sessions yet. Open the demo page and interact with it to generate data.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Events</th>
                  <th>Pages</th>
                  <th>Duration</th>
                  <th>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.session_id} className="clickable">
                    <td>
                      <Link
                        href={`/sessions/${encodeURIComponent(s.session_id)}`}
                        style={{ color: '#0ea5e9', textDecoration: 'none', fontFamily: 'monospace', fontSize: '0.8rem' }}
                      >
                        {s.session_id}
                      </Link>
                    </td>
                    <td>
                      <span className="badge badge-blue">{s.event_count}</span>
                    </td>
                    <td>{s.pages_visited}</td>
                    <td>{duration(s.first_seen, s.last_seen)}</td>
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{formatDate(s.last_seen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
