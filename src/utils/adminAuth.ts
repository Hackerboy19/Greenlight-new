/**
 * Admin CMS session handling: sign-in, token storage, and authenticated fetch.
 *
 * The signed JWT from POST /api/auth/login is kept in localStorage until it
 * expires or the user signs out. authFetch() attaches it as a Bearer token and
 * clears the session when the server answers 401.
 */

export type AdminRole = 'admin' | 'editor' | 'author';

export interface AdminUser {
  id: number | string;
  name: string;
  email: string;
  role: AdminRole;
}

export interface AdminSession {
  token: string;
  user: AdminUser;
  /** Epoch milliseconds, read from the token's exp claim. */
  expiresAt: number;
}

const STORAGE_KEY = 'greenlight_admin_session';

/** Fired on window when the stored session is rejected or expires. */
export const SESSION_EXPIRED_EVENT = 'greenlight-admin-session-expired';

function readTokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof json.exp === 'number' ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function loadSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AdminSession;
    if (!session?.token || !session.user || !(session.expiresAt > Date.now())) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function saveSession(session: AdminSession) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage blocked (private mode): the session lasts until the page reloads.
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Exchanges email and password for a session. Throws with a readable message on failure. */
export async function signIn(email: string, password: string): Promise<AdminSession> {
  let res: Response;
  try {
    res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }

  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.token || !body?.user) {
    throw new Error(body?.message || `Sign-in failed (status ${res.status}).`);
  }

  const session: AdminSession = {
    token: body.token,
    user: body.user,
    expiresAt: readTokenExpiry(body.token) ?? Date.now() + 60 * 60 * 1000
  };
  saveSession(session);
  return session;
}

/**
 * fetch() with the admin Bearer token attached. A 401 response means the
 * token is no longer valid, so the session is cleared and listeners notified.
 */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const session = loadSession();
  const headers = new Headers(init.headers);
  if (session) headers.set('Authorization', `Bearer ${session.token}`);

  const res = await fetch(input, { ...init, headers });
  if (res.status === 401 && session) {
    clearSession();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
  return res;
}

/** Confirms the stored token with the server. Returns the user, or null when signed out. */
export async function verifySession(): Promise<AdminUser | null> {
  if (!loadSession()) return null;
  try {
    const res = await authFetch('/api/auth/me');
    if (!res.ok) return null;
    const body = await res.json();
    return body?.user ?? null;
  } catch {
    // Offline: keep the local session and let the next request decide.
    return loadSession()?.user ?? null;
  }
}
