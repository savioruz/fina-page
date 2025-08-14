<script lang="ts">
	import '../app.css';

	import { siteConfig } from '$lib/metadata';
	import Error from '@/components/pages/error/error.svelte';
	import { page } from '$app/state';
	import { ModeWatcher } from 'mode-watcher';
	import Navbar from '@/components/ui/navbar/navbar.svelte';
	import { loadTranslations, locale } from '$lib/i18n';
	import { onMount } from 'svelte';

	let { children, data } = $props();

	let className = $state('');
	export { className as class };

	let isI18nReady = $state(false);

	onMount(async () => {
		const targetLocale = data?.locale || 'en';

		await loadTranslations(targetLocale, 'common');
		await loadTranslations(targetLocale, 'navigation');
		locale.set(targetLocale);
		isI18nReady = true;
	});
</script>

<svelte:head>
	<title>{siteConfig.name}</title>
	<meta name="description" content={siteConfig.description} />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta charset="utf-8" />

	<meta name="keywords" content={siteConfig.keywords} />
	<meta name="author" content={siteConfig.name} />

	<meta property="og:title" content="{siteConfig.name} - Personal Website" />
	<meta property="og:description" content={siteConfig.description} />
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="en_US" />
	<meta property="og:url" content={siteConfig.url.toString()} />
	{#if siteConfig.ogImage}
		<meta property="og:image" content={siteConfig.ogImage.toString()} />
	{/if}
	<meta name="robots" content="index, follow" />
	<meta
		name="googlebot"
		content="index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1"
	/>

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:creator" content="@savioruz" />
	<meta name="twitter:title" content={siteConfig.name} />
	<meta name="twitter:image" content={siteConfig.ogImage.toString()} />
	<meta name="twitter:description" content={siteConfig.description} />

	<link rel="canonical" href={siteConfig.url.toString()} />
	<meta name="google-site-verification" content={siteConfig.googleVerification} />
	<meta name="yandex-verification" content={siteConfig.yandexVerification} />
</svelte:head>

<ModeWatcher />

{#if page.error?.message}
	<Error status={page.status} message={page.error.message} />
{:else}
	{#if isI18nReady}
		<Navbar />
	{/if}
	<main class="flex min-h-screen flex-col items-center justify-center py-8">
		<div
			class="flex w-full max-w-sm flex-col items-center justify-center px-4 md:max-w-screen-md md:px-0"
		>
			{@render children()}
		</div>
	</main>
{/if}
