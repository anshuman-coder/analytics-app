'use client';

import { useState, useEffect } from 'react';
import { ClickPoint, getHeatmapData } from '@/lib/api';
import HeatmapCanvas from './HeatmapCanvas';

interface Props {
  pages: string[];
  initialPage?: string;
  token?: string;
}

export default function HeatmapClient({ pages, initialPage = '', token }: Props) {
  const [selectedPage, setSelectedPage] = useState(initialPage);
  const [clicks, setClicks] = useState<ClickPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load(page: string) {
    if (!page) return;
    setLoading(true);
    setError('');
    try {
      const data = await getHeatmapData(page, token);
      setClicks(data);
    } catch {
      setError('Failed to load heatmap data.');
    } finally {
      setLoading(false);
    }
  }

  // Auto-load when arriving from a session detail link
  useEffect(() => {
    if (initialPage) load(initialPage);
  }, [initialPage]);

  return (
    <>
      <div className="card">
        <h2>Select a Page</h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {pages.length > 0 ? (
            <select value={selectedPage} onChange={(e) => setSelectedPage(e.target.value)}>
              <option value="">— choose a page —</option>
              {pages.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="Enter page URL (e.g. http://localhost:5500/demo/index.html)"
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
            />
          )}
          <button
            className="btn-primary"
            onClick={() => load(selectedPage)}
            disabled={!selectedPage || loading}
          >
            {loading ? 'Loading…' : 'Show Heatmap'}
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {clicks.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Click Heatmap</h2>
            <span className="badge badge-blue">{clicks.length} clicks</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem', wordBreak: 'break-all' }}>
            Page: {selectedPage}
          </p>
          <div className="heatmap-wrap">
            <HeatmapCanvas clicks={clicks} width={1280} height={720} />
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.75rem' }}>
            Coordinates are relative to the viewport at time of click.
            Orange = high density, fading to blue = sparse.
          </p>
        </div>
      )}

      {!loading && clicks.length === 0 && selectedPage && (
        <div className="card">
          <p className="empty">No click data found for this page yet.</p>
        </div>
      )}
    </>
  );
}
