import { browser } from '$app/environment';

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
		/* ignore */
	}
}

export type Theme = 'light' | 'dark' | 'auto';
export type Lang = 'ar' | 'en';

const PREFS_KEY = 'sanai3i.prefs';

interface PrefsState {
	theme: Theme;
	lang: Lang;
	locNoticeDismissed: boolean;
}

export const prefs = $state<PrefsState>(
	read(PREFS_KEY, { theme: 'auto', lang: 'ar', locNoticeDismissed: false }),
);

export function setTheme(theme: Theme) {
	prefs.theme = theme;
	write(PREFS_KEY, prefs);
}

export function setLang(lang: Lang) {
	prefs.lang = lang;
	write(PREFS_KEY, prefs);
}

export function dismissLocationNotice() {
	prefs.locNoticeDismissed = true;
	write(PREFS_KEY, prefs);
}

export function resetLocationNotice() {
	prefs.locNoticeDismissed = false;
	write(PREFS_KEY, prefs);
}
