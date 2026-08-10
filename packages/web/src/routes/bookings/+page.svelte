<script lang="ts">
	import { onMount } from 'svelte';
	import { api, type Booking, type BookingStatus } from '$lib/api';
	import { t } from '$lib/i18n';
	import { session } from '$lib/stores/session.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import BookingCard from '$lib/components/BookingCard.svelte';

	type Filter = 'all' | BookingStatus;

	let bookings = $state<Booking[]>([]);
	let filter = $state<Filter>('all');
	let loading = $state(true);

	async function load() {
		loading = true;
		try {
			const params = new URLSearchParams();
			if (filter !== 'all') params.set('status', filter);
			const res = await api<{ bookings: Booking[] }>(`/api/bookings?${params}`, {
				token: session.token,
			});
			bookings = res.bookings;
		} catch (e) {
			bookings = [];
		} finally {
			loading = false;
		}
	}

	onMount(load);

	$effect(() => {
		if (!session.user) {
			goto('/auth/login?next=/bookings');
			return;
		}
		if (session.user.type === 'technician') {
			goto('/dashboard');
			return;
		}
		if (filter !== 'all') load();
	});

	const filters: { key: Filter; label: string }[] = [
		{ key: 'all', label: t('viewAll') },
		{ key: 'pending', label: t('pending') },
		{ key: 'accepted', label: t('accepted') },
		{ key: 'started', label: t('started') },
		{ key: 'completed', label: t('completed') },
		{ key: 'cancelled', label: t('cancelled') },
		{ key: 'declined', label: t('declined') },
	];
</script>

<svelte:head>
	<title>{t('myBookings')} — {t('appName')}</title>
</svelte:head>

<section class="flex flex-col gap-4">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-extrabold">📋 {t('myBookings')}</h1>
		<a class="rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-amber-600" href="/">
			+ {t('newRequest')}
		</a>
	</div>

	<div class="flex gap-2 overflow-x-auto pb-2">
		{#each filters as f}
			<button
				class="shrink-0 rounded-2xl px-3 py-2 text-sm font-bold transition {filter === f.key
					? 'bg-amber-500 text-white'
					: 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-amber-50 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-800 dark:hover:bg-zinc-800'}"
				onclick={() => {
					filter = f.key;
					load();
				}}
			>
				{f.label}
			</button>
		{/each}
	</div>

	{#if loading}
		<p class="py-16 text-center text-stone-400">{t('loading')}</p>
	{:else if bookings.length === 0}
		<div class="rounded-2xl bg-white p-8 text-center ring-1 ring-stone-200 dark:bg-zinc-900 dark:ring-zinc-800">
			<p class="text-3xl">🫙</p>
			<p class="mt-2 font-bold">{t('noBookings')}</p>
			<p class="text-sm text-stone-500 dark:text-zinc-400">{t('noBookingsHint')}</p>
		</div>
	{:else}
		<ul class="flex flex-col gap-3">
			{#each bookings as b}
				<li><BookingCard booking={b} onchange={load} /></li>
			{/each}
		</ul>
	{/if}
</section>
