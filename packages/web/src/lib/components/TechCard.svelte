<script lang="ts">
	import type { TechnicianSummary } from '$lib/api';
	import { t, tNum } from '$lib/i18n';
	import StatusBadge from './StatusBadge.svelte';
	import StarRating from './StarRating.svelte';

	let { tech }: { tech: TechnicianSummary } = $props();
</script>

<article class="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200 transition hover:shadow-md dark:bg-zinc-900 dark:ring-zinc-800">
	<div class="flex items-center justify-between gap-2">
		<div class="flex items-center gap-3">
			<span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-100 text-2xl dark:bg-amber-900/40">{tech.trade.icon}</span>
			<div>
				<h3 class="font-extrabold">{tech.fullName}</h3>
				<p class="text-sm text-stone-500 dark:text-zinc-400">{tech.trade.nameAr}</p>
			</div>
		</div>
		<StatusBadge status={tech.availability} />
	</div>

	<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-600 dark:text-zinc-300">
		{#if tech.avgRating > 0}
			<span class="flex items-center gap-1 font-bold">
				<StarRating value={tech.avgRating} size="text-sm" />
				({tNum(tech.avgRating)})
			</span>
		{:else}
			<span class="text-stone-400">{t('noReviews')}</span>
		{/if}
		{#if tech.distanceKm !== null}
			<span>📍 {tNum(tech.distanceKm)} {t('km')}</span>
		{/if}
		<span>🏠 {tech.area}</span>
		<span>⏱️ {t('arriveIn')} {tech.approxArrivalMin} {t('minutes')}</span>
	</div>
</article>
