<script lang="ts">
	import { api } from '$lib/api';
	import { t } from '$lib/i18n';
	import { setSession, session } from '$lib/stores/session.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let email = $state('');
	let password = $state('');
	let busy = $state(false);
	let error = $state('');

	let showReset = $state(false);
	let resetEmail = $state('');
	let resetCode = $state('');
	let newPassword = $state('');
	let resetBusy = $state(false);

	function nextPath(): string {
		const next = page.url.searchParams.get('next');
		return next || (session.user?.type === 'technician' ? '/dashboard' : '/');
	}

	async function login() {
		busy = true;
		error = '';
		try {
			const res = await api<{ token: string; user: import('$lib/api').UserProfile }>('/api/auth/login', {
				method: 'POST',
				body: { email, password },
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

	async function sendReset() {
		resetBusy = true;
		error = '';
		try {
			const res = await api<{ devToken?: string }>('/api/auth/forgot-password', {
				method: 'POST',
				body: { email: resetEmail },
			});
			if (res.devToken) resetCode = res.devToken;
			toast(t('resetSent'), 'success');
		} catch (e) {
			error = e instanceof Error ? e.message : t('error');
		} finally {
			resetBusy = false;
		}
	}

	async function doReset() {
		resetBusy = true;
		error = '';
		try {
			await api('/api/auth/reset-password', {
				method: 'POST',
				body: { token: resetCode, newPassword },
			});
			toast(t('passwordResetDone'), 'success');
			showReset = false;
			resetEmail = '';
			resetCode = '';
			newPassword = '';
		} catch (e) {
			error = e instanceof Error ? e.message : t('error');
		} finally {
			resetBusy = false;
		}
	}
</script>

<svelte:head>
	<title>{t('login')} — {t('appName')}</title>
</svelte:head>

<section class="animate-rise mx-auto mt-4 max-w-md rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200 dark:bg-zinc-900 dark:ring-zinc-800">
	<h1 class="text-2xl font-extrabold">🔑 {t('login')}</h1>

	{#if !showReset}
		<form
			class="mt-5 flex flex-col gap-4"
			onsubmit={(e) => {
				e.preventDefault();
				login();
			}}
		>
			<label class="text-sm font-bold">
				{t('email')}
				<input
					class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800"
					type="email"
					autocomplete="email"
					required
					bind:value={email}
				/>
			</label>
			<label class="text-sm font-bold">
				{t('password')}
				<input
					class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800"
					type="password"
					autocomplete="current-password"
					required
					bind:value={password}
				/>
			</label>

			{#if error}
				<p class="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">{error}</p>
			{/if}

			<button class="rounded-2xl bg-amber-500 px-4 py-3 font-extrabold text-white transition hover:bg-amber-600 disabled:opacity-60" type="submit" disabled={busy}>
				{busy ? t('loading') : t('loginCta')}
			</button>

			<button type="button" class="text-center text-sm font-bold text-amber-600" onclick={() => (showReset = true)}>
				{t('forgotPassword')}
			</button>
		</form>
	{:else}
		<form
			class="mt-5 flex flex-col gap-4"
			onsubmit={(e) => {
				e.preventDefault();
				doReset();
			}}
		>
			<h2 class="text-lg font-extrabold">{t('resetPasswordTitle')}</h2>
			<label class="text-sm font-bold">
				{t('email')}
				<input
					class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800"
					type="email"
					required
					bind:value={resetEmail}
				/>
			</label>

			{#if resetCode || true}
				<button type="button" class="rounded-2xl bg-stone-100 px-4 py-2 text-sm font-bold text-stone-600 transition hover:bg-stone-200 dark:bg-zinc-800 dark:text-zinc-300" onclick={sendReset} disabled={resetBusy}>
					{resetBusy ? t('loading') : t('sendResetLink')}
				</button>
			{/if}

			{#if resetCode}
				<label class="text-sm font-bold">
					{t('resetCode')}
					<input
						class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 font-mono outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800"
						value={resetCode}
						readonly
						dir="ltr"
					/>
				</label>
				<label class="text-sm font-bold">
					{t('newPassword')}
					<input
						class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800"
						type="password"
						minlength="8"
						required
						bind:value={newPassword}
					/>
				</label>
				<button class="rounded-2xl bg-amber-500 px-4 py-3 font-extrabold text-white transition hover:bg-amber-600 disabled:opacity-60" type="submit" disabled={resetBusy}>
					{resetBusy ? t('loading') : t('resetPassword')}
				</button>
			{/if}

			<button type="button" class="text-center text-sm font-bold text-amber-600" onclick={() => (showReset = false)}>
				← {t('login')}
			</button>
		</form>
	{/if}

	<p class="mt-6 text-center text-sm text-stone-500 dark:text-zinc-400">
		{t('noAccount')} <a class="font-bold text-amber-600" href="/auth/signup?next={encodeURIComponent(nextPath())}">{t('goSignup')}</a>
	</p>
</section>
