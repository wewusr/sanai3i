<script lang="ts">
	import { t } from '$lib/i18n';
	import { detectLocation, location } from '$lib/stores/location.svelte';

	let { onlater, ondontshowagain }: { onlater: () => void; ondontshowagain: () => void } = $props();
	let busy = $state(false);

	async function locate() {
		busy = true;
		await detectLocation();
		busy = false;
		onlater();
	}
</script>

<div class="animate-rise mb-4 flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
	<div class="flex items-start gap-3">
		<span class="text-2xl">📍</span>
		<div>
			<p class="font-extrabold text-amber-700 dark:text-amber-300">{t('locationNoticeTitle')}</p>
			<p class="text-sm text-amber-700/80 dark:text-amber-300/80">
				{#if location.value && location.value.approximate}
					{t('locationIpDesc')} <b>{location.value.city || location.value.country || 'IP'}</b>
				{:else}
					{t('locationNoticeDesc')}
				{/if}
			</p>
		</div>
	</div>
	<div class="flex flex-wrap gap-2">
		<button
			class="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-600 disabled:opacity-60"
			onclick={locate}
			disabled={busy}
		>
			{busy ? t('loading') : t('adjustLocation')}
		</button>
		<button class="rounded-xl bg-white px-4 py-2 text-sm font-bold text-amber-600 transition hover:bg-amber-100 dark:bg-zinc-900 dark:text-amber-400" onclick={ondontshowagain}>
			{t('dontShowAgain')}
		</button>
	</div>
</div>
