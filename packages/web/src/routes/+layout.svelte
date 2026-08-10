<script lang="ts">
	import '../app.css';
	import { prefs } from '$lib/stores/prefs.svelte';
	import { shouldShowLocationNotice } from '$lib/stores/location.svelte';
	import { dismissLocationNotice } from '$lib/stores/prefs.svelte';
	import Header from '$lib/components/Header.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import SettingsDrawer from '$lib/components/SettingsDrawer.svelte';
	import ToastHost from '$lib/components/ToastHost.svelte';
	import LocationNotice from '$lib/components/LocationNotice.svelte';
	import { browser } from '$app/environment';

	let { children }: { children?: import('svelte').Snippet } = $props();

	let drawerOpen = $state(false);
	let showNotice = $state(false);

	$effect(() => {
		showNotice = shouldShowLocationNotice();
	});

	$effect(() => {
		const lang = prefs.lang;
		const theme = prefs.theme;
		if (browser) {
			document.documentElement.lang = lang;
			document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
			const dark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
			document.documentElement.classList.toggle('dark', dark);
		}
	});

	function onDontShowAgain() {
		dismissLocationNotice();
		showNotice = false;
	}
</script>


<div class="flex min-h-dvh flex-col">
	<Header onopen={() => (drawerOpen = true)} />

	<main class="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-4 sm:pb-16">
		{#if showNotice}
			<LocationNotice
				ondontshowagain={onDontShowAgain}
				onlater={() => (showNotice = false)}
			/>
		{/if}
		{@render children?.()}
	</main>

	<BottomNav onopen={() => (drawerOpen = true)} />
	<SettingsDrawer open={drawerOpen} onclose={() => (drawerOpen = false)} />
	<ToastHost />
</div>
