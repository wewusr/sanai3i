<script lang="ts">
	import { onMount } from 'svelte';
	import { api, type Trade, type UserProfile } from '$lib/api';
	import { t } from '$lib/i18n';
	import { setSession, session } from '$lib/stores/session.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	type AccountType = 'user' | 'technician';

	let accountType = $state<AccountType>('user');
	let fullName = $state('');
	let email = $state('');
	let password = $state('');
	let phone = $state('');
	let address = $state('');
	let area = $state('');
	let tradeId = $state('');
	let trades = $state<Trade[]>([]);
	let busy = $state(false);
	let error = $state('');

	onMount(async () => {
		const res = await api<{ trades: Trade[] }>('/api/trades').catch(() => ({ trades: [] }));
		trades = res.trades;
	});

	function nextPath(): string {
		return page.url.searchParams.get('next') || (accountType === 'technician' ? '/dashboard' : '/');
	}

	async function signup() {
		busy = true;
		error = '';
		try {
			const res = await api<{ token: string; user: UserProfile }>('/api/auth/signup', {
				method: 'POST',
				body: {
					type: accountType,
					fullName,
					email,
					password,
					phone,
					address,
					area,
					tradeId: accountType === 'technician' ? Number(tradeId) : undefined,
				},
			});
			setSession({ token: res.token, user: res.user });
			toast(t('welcome') + '، ' + res.user.fullName, 'success');
			goto(nextPath());
		} catch (e) {
			error = e instanceof Error ? e.message : t('error');
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>{t('signup')} — {t('appName')}</title>
</svelte:head>

<section class="animate-rise mx-auto mt-4 max-w-md rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200 dark:bg-zinc-900 dark:ring-zinc-800">
	<h1 class="text-2xl font-extrabold">✨ {t('signup')}</h1>

	<form
		class="mt-5 flex flex-col gap-4"
		onsubmit={(e) => {
			e.preventDefault();
			signup();
		}}
	>
		<fieldset>
			<legend class="mb-2 text-sm font-bold">{t('accountType')}</legend>
			<div class="grid grid-cols-2 gap-2">
				<button
					type="button"
					class="rounded-2xl px-3 py-3 text-center font-extrabold transition {accountType === 'user' ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300'}"
					onclick={() => (accountType = 'user')}
				>
					👤 {t('userAccount')}
				</button>
				<button
					type="button"
					class="rounded-2xl px-3 py-3 text-center font-extrabold transition {accountType === 'technician' ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300'}"
					onclick={() => (accountType = 'technician')}
				>
					🛠️ {t('technicianAccount')}
				</button>
			</div>
		</fieldset>

		<label class="text-sm font-bold">
			{t('fullName')}
			<input class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800" required minlength="2" bind:value={fullName} />
		</label>

		<label class="text-sm font-bold">
			{t('email')}
			<input class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800" type="email" required bind:value={email} />
		</label>

		<label class="text-sm font-bold">
			{t('password')} <span class="font-normal text-stone-400">(8+)</span>
			<input class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800" type="password" required minlength="8" bind:value={password} />
		</label>

		<label class="text-sm font-bold">
			{t('phone')}
			<input class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800" type="tel" dir="ltr" bind:value={phone} placeholder="01xxxxxxxxx" />
		</label>

		{#if accountType === 'technician'}
			<label class="text-sm font-bold">
				{t('selectTrade')} *
				<select class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800" required bind:value={tradeId}>
					<option value="" disabled>{t('chooseTrade')}</option>
					{#each trades as tr}
						<option value={tr.id}>{tr.icon} {tr.nameAr} — {tr.nameEn}</option>
					{/each}
				</select>
			</label>
			<label class="text-sm font-bold">
				{t('serviceArea')}
				<input class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800" bind:value={area} placeholder={t('areaPlaceholder')} />
			</label>
		{:else}
			<label class="text-sm font-bold">
				{t('address')}
				<input class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800" bind:value={address} placeholder={t('addressPlaceholder')} />
			</label>
			<label class="text-sm font-bold">
				{t('area')}
				<input class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800" bind:value={area} placeholder={t('areaPlaceholder')} />
			</label>
		{/if}

		{#if error}
			<p class="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">{error}</p>
		{/if}

		<button class="rounded-2xl bg-amber-500 px-4 py-3 font-extrabold text-white transition hover:bg-amber-600 disabled:opacity-60" type="submit" disabled={busy}>
			{busy ? t('loading') : t('signupCta')}
		</button>
	</form>

	<p class="mt-6 text-center text-sm text-stone-500 dark:text-zinc-400">
		{t('haveAccount')} <a class="font-bold text-amber-600" href="/auth/login?next={encodeURIComponent(nextPath())}">{t('goLogin')}</a>
	</p>
</section>
