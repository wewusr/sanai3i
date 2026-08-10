<script lang="ts">
	let { value, size = 'text-sm', onselect }: { value: number; size?: string; onselect?: (stars: number) => void } = $props();

	let hover = $state(0);

	function pick(n: number) {
		if (onselect) onselect(n);
	}
</script>

<div class="inline-flex items-center gap-0.5" role="radiogroup">
	{#each [1, 2, 3, 4, 5] as n}
		<button
			type="button"
			class="transition {size} {hover ? (n <= hover ? 'opacity-100' : 'opacity-30') : n <= Math.round(value) ? 'opacity-100' : 'opacity-30'}"
			onclick={() => pick(n)}
			onmouseenter={() => (hover = n)}
			onmouseleave={() => (hover = 0)}
			disabled={!onselect}
		>
			⭐
		</button>
	{/each}
</div>
