<script lang="ts">
	import { api, type UserProfile } from '$lib/api';
	import { t } from '$lib/i18n';
	import { session, updateUser, logout } from '$lib/stores/session.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let fullName = $state('');
	let phone = $state('');
	let address = $state('');
	let area = $state('');
	let saving = $state(false);
	let edited = $state(false);

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmNewPassword = $state('');
	let changing = $state(false);

	let showReset = $state(false);
	let resetCode = $state('');
	let resetPassword = $state('');
	let resetBusy = $state(false);

	function sync() {
		const u = session.user;
		if (!u) return;
		fullName = u.fullName;
		phone = u.phone;
		address = u.address;
		area = u.area;
	}

	$effect(() => {
		if (!session.user && page.url.pathname === '/account') goto('/auth/login');
		if (session.user) sync();
	});

	async function saveProfile() {
		saving = true;
		try {
			const res = await api<{ user: UserProfile }>('/api/auth/me', {
				method: 'PUT',
				token: session.token,
				body: { fullName, phone, address, area },
			});
			updateUser(res.user);
			edited = false;
			toast(t('saved'), 'success');
		} catch (e) {
			toast(e instanceof Error ? e.message : t('error'), 'error');
		} finally {
			saving = false;
		}
	}

	async function changePassword() {
		if (newPassword !== confirmNewPassword) {
			toast(t('errors_general'), 'error');
			return;
		}
		changing = true;
		try {
			await api('/api/auth/change-password', {
				method: 'POST',
				token: session.token,
				body: { currentPassword, newPassword },
			});
			toast(t('passwordChanged'), 'success');
			currentPassword = '';
			newPassword = '';
			confirmNewPassword = '';
		} catch (e) {
			toast(e instanceof Error ? e.message : t('error'), 'error');
		} finally {
			changing = false;
		}
	}

	async function sendReset() {
		resetBusy = true;
		try {
			const res = await api<{ devToken?: string }>('/api/auth/forgot-password', {
				method: 'POST',
				body: { email: session.user!.email },
			});
			if (res.devToken) resetCode = res.devToken;
			toast(t('resetSent'), 'success');
		} catch (e) {
			toast(e instanceof Error ? e.message : t('error'), 'error');
		} finally {
			resetBusy = false;
		}
	}

	async function doReset() {
		resetBusy = true;
		try {
			await api('/api/auth/reset-password', {
				method: 'POST',
				body: { token: resetCode, newPassword: resetPassword },
			});
			toast(t('passwordResetDone'), 'success');
			resetCode = '';
			resetPassword = '';
			showReset = false;
		} catch (e) {
			toast(e instanceof Error ? e.message : t('error'), 'error');
		} finally {
			resetBusy = false;
		}
	}

	function doLogout() {
		logout();
		goto('/');
	}
</script>

<svelte:head>
	<title>{t('myAccount')} — {t('appName')}</title>
</svelte:head>

{#if session.user}
	<section class="animate-rise flex flex-col gap-4">
		<div class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200 dark:bg-zinc-900 dark:ring-zinc-800">
			<div class="flex items-center gap-4">
				<span class="grid h-16 w-16 place-items-center rounded-3xl bg-amber-100 text-3xl dark:bg-amber-900/40">👤</span>
				<div>
					<h1 class="text-2xl font-extrabold">{session.user.fullName}</h1>
					<p class="text-sm text-stone-500 dark:text-zinc-400">{session.user.email}</p>
					<p class="text-sm font-bold text-amber-600">{session.user.type === 'technician' ? '🛠️ ' + t('technicianAccount') : '👤 ' + t('userAccount')}</p>
				</div>
			</div>
		</div>

		<div class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200 dark:bg-zinc-900 dark:ring-zinc-800">
			<h2 class="mb-4 text-lg font-extrabold">📋 {t('personalInfo')}</h2>
			<div class="grid gap-3 sm:grid-cols-2">
				<label class="text-sm font-bold">
					{t('fullName')}
					<input class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800" bind:value={fullName} oninput={() => (edited = true)} />
				</label>
				<label class="text-sm font-bold">
					{t('phone')}
					<input class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800" type="tel" dir="ltr" bind:value={phone} oninput={() => (edited = true)} />
				</label>
				<label class="text-sm font-bold">
					{t('address')}
					<input class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800" bind:value={address} oninput={() => (edited = true)} />
				</label>
				<label class="text-sm font-bold">
					{t('area')}
					<input class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800" bind:value={area} oninput={() => (edited = true)} />
				</label>
			</div>
			<button class="mt-4 rounded-2xl bg-amber-500 px-6 py-2.5 font-extrabold text-white transition hover:bg-amber-600 disabled:opacity-50 disabled:saturate-0" onclick={saveProfile} disabled={!edited || saving}>
				{saving ? t('loading') : t('save')}
			</button>
		</div>

		<div class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200 dark:bg-zinc-900 dark:ring-zinc-800">
			<h2 class="mb-4 text-lg font-extrabold">🔒 {t('changePasswordTitle')}</h2>
			<div class="grid gap-3 sm:grid-cols-2">
				<label class="text-sm font-bold">
					{t('currentPassword')}
					<input class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800" type="password" autocomplete="current-password" bind:value={currentPassword} />
				</label>
				<label class="text-sm font-bold">
					{t('newPassword')}
					<input class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800" type="password" autocomplete="new-password" bind:value={newPassword} />
				</label>
				<label class="text-sm font-bold">
					{t('confirmNewPassword')}
					<input class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800" type="password" autocomplete="new-password" bind:value={confirmNewPassword} />
				</label>
			</div>
			<button class="mt-4 rounded-2xl bg-stone-900 px-6 py-2.5 font-extrabold text-white transition hover:bg-stone-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900" onclick={changePassword} disabled={changing}>
				{changing ? t('loading') : t('updatePassword')}
			</button>

			<div class="mt-6 border-t border-stone-100 pt-4 dark:border-zinc-800">
				<button class="text-sm font-bold text-amber-600" onclick={() => (showReset = !showReset)}>
					🔁 {t('forgotPassword')} — {t('resetPasswordTitle')}
				</button>
				{#if showReset}
					<div class="mt-3 flex flex-col gap-3">
						<button class="rounded-xl bg-stone-100 px-4 py-2 text-sm font-bold text-stone-600 transition hover:bg-stone-200 dark:bg-zinc-800 dark:text-zinc-300" onclick={sendReset} disabled={resetBusy}>
							{resetBusy ? t('loading') : t('sendResetLink')}
						</button>
						{#if resetCode}
							<label class="text-sm font-bold">
								{t('resetCode')}
								<input class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 font-mono outline-none dark:border-zinc-700 dark:bg-zinc-800" value={resetCode} readonly dir="ltr" />
							</label>
							<label class="text-sm font-bold">
								{t('newPassword')}
								<input class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 outline-none focus:border-amber-400 dark:border-zinc-700 dark:bg-zinc-800" type="password" minlength="8" bind:value={resetPassword} />
							</label>
							<button class="rounded-2xl bg-amber-500 px-4 py-2.5 font-extrabold text-white transition hover:bg-amber-600" onclick={doReset}>
								{t('resetPassword')}
							</button>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<button class="rounded-2xl bg-red-50 px-4 py-3 font-extrabold text-red-600 transition hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400" onclick={doLogout}>
			🚪 {t('logout')}
		</button>
	</section>
{/if}
