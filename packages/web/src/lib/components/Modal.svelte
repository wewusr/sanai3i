<script lang="ts">
	import { t } from '$lib/i18n';

	let { open, title, onclose, children }: { open: boolean; title: string; onclose: () => void; children?: import('svelte').Snippet } = $props();
</script>

{#if open}
	<div class="fixed inset-0 z-40 bg-black/40" role="presentation" onclick={onclose}></div>
	<div class="animate-rise fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl sm:inset-y-auto sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 sm:rounded-3xl dark:bg-zinc-900">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-lg font-extrabold">{title}</h2>
			<button class="rounded-xl px-3 py-1 text-stone-500 hover:bg-stone-100 dark:hover:bg-zinc-800" onclick={onclose}>✕</button>
		</div>
		{@render children?.()}
	</div>
{/if}
