// In dev, requests are proxied to the local API (see vite.config.js).
// In production set PUBLIC_API_URL at build time (e.g. your Worker URL).

export class ApiError extends Error {
	status: number;
	constructor(message: string, status: number) {
		super(message);
		this.status = status;
	}
}

interface ApiOptions {
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH';
	body?: unknown;
	token?: string | null;
}

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
	const base = (import.meta.env.PUBLIC_API_URL as string | undefined) ?? '';
	const headers: Record<string, string> = {};
	if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
	if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;

	const res = await fetch(base + path, {
		method: opts.method ?? 'GET',
		headers,
		body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
	});

	let data: unknown = null;
	try {
		data = await res.json();
	} catch {
		/* non-JSON response */
	}

	if (!res.ok) {
		const message =
			(data && typeof data === 'object' && 'error' in data
				? String((data as { error: unknown }).error)
				: `Request failed (${res.status})`);
		throw new ApiError(message, res.status);
	}

	return data as T;
}

export interface Trade {
	id: number;
	nameAr: string;
	nameEn: string;
	icon: string;
}

export interface TechnicianSummary {
	id: number;
	fullName: string;
	area: string;
	phone: string;
	trade: Trade;
	bio: string;
	availability: 'on' | 'off';
	approxArrivalMin: number;
	avgRating: number;
	reviewCount: number;
	distanceKm: number | null;
}

export interface Review {
	stars: number;
	comment: string;
	createdAt: string;
	reviewer: string;
}

export interface TechnicianDetail extends TechnicianSummary {
	reviews: Review[];
}

export interface UserProfile {
	id: number;
	type: 'user' | 'technician';
	fullName: string;
	email: string;
	phone: string;
	address: string;
	area: string;
	lang: string;
	theme: string;
	technician: {
		id: number;
		trade: Trade | null;
		bio: string;
		availability: 'on' | 'off';
		approxArrivalMin: number;
		avgRating: number;
		reviewCount: number;
	} | null;
}

export type BookingStatus =
	| 'pending'
	| 'accepted'
	| 'started'
	| 'completed'
	| 'cancelled'
	| 'declined';

export interface Booking {
	id: number;
	status: BookingStatus;
	serviceType: string;
	notes: string;
	requestedTime: string;
	createdAt: string;
	address: string | null;
	technician: {
		id: number;
		fullName: string;
		area: string;
		availability: 'on' | 'off';
		trade: { icon: string; nameAr: string; nameEn: string };
		phone: string | null;
	};
	client: {
		id: number;
		fullName: string;
		phone: string | null;
	};
	rateable: boolean;
	reviewed: boolean;
}
