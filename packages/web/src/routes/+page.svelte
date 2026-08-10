<script lang="ts">
	import { onMount } from 'svelte';
	import { api, type Trade, type TechnicianSummary } from '$lib/api';
	import { t, tNum } from '$lib/i18n';
	import { location } from '$lib/stores/location.svelte';
	import { prefs } from '$lib/stores/prefs.svelte';
	import TechCard from '$lib/components/TechCard.svelte';

	let trades = $state<Trade[]>([]);
	let techs = $state<TechnicianSummary[]>([]);
	let loading = $state(true);
	let searching = $state(false);
	let query = $state('');
	let selectedTrade = $state<number | null>(null);

	onMount(async () => {
		const [tradesRes, techsRes] = await Promise.all([
			api<{ trades: Trade[] }>('/api/trades').catch(() => null),
			searchTechs(''),
		]);
		trades = tradesRes?.trades ?? [];
		techs = techsRes ?? [];
		loading = false;
	});

	async function searchTechs(q: string): Promise<TechnicianSummary[]> {
		const params = new URLSearchParams();
		if (q) params.set('q', q);
		if (selectedTrade) params.set('trade', String(selectedTrade));
		if (location.value) {
			params.set('lat', String(location.value.lat));
			params.set('lng', String(location.value.lng));
		}
		const res = await api<{ technicians: TechnicianSummary[] }>(`/api/technicians?${params}`);
		return res.technicians;
	}

	async function doSearch() {
		searching = true;
		try {
			techs = await searchTechs(query.trim());
		} finally {
			searching = false;
		}
	}

	async function pickTrade(t: Trade) {
		selectedTrade = selectedTrade === t.id ? null : t.id;
		query = '';
		searching = true;
		try {
			techs = await searchTechs('');
		} finally {
			searching = false;
		}
	}

	let datalistId = 'sanai3i-trades-datalist';
</script>

<svelte:head>
	<title>{t('appName')} — {t('tagline')}</title>
</svelte:head>

<section class="py-4">
	<h1 class="text-3xl font-extrabold leading-tight sm:text-4xl">
		🔧 {t('heroTitle')}
	</h1>
	<p class="mt-1 text-stone-500 dark:text-zinc-400">{t('heroSubtitle')}</p>
</section>

<section class="mb-6">
	<form
		class="flex gap-2"
		onsubmit={(e) => {
			e.preventDefault();
			doSearch();
		}}
	>
		<input
			class="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-amber-500 dark:focus:ring-amber-900"
			type="search"
			list={datalistId}
			bind:value={query}
			placeholder={t('searchPlaceholder')}
		/>
		<datalist id={datalistId}>
			{#each trades as tr}
				<option value={tr.nameAr}></option>
				<option value={tr.nameEn}></option>
			{/each}
		</datalist>
		<button
			class="shrink-0 rounded-2xl bg-amber-500 px-5 py-3 font-extrabold text-white transition hover:bg-amber-600 disabled:opacity-60"
			type="submit"
			disabled={searching}
		>
			{searching ? '…' : '🔍 ' + t('searchButton')}
		</button>
	</form>
</section>

<section class="mb-6">
	<h2 class="mb-2 text-sm font-bold text-stone-500 dark:text-zinc-400">{t('tradesTitle')}</h2>
	<div class="flex gap-2 overflow-x-auto pb-2">
		{#each trades as tr}
			<button
				class="flex shrink-0 items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-bold transition {selectedTrade === tr.id
					? 'bg-amber-500 text-white'
					: 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-amber-50 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-800 dark:hover:bg-zinc-800'}"
				onclick={() => pickTrade(tr)}
			>
				<span>{tr.icon}</span>
				<span>{prefs.lang === 'ar' ? tr.nameAr : tr.nameEn}</span>
			</button>
		{/each}
	</div>
</section>

<section>
	<h2 class="mb-3 text-lg font-extrabold">{t('nearbyTitle')}</h2>

	{#if loading}
		<p class="py-8 text-center text-stone-400">{t('loading')}</p>
	{:else if techs.length === 0}
		<div class="rounded-2xl bg-white p-8 text-center ring-1 ring-stone-200 dark:bg-zinc-900 dark:ring-zinc-800">
			<p class="text-3xl">🫙</p>
			<p class="mt-2 font-bold">{t('noResults')}</p>
			<p class="text-sm text-stone-500 dark:text-zinc-400">{t('noResultsHint')}</p>
		</div>
	{:else}
		<ul class="grid gap-3 sm:grid-cols-2">
			{#each techs as tech}
				<li>
					<a href={`/technicians/${tech.id}`} class="block">
						<TechCard tech={tech} />
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>
