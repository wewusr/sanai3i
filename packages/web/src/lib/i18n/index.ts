import { prefs } from '$lib/stores/prefs.svelte';
import { dictionaries } from './dict';

export function t(key: string): string {
	const dict = dictionaries[prefs.lang] ?? dictionaries.ar;
	return dict[key] ?? dictionaries.en[key] ?? key;
}

export function tNum(value: number | null | undefined, decimals = 1): string {
	if (value === null || value === undefined) return '';
	const locale = prefs.lang === 'ar' ? 'ar-EG' : 'en-US';
	return value.toLocaleString(locale, { maximumFractionDigits: decimals });
}

export function tDate(iso: string): string {
	const locale = prefs.lang === 'ar' ? 'ar-EG' : 'en-US';
	const d = new Date(iso.replace(' ', 'T') + 'Z');
	return d.toLocaleDateString(locale, { day: 'numeric', month: 'long' });
}
