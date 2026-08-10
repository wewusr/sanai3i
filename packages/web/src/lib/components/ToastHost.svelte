<script lang="ts">
	import { toasts, dismissToast } from '$lib/stores/toast.svelte';
</script>

<div class="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
	{#each toasts as toast}
		<button
			class="pointer-events-auto animate-rise w-full max-w-md rounded-2xl px-4 py-3 text-start text-sm font-semibold text-white shadow-lg {toast.type === 'success'
				? 'bg-emerald-600'
				: toast.type === 'error'
					? 'bg-red-600'
					: 'bg-zinc-800'}"
			onclick={() => dismissToast(toast.id)}
		>
			{toast.message}
		</button>
	{/each}
</div>
