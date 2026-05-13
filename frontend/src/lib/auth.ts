'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function login(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  let res: Response;
  try {
    res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return 'Could not reach the server. Make sure the backend is running.';
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return body.error || 'Login failed';
  }

  const { token } = await res.json();
  cookies().set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  redirect('/');
}

export async function logout() {
  cookies().delete('auth_token');
  redirect('/login');
}
