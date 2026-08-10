<script lang="ts">
	import { t } from '$lib/i18n';
	import { prefs, setTheme, setLang } from '$lib/stores/prefs.svelte';
	import { location, detectLocation } from '$lib/stores/location.svelte';
	import { session, logout } from '$lib/stores/session.svelte';
	import { goto } from '$app/navigation';
	import { toast } from '$lib/stores/toast.svelte';

	let { open, onclose }: { open: boolean; onclose: () => void } = $props();

	let busy = $state(false);

	async function reDetect() {
		busy = true;
		const ok = await detectLocation();
		busy = false;
		if (ok) toast(location.value?.source === 'gps' ? t('locGps') : t('locIp'), 'success');
	}

	function goAccount() {
		onclose();
		goto(session.user ? '/account' : '/auth/login');
	}

	function doLogout() {
		logout();
		onclose();
		goto('/');
	}
</script>

{#if open}
	<div class="fixed inset-0 z-40 bg-black/40" role="presentation" onclick={onclose}></div>
	<aside
		class="animate-rise fixed inset-y-0 end-0 z-50 flex w-full max-w-xs flex-col gap-4 overflow-y-auto bg-white p-5 shadow-2xl dark:bg-zinc-900"
	>
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-extrabold">⚙️ {t('settings')}</h2>
			<button class="rounded-xl px-3 py-1 text-stone-500 hover:bg-stone-100 dark:hover:bg-zinc-800" onclick={onclose}>✕</button>
		</div>

		<section class="rounded-2xl bg-stone-100 p-4 dark:bg-zinc-800">
			<h3 class="mb-2 text-sm font-bold text-stone-500 dark:text-zinc-400">{t('theme')}</h3>
			<div class="grid grid-cols-3 gap-2">
				{#each (['light', 'dark', 'auto'] as const) as th}
					<button
						class="rounded-xl px-2 py-2 text-sm font-bold transition {prefs.theme === th ? 'bg-amber-500 text-white' : 'bg-white text-stone-600 dark:bg-zinc-900 dark:text-zinc-300'}"
						onclick={() => setTheme(th)}
					>
						{th === 'light' ? '☀️ ' + t('themeLight') : th === 'dark' ? '🌙 ' + t('themeDark') : '🔄 ' + t('themeAuto')}
					</button>
				{/each}
			</div>
		</section>

		<section class="rounded-2xl bg-stone-100 p-4 dark:bg-zinc-800">
			<h3 class="mb-2 text-sm font-bold text-stone-500 dark:text-zinc-400">{t('language')}</h3>
			<div class="grid grid-cols-2 gap-2">
				<button
					class="rounded-xl px-2 py-2 text-sm font-bold transition {prefs.lang === 'ar' ? 'bg-amber-500 text-white' : 'bg-white text-stone-600 dark:bg-zinc-900 dark:text-zinc-300'}"
					onclick={() => setLang('ar')}
				>
					العربية
				</button>
				<button
					class="rounded-xl px-2 py-2 text-sm font-bold transition {prefs.lang === 'en' ? 'bg-amber-500 text-white' : 'bg-white text-stone-600 dark:bg-zinc-900 dark:text-zinc-300'}"
					onclick={() => setLang('en')}
				>
					English
				</button>
			</div>
		</section>

		<section class="rounded-2xl bg-stone-100 p-4 dark:bg-zinc-800">
			<h3 class="mb-2 text-sm font-bold text-stone-500 dark:text-zinc-400">{t('myLocation')}</h3>
			<p class="mb-2 text-sm">
				{location.value
					? (location.value.source === 'gps' ? '📡 ' : '🌐 ') +
						(location.value.approximate ? t('locIp') : t('locGps')) +
						(location.value.city ? ' — ' + location.value.city : '')
					: '📍 ' + t('locNone')}
			</p>
			<button
				class="w-full rounded-xl bg-white px-3 py-2 text-sm font-bold text-amber-600 transition hover:bg-amber-50 disabled:opacity-60 dark:bg-zinc-900 dark:text-amber-400 dark:hover:bg-zinc-800"
				onclick={reDetect}
				disabled={busy}
			>
				{busy ? t('loading') : t('redetect')}
			</button>
		</section>

		<section class="rounded-2xl bg-stone-100 p-4 dark:bg-zinc-800">
			<h3 class="mb-2 text-sm font-bold text-stone-500 dark:text-zinc-400">{t('account')}</h3>
			<button class="w-full rounded-xl bg-white px-3 py-2 text-sm font-bold text-stone-700 transition hover:bg-amber-50 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800" onclick={goAccount}>
				👤 {session.user ? session.user.fullName : t('login')}
			</button>
			{#if session.user}
				<button class="mt-2 w-full rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400" onclick={doLogout}>
					🚪 {t('logout')}
				</button>
			{/if}
		</section>

		<p class="text-xs text-stone-400 dark:text-zinc-500">{t('privacyNote')}</p>
	</aside>
{/if}
