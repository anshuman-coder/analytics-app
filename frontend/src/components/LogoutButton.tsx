'use client';

import { logout } from '@/lib/auth';

export default function LogoutButton() {
  return (
    <button
      onClick={() => logout()}
      style={{
        background: 'transparent',
        border: '1px solid #334155',
        color: '#94a3b8',
        padding: '0.3rem 0.85rem',
        borderRadius: '5px',
        fontSize: '0.8rem',
        cursor: 'pointer',
      }}
    >
      Logout
    </button>
  );
}
