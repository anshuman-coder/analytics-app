import type { Metadata } from 'next';
import './globals.css';
import LogoutButton from '@/components/LogoutButton';

export const metadata: Metadata = {
  title: 'Analytics Dashboard',
  description: 'User session and click analytics',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="navbar">
          <span className="navbar-brand">Analytics Dashboard</span>
          <div className="navbar-links" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <a href="/">Sessions</a>
            <a href="/heatmap">Heatmap</a>
            <LogoutButton />
          </div>
        </nav>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
