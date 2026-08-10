import { browser } from '$app/environment';
import type { UserProfile } from '$lib/api';

function read<T>(key: string, fallback: T): T {
	if (!browser) return fallback;
	try {
		const raw = localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : fallback;
	} catch {
		return fallback;
	}
}

function write(key: string, value: unknown) {
	if (!browser) return;
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		/* ignore quota errors */
	}
}

const SESSION_KEY = 'sanai3i.session';

interface SessionState {
	token: string | null;
	user: UserProfile | null;
}

export const session = $state<SessionState>(read(SESSION_KEY, { token: null, user: null }));

export function setSession(next: SessionState) {
	session.token = next.token;
	session.user = next.user;
	write(SESSION_KEY, session);
}

export function updateUser(user: UserProfile) {
	session.user = user;
	write(SESSION_KEY, session);
}

export function logout() {
	setSession({ token: null, user: null });
}
