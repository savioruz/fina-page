<script lang="ts">
	import ThemeToggle from '$lib/components/ui/theme-toggle/theme-toggle.svelte';
	import LanguageSwitcher from '$lib/components/ui/language-switcher/language-switcher.svelte';
	import { navigationConfig } from '$lib/navigation';
	import { page } from '$app/state';
	import { t } from '$lib/i18n';
	import { siteConfig } from '@/metadata';
</script>

<header
	class="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
	<nav class="container mx-auto flex h-14 w-full items-center justify-between px-4 md:px-6">
		<div class="flex items-center">
			<a
				href="/"
				class="text-md flex items-center font-bold md:text-lg"
				data-sveltekit-preload-data
			>
				{#if siteConfig.logo}
					<img src={siteConfig.logo} alt="Logo" class="h-8 w-8 md:h-10 md:w-10" />
				{/if}
				<span class="ml-2">{siteConfig.name}</span>
			</a>
		</div>
		<div class="flex items-center gap-2 md:gap-6">
			{#each navigationConfig as item (item.href)}
				{@const isActive = page.url.pathname === item.href}
				<a
					href={item.href}
					class="smooth-transition text-xs font-medium md:text-sm {isActive
						? 'text-gradient'
						: 'animated-underline'}"
					data-sveltekit-preload-data
				>
					{$t(`navigation.${item.translationKey}`) || item.label}
				</a>
			{/each}
			<div class="ml-2 flex items-center gap-2 md:ml-4">
				<ThemeToggle />
				<LanguageSwitcher />
			</div>
		</div>
	</nav>
</header>
