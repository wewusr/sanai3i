<script lang="ts">
	import type { BookingStatus } from '$lib/api';
	import { t } from '$lib/i18n';

	let { status }: { status: BookingStatus | 'on' | 'off' } = $props();

	const map: Record<string, { label: string; cls: string }> = {
		pending: { label: 'pending', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
		accepted: { label: 'accepted', cls: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300' },
		started: { label: 'started', cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
		completed: { label: 'completed', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
		cancelled: { label: 'cancelled', cls: 'bg-stone-200 text-stone-600 dark:bg-zinc-800 dark:text-zinc-400' },
		declined: { label: 'declined', cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
		on: { label: 'available', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
		off: { label: 'unavailable', cls: 'bg-stone-200 text-stone-600 dark:bg-zinc-800 dark:text-zinc-400' },
	};
</script>

<span class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold {map[status].cls}">
	<span class="h-1.5 w-1.5 rounded-full bg-current"></span>
	{t(map[status].label)}
</span>
