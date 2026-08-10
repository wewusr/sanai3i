<script lang="ts">
	import { onMount } from 'svelte';
	import { api, type Booking, type TechnicianDetail, type Trade } from '$lib/api';
	import { t, tNum } from '$lib/i18n';
	import { session, updateUser } from '$lib/stores/session.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { goto } from '$app/navigation';
	import { location } from '$lib/stores/location.svelte';
	import BookingCard from '$lib/components/BookingCard.svelte';
	import StarRating from '$lib/components/StarRating.svelte';

	let bookings = $state<Booking[]>([]);
	let me = $state<TechnicianDetail | null>(null);
	let trades = $state<Trade[]>([]);
	let loading = $state(true);

	let tradeId = $state('');
	let bio = $state('');
	let area = $state('');
	let approxArrivalMin = $state(30);
	let savingProfile = $state(false);

	async function load() {
		const [b, tRes, tech] = await Promise.all([
			api<{ bookings: Booking[] }>('/api/bookings', { token: session.token }).catch(() => ({ bookings: [] })),
			api<{ trades: Trade[] }>('/api/trades').catch(() => ({ trades: [] })),
			api<{ technician: TechnicianDetail }>('/api/technicians/me', { token: session.token }).catch(() => null),
		]);
		bookings = b.bookings;
		trades = tRes.trades;
		if (tech) {
			me = tech.technician;
			tradeId = String(tech.technician.trade.id);
			bio = tech.technician.bio;
			area = tech.technician.area;
			approxArrivalMin = tech.technician.approxArrivalMin;
		}
		loading = false;
	}

	onMount(load);

	$effect(() => {
		if (!session.user) {
			goto('/auth/login?next=/dashboard');
			return;
		}
		if (session.user.type !== 'technician') {
			goto('/bookings');
		}
	});

	async function toggleAvailability() {
		if (!me) return;
		await api('/api/technicians/me', {
			method: 'PUT',
			token: session.token,
			body: { availability: me.availability === 'on' ? 'off' : 'on' },
		});
		load();
	}

	async function saveProfile() {
		savingProfile = true;
		try {
			await api('/api/technicians/me', {
				method: 'PUT',
				token: session.token,
				body: {
					tradeId: Number(tradeId),
					bio,
					area,
					approxArrivalMin,
					lat: location.value?.lat ?? null,
					lng: location.value?.lng ?? null,
				},
			});
			const u = await api<{ user: import('$lib/api').UserProfile }>('/api/auth/me', { token: session.token });
			updateUser(u.user);
			toast(t('profileSaved'), 'success');
			load();
		} catch (e) {
			toast(e instanceof Error ? e.message : t('error'), 'error');
		} finally {
			savingProfile = false;
		}
	}

	const incoming = $derived(bookings.filter((b) => b.status === 'pending'));
	const active = $derived(bookings.filter((b) => b.status === 'accepted' || b.status === 'started'));
	const past = $derived(bookings.filter((b) => b.status === 'completed' || b.status === 'cancelled' || b.status === 'declined'));
</script>

<svelte:head>
	<title>{t('myDashboard')} — {t('appName')}</title>
</svelte:head>

