import { browser } from '$app/environment';
import { api } from '$lib/api';
import { prefs } from './prefs.svelte';

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

export type LocSource = 'gps' | 'ip';

export interface UserLocation {
	lat: number;
	lng: number;
	city?: string;
	country?: string;
	approximate: boolean;
	source: LocSource;
}

const LOC_KEY = 'sanai3i.location';

// Svelte forbids exporting module state that gets reassigned, so we keep the
// value inside a mutable wrapper and expose it through `.value`.
export const location = $state<{ value: UserLocation | null }>({
	value: read(LOC_KEY, null),
});

export function setLocation(loc: UserLocation | null) {
	location.value = loc;
	write(LOC_KEY, loc);
}

function gps(): Promise<UserLocation | null> {
	return new Promise((resolve) => {
		if (!browser || !navigator.geolocation) return resolve(null);
		navigator.geolocation.getCurrentPosition(
			(pos) =>
				resolve({
					lat: pos.coords.latitude,
					lng: pos.coords.longitude,
					approximate: false,
					source: 'gps',
				}),
			() => resolve(null),
			{ timeout: 8000, maximumAge: 600000 },
		);
	});
}

async function byIp(): Promise<UserLocation | null> {
	try {
		const data = await api<{ lat: number | null; lng: number | null; city?: string; country?: string }>(
			'/api/geo/ip',
		);
		if (typeof data.lat === 'number' && typeof data.lng === 'number') {
			return {
				lat: data.lat,
				lng: data.lng,
				city: data.city,
				country: data.country,
				approximate: true,
				source: 'ip',
			};
		}
	} catch {
		/* API unreachable */
	}
	return null;
}

/** Try GPS first, fall back to IP geolocation. Returns true when a usable location was set. */
export async function detectLocation(): Promise<boolean> {
	const gpsLoc = await gps();
	if (gpsLoc) {
		setLocation(gpsLoc);
		return true;
	}
	const ipLoc = await byIp();
	if (ipLoc) {
		setLocation(ipLoc);
		return true;
	}
	return false;
}

/**
 * Show the "adjust your location" notice on every open until the user
 * presses "Don't show again", and also whenever we only have an approximate
 * (IP) location.
 */
export function shouldShowLocationNotice(): boolean {
	if (prefs.locNoticeDismissed) return false;
	return !location.value || location.value.approximate;
}
