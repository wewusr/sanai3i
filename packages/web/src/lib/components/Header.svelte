<script lang="ts">
	import { t } from '$lib/i18n';
	import { prefs } from '$lib/stores/prefs.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { session } from '$lib/stores/session.svelte';

	let { onopen }: { onopen: () => void } = $props();

	function nav(path: string) {
		goto(path);
	}

	function isActive(path: string) {
		return page.url.pathname === path;
	}
</script>

<header class="sticky top-0 z-30 border-b border-stone-200 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
	<div class="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3">
		<button
			class="flex items-center gap-2 text-xl font-extrabold text-amber-600"
			onclick={() => nav('/')}
		>
			<span class="text-2xl">🔧</span>
			<span>{prefs.lang === 'ar' ? 'صنايعي' : 'Sanai3i'}</span>
		</button>

		<nav class="hidden items-center gap-1 sm:flex">
			<button
				class="rounded-xl px-3 py-2 text-sm font-semibold transition {isActive('/') ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'hover:bg-stone-100 dark:hover:bg-zinc-800'}"
				onclick={() => nav('/')}
			>
				{t('home')}
			</button>
			{#if session.user}
				{@const u = session.user}
				<button
					class="rounded-xl px-3 py-2 text-sm font-semibold transition {isActive('/bookings') ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'hover:bg-stone-100 dark:hover:bg-zinc-800'}"
					onclick={() => nav(u.type === 'technician' ? '/dashboard' : '/bookings')}
				>
					{u.type === 'technician' ? t('dashboard') : t('bookings')}
				</button>
				<button
					class="rounded-xl px-3 py-2 text-sm font-semibold transition {isActive('/account') ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'hover:bg-stone-100 dark:hover:bg-zinc-800'}"
					onclick={() => nav('/account')}
				>
					{t('account')}
				</button>
			{/if}
		</nav>

		<div class="flex items-center gap-1">
			{#if !session.user}
				<button
					class="rounded-xl bg-amber-500 px-3 py-2 text-sm font-bold text-white transition hover:bg-amber-600"
					onclick={() => nav('/auth/login')}
				>
					{t('login')}
				</button>
			{/if}
			<button
				class="grid h-10 w-10 place-items-center rounded-xl text-xl transition hover:bg-stone-100 dark:hover:bg-zinc-800"
				title={t('settings')}
				aria-label={t('settings')}
				onclick={onopen}
			>
				⚙️
			</button>
		</div>
	</div>
</header>