{#if loading}
	<p class="py-16 text-center text-stone-400">{t('loading')}</p>
{:else}
	<section class="flex flex-col gap-4">
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-extrabold">🛠️ {t('myDashboard')}</h1>
			<button
				class="rounded-2xl px-4 py-2.5 text-sm font-extrabold transition {me?.availability === 'on'
					? 'bg-emerald-500 text-white hover:bg-emerald-600'
					: 'bg-stone-200 text-stone-600 hover:bg-stone-300 dark:bg-zinc-800 dark:text-zinc-300'}"
				onclick={toggleAvailability}
			>
				{me?.availability === 'on' ? '🟢 ' + t('availableNow') : '⚪ ' + t('notAvailable')}
			</button>
		</div>

		<div class="grid grid-cols-3 gap-2">
			<div class="rounded-3xl bg-white p-4 text-center ring-1 ring-stone-200 dark:bg-zinc-900 dark:ring-zinc-800">
				<p class="text-2xl font-extrabold text-amber-500">{incoming.length}</p>
				<p class="text-xs font-bold text-stone-500 dark:text-zinc-400">{t('incomingRequests')}</p>
			</div>
			<div class="rounded-3xl bg-white p-4 text-center ring-1 ring-stone-200 dark:bg-zinc-900 dark:ring-zinc-800">
				<p class="text-2xl font-extrabold text-indigo-500">{active.length}</p>
				<p class="text-xs font-bold text-stone-500 dark:text-zinc-400">{t('activeJobs')}</p>
			</div>
			<div class="rounded-3xl bg-white p-4 text-center ring-1 ring-stone-200 dark:bg-zinc-900 dark:ring-zinc-800">
				<p class="text-2xl font-extrabold text-emerald-500">{me ? tNum(me.avgRating) : '—'}</p>
				<p class="text-xs font-bold text-stone-500 dark:text-zinc-400">⭐ {t('reviewsReceived')}</p>
			</div>
		</div>

		<section>
			<h2 class="mb-2 text-sm font-bold text-stone-500 dark:text-zinc-400">{t('incomingRequests')}</h2>
			{#if incoming.length === 0}
				<p class="rounded-2xl bg-white p-6 text-center text-sm text-stone-400 ring-1 ring-stone-200 dark:bg-zinc-900 dark:ring-zinc-800">{t('noRequests')}</p>
			{:else}
				<ul class="flex flex-col gap-3">
					{#each incoming as b}
						<li><BookingCard booking={b} onchange={load} /></li>
					{/each}
				</ul>
			{/if}
		</section>

		<section>
			<h2 class="mb-2 text-sm font-bold text-stone-500 dark:text-zinc-400">{t('activeJobs')}</h2>
			{#if active.length === 0}
				<p class="rounded-2xl bg-white p-6 text-center text-sm text-stone-400 ring-1 ring-stone-200 dark:bg-zinc-900 dark:ring-zinc-800">{t('noJobs')}</p>
			{:else}
				<ul class="flex flex-col gap-3">
					{#each active as b}
						<li><BookingCard booking={b} onchange={load} /></li>
					{/each}
				</ul>
			{/if}
		</section>

		{#if past.length > 0}
			<section>
				<h2 class="mb-2 text-sm font-bold text-stone-500 dark:text-zinc-400">{t('pastJobs')}</h2>
				<ul class="flex flex-col gap-3">
					{#each past as b}
						<li><BookingCard booking={b} onchange={load} /></li>
					{/each}
				</ul>
			</section>
		{/if}

		<div class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200 dark:bg-zinc-900 dark:ring-zinc-800">
			<h2 class="mb-4 text-lg font-extrabold">🧑‍🔧 {t('yourProfile')}</h2>

			{#if me}
				<div class="mb-4 flex items-center gap-3 rounded-2xl bg-stone-100 p-3 dark:bg-zinc-800">
					<span class="grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl ring-1 ring-stone-200 dark:bg-zinc-900 dark:ring-zinc-700">{me.trade.icon}</span>
					<div class="flex-1">
						<p class="font-extrabold">{me.fullName}</p>
						<p class="text-xs text-stone-500 dark:text-zinc-400">⭐ {tNum(me.avgRating)} ({me.reviewCount})</p>
					</div>
					<StarRating value={me.avgRating} />
				</div>
			{/if}

			<div class="grid gap-3 sm:grid-cols-2">
				<label class="text-sm font-bold">
					{t('setTrade')}
					<select class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800" bind:value={tradeId}>
						{#each trades as tr}
							<option value={tr.id}>{tr.icon} {tr.nameAr} — {tr.nameEn}</option>
						{/each}
					</select>
				</label>
				<label class="text-sm font-bold">
					{t('serviceArea')}
					<input class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800" bind:value={area} placeholder={t('areaPlaceholder')} />
				</label>
				<label class="text-sm font-bold">
					{t('arrivalTime')} <span class="font-normal text-stone-400">({t('minutes')})</span>
					<input class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800" type="number" min="5" max="600" bind:value={approxArrivalMin} />
				</label>
			</div>
			<label class="mt-3 block text-sm font-bold">
				{t('bio')}
				<textarea class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800" rows="2" bind:value={bio} placeholder={t('bioPlaceholder')}></textarea>
			</label>
			<button class="mt-4 rounded-2xl bg-amber-500 px-6 py-2.5 font-extrabold text-white transition hover:bg-amber-600 disabled:opacity-60" onclick={saveProfile} disabled={savingProfile}>
				{savingProfile ? t('loading') : t('saveProfile')}
			</button>
		</div>
	</section>
{/if}
