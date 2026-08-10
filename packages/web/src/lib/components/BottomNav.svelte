<script lang="ts">
	import { t } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { session } from '$lib/stores/session.svelte';

	let { onopen }: { onopen: () => void } = $props();

	function go(path: string) {
		goto(path);
	}

	function active(path: string) {
		return page.url.pathname === path ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'text-stone-500 hover:bg-stone-100 dark:text-zinc-400 dark:hover:bg-zinc-800';
	}
</script>

<nav class="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
	<div class="mx-auto flex max-w-3xl items-stretch justify-around">
		<button class="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-bold {active('/')}" onclick={() => go('/')}>
			<span class="text-xl leading-none">🏠</span>
			{t('home')}
		</button>

		{#if session.user}
			{@const u = session.user}
			<button
				class="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-bold {active(u.type === 'technician' ? '/dashboard' : '/bookings')}"
				onclick={() => go(u.type === 'technician' ? '/dashboard' : '/bookings')}
			>
				<span class="text-xl leading-none">{u.type === 'technician' ? '🛠️' : '📋'}</span>
				{u.type === 'technician' ? t('dashboard') : t('bookings')}
			</button>
		{/if}

		<button class="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-bold {active('/account')}" onclick={() => go(session.user ? '/account' : '/auth/login')}>
			<span class="text-xl leading-none">{session.user ? '👤' : '🔑'}</span>
			{session.user ? t('account') : t('login')}
		</button>

		<button class="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-bold {active('/settings')}" onclick={onopen}>
			<span class="text-xl leading-none">⚙️</span>
			{t('settings')}
		</button>
	</div>
</nav>
