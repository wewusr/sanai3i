<script lang="ts">
	import { api, type Booking } from '$lib/api';
	import { t, tDate, tNum } from '$lib/i18n';
	import { session } from '$lib/stores/session.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import StarRating from '$lib/components/StarRating.svelte';
	import Modal from '$lib/components/Modal.svelte';

	let { booking, onchange }: { booking: Booking; onchange: () => void } = $props();

	let busy = $state(false);
	let rateOpen = $state(false);
	let stars = $state(0);
	let comment = $state('');
	let ratingBusy = $state(false);

	const role = $derived(session.user?.type);

	async function setStatus(next: 'accepted' | 'declined' | 'started' | 'completed' | 'cancelled') {
		busy = true;
		try {
			await api(`/api/bookings/${booking.id}/status`, {
				method: 'PATCH',
				token: session.token,
				body: { status: next },
			});
			toast(t('saved'), 'success');
			onchange();
		} catch (e) {
			toast(e instanceof Error ? e.message : t('error'), 'error');
		} finally {
			busy = false;
		}
	}

	async function submitRating() {
		if (stars < 1) return;
		ratingBusy = true;
		try {
			await api(`/api/bookings/${booking.id}/rate`, {
				method: 'POST',
				token: session.token,
				body: { stars, comment },
			});
			toast(t('ratingSubmitted'), 'success');
			rateOpen = false;
			comment = '';
			onchange();
		} catch (e) {
			toast(e instanceof Error ? e.message : t('error'), 'error');
		} finally {
			ratingBusy = false;
		}
	}

	function togglePhone() {
		if (role === 'user') {
			toast(t('privacyNote'), 'success');
		}
	}
</script>

<article class="animate-rise flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-stone-200 dark:bg-zinc-900 dark:ring-zinc-800">
	<div class="flex items-start justify-between gap-2">
		<div class="flex items-center gap-3">
			<span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-100 text-2xl dark:bg-amber-900/40">{booking.technician.trade.icon}</span>
			<div>
				<p class="font-extrabold">{role === 'technician' ? booking.client.fullName : booking.technician.fullName}</p>
				<p class="text-sm text-stone-500 dark:text-zinc-400">
					{role === 'technician'
						? booking.client.phone ?? t('phoneNumber')
						: booking.technician.trade.nameAr + ' — ' + booking.technician.area}
				</p>
			</div>
		</div>
		<StatusBadge status={booking.status} />
	</div>

	{#if booking.serviceType}
		<p class="text-sm font-bold text-stone-700 dark:text-zinc-200">🔨 {booking.serviceType}</p>
	{/if}
	{#if booking.requestedTime}
		<p class="text-sm text-stone-500 dark:text-zinc-400">🕐 {booking.requestedTime}</p>
	{/if}

	<div class="rounded-2xl bg-stone-100 p-3 text-sm text-stone-600 dark:bg-zinc-800 dark:text-zinc-300">
		{#if booking.address}
			<p>📍 {booking.address}</p>
		{/if}
		{#if booking.notes}
			<p class="mt-1">{booking.notes}</p>
		{/if}
	</div>

	<div class="flex items-center justify-between text-xs text-stone-400">
		<span>{t('createdAt')}: {tDate(booking.createdAt)}</span>
		{#if role === 'user' && booking.technician.phone}
			<a href={`tel:${booking.technician.phone}`} onclick={togglePhone} class="font-bold text-amber-600">📞 {t('call')}</a>
		{/if}
	</div>

	<div class="flex flex-wrap gap-2">
		{#if role === 'user' && booking.status === 'pending'}
			<button class="rounded-2xl bg-red-50 px-4 py-2.5 text-sm font-extrabold text-red-600 transition hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400" onclick={() => setStatus('cancelled')} disabled={busy}>
				{busy ? t('loading') : t('cancelBooking')}
			</button>
		{/if}

		{#if role === 'user' && booking.rateable}
			<button class="rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-amber-600" onclick={() => (rateOpen = true)}>
				⭐ {t('rateService')}
			</button>
		{/if}

		{#if role === 'technician' && booking.status === 'pending'}
			<button class="rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-emerald-600" onclick={() => setStatus('accepted')} disabled={busy}>
				{busy ? t('loading') : '✓ ' + t('accept')}
			</button>
			<button class="rounded-2xl bg-red-50 px-4 py-2.5 text-sm font-extrabold text-red-600 transition hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400" onclick={() => setStatus('declined')} disabled={busy}>
				✕ {t('decline')}
			</button>
		{/if}

		{#if role === 'technician' && booking.status === 'accepted'}
			<button class="rounded-2xl bg-indigo-500 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-indigo-600" onclick={() => setStatus('started')} disabled={busy}>
				{busy ? t('loading') : '▶ ' + t('markStarted')}
			</button>
		{/if}

		{#if role === 'technician' && booking.status === 'started'}
			<button class="rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-emerald-600" onclick={() => setStatus('completed')} disabled={busy}>
				{busy ? t('loading') : '✓ ' + t('markCompleted')}
			</button>
		{/if}
	</div>
</article>

<Modal open={rateOpen} title={t('rateService')} onclose={() => (rateOpen = false)}>
	<div class="flex flex-col gap-4">
		<p class="text-sm font-bold">{t('yourRating')}</p>
		<StarRating value={stars} size="text-2xl" onselect={(n) => (stars = n)} />
		<textarea class="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800" rows="3" bind:value={comment} placeholder={t('writeReviewPlaceholder')}></textarea>
		<button class="rounded-2xl bg-amber-500 px-4 py-3 font-extrabold text-white transition hover:bg-amber-600 disabled:opacity-60" onclick={submitRating} disabled={ratingBusy || stars < 1}>
			{ratingBusy ? t('loading') : t('submitRating')}
		</button>
	</div>
</Modal>
