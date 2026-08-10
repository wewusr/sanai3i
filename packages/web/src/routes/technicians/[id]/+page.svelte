<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { api, type TechnicianDetail, type Trade } from '$lib/api';
	import { t, tDate, tNum } from '$lib/i18n';
	import { prefs } from '$lib/stores/prefs.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { goto } from '$app/navigation';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import StarRating from '$lib/components/StarRating.svelte';
	import Modal from '$lib/components/Modal.svelte';

	let detail = $state<TechnicianDetail | null>(null);
	let loading = $state(true);
	let trades = $state<Trade[]>([]);
	let error = $state('');
	let bookOpen = $state(false);
	let sending = $state(false);

	const serviceType = $state({ value: '' });
	const address = $state({ value: '' });
	const notes = $state({ value: '' });
	const requestedTime = $state({ value: '' });

	onMount(async () => {
		const id = Number(page.params.id);
		try {
			const res = await api<TechnicianDetail>(`/api/technicians/${id}`);
			detail = res;
			error = '';
		} catch (e) {
			error = e instanceof Error ? e.message : t('error');
		} finally {
			loading = false;
		}
		if (session.user?.type === 'technician') {
			trades = (await api<{ trades: Trade[] }>('/api/trades').catch(() => ({ trades: [] }))).trades;
		}
	});

	async function sendBooking() {
		if (!address.value.trim()) {
			toast(t('addressPlaceholder'), 'error');
			return;
		}
		sending = true;
		try {
			await api('/api/bookings', {
				method: 'POST',
				token: session.token,
				body: {
					technicianId: detail!.id,
					serviceType: serviceType.value,
					address: address.value,
					notes: notes.value,
					requestedTime: requestedTime.value,
				},
			});
			toast(t('requestSent'), 'success');
			bookOpen = false;
			goto('/bookings');
		} catch (e) {
			toast(e instanceof Error ? e.message : t('error'), 'error');
		} finally {
			sending = false;
		}
	}

	function openBook() {
		if (!session.user) {
			goto(`/auth/login?next=/technicians/${detail!.id}`);
			return;
		}
		if (session.user.type !== 'user') {
			toast(t('userAccount'), 'error');
			return;
		}
		bookOpen = true;
	}
</script>

<svelte:head>
	<title>{detail ? `${detail.fullName} — ${t('appName')}` : t('loading')}</title>
</svelte:head>

{#if loading}
	<p class="py-16 text-center text-stone-400">{t('loading')}</p>
{:else if error || !detail}
	<div class="rounded-2xl bg-white p-8 text-center ring-1 ring-stone-200 dark:bg-zinc-900 dark:ring-zinc-800">
		<p class="text-3xl">😕</p>
		<p class="mt-2 font-bold">{error || t('error')}</p>
		<button class="mt-3 text-sm font-bold text-amber-600" onclick={() => history.back()}>← {t('back')}</button>
	</div>
{:else}
	<section class="animate-rise overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone-200 dark:bg-zinc-900 dark:ring-zinc-800">
		<div class="h-24 bg-gradient-to-r from-[#bf6e50] via-[#bf5630] to-[#402f2b]"></div>
		<div class="px-5 pb-5">
			<div class="-mt-8 mb-3 flex items-end justify-between gap-3">
				<span class="grid h-20 w-20 place-items-center rounded-3xl bg-white text-4xl shadow ring-1 ring-stone-200 dark:bg-zinc-800 dark:ring-zinc-700">
					{detail.trade.icon}
				</span>
				<StatusBadge status={detail.availability} />
			</div>

			<h1 class="text-2xl font-extrabold">{detail.fullName}</h1>
			<p class="text-stone-500 dark:text-zinc-400">{prefs.lang === 'ar' ? detail.trade.nameAr : detail.trade.nameEn}</p>

			<div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-600 dark:text-zinc-300">
				<span class="flex items-center gap-1 font-bold">
					<StarRating value={detail.avgRating} size="text-sm" />
					({tNum(detail.avgRating)}) · {detail.reviewCount} {t('reviewsCount')}
				</span>
				<span>🏠 {detail.area}</span>
				<span>⏱️ {t('arriveIn')} {detail.approxArrivalMin} {t('minutes')}</span>
			</div>

			{#if detail.bio}
				<p class="mt-4 rounded-2xl bg-stone-100 p-3 text-sm dark:bg-zinc-800">{detail.bio}</p>
			{/if}

			<div class="mt-4 flex flex-col gap-2 sm:flex-row">
				<a
					class="flex-1 rounded-2xl bg-amber-500 px-4 py-3 text-center font-extrabold text-white transition hover:bg-amber-600"
					href={`tel:${detail.phone}`}
				>
					📞 {t('callNow')}
				</a>
				<button
					class="flex-1 rounded-2xl bg-stone-900 px-4 py-3 font-extrabold text-white transition hover:bg-stone-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
					onclick={openBook}
				>
					📋 {t('bookNow')}
				</button>
			</div>
		</div>
	</section>

	<section class="mt-6">
		<h2 class="mb-3 text-lg font-extrabold">⭐ {t('reviews')}</h2>
		{#if detail.reviews.length === 0}
			<p class="rounded-2xl bg-white p-6 text-center text-sm text-stone-400 ring-1 ring-stone-200 dark:bg-zinc-900 dark:ring-zinc-800">
				{t('noReviews')}
			</p>
		{:else}
			<ul class="grid gap-3">
				{#each detail.reviews as rv}
					<li class="rounded-2xl bg-white p-4 ring-1 ring-stone-200 dark:bg-zinc-900 dark:ring-zinc-800">
						<div class="flex items-center justify-between">
							<p class="font-bold">{rv.reviewer}</p>
							<span class="text-xs text-stone-400">{tDate(rv.createdAt)}</span>
						</div>
						<StarRating value={rv.stars} size="text-sm" />
						{#if rv.comment}
							<p class="mt-1 text-sm text-stone-600 dark:text-zinc-300">{rv.comment}</p>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<Modal open={bookOpen} title={t('bookService')} onclose={() => (bookOpen = false)}>
		<form
			class="flex flex-col gap-3"
			onsubmit={(e) => {
				e.preventDefault();
				sendBooking();
			}}
		>
			<label class="text-sm font-bold">
				{t('serviceType')}
				<datalist id="sanai3i-services">
					{#each trades as tr}
						<option value={prefs.lang === 'ar' ? tr.nameAr : tr.nameEn}></option>
					{/each}
				</datalist>
				<input
					class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800"
					list="sanai3i-services"
					bind:value={serviceType.value}
					placeholder={t('serviceTypePlaceholder')}
				/>
			</label>
			<label class="text-sm font-bold">
				{t('address')} *
				<input
					class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800"
					bind:value={address.value}
					placeholder={t('addressPlaceholder')}
					required
				/>
			</label>
			<label class="text-sm font-bold">
				{t('requestedTime')}
				<input
					class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800"
					bind:value={requestedTime.value}
					placeholder={t('requestedTimePlaceholder')}
				/>
			</label>
			<label class="text-sm font-bold">
				{t('notes')} <span class="font-normal text-stone-400">{t('optional')}</span>
				<textarea
					class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800"
					rows="2"
					bind:value={notes.value}
					placeholder={t('notesPlaceholder')}
				></textarea>
			</label>
			<button
				class="rounded-2xl bg-amber-500 px-4 py-3 font-extrabold text-white transition hover:bg-amber-600 disabled:opacity-60"
				type="submit"
				disabled={sending}
			>
				{sending ? t('loading') : t('sendRequest')}
			</button>
		</form>
	</Modal>
{/if}
