<script lang="ts">
	import ThemeToggle from '$lib/components/ui/theme-toggle/theme-toggle.svelte';
	import LanguageSwitcher from '$lib/components/ui/language-switcher/language-switcher.svelte';
	import { navigationConfig } from '$lib/navigation';
	import { page } from '$app/state';
	import { t } from '$lib/i18n';
	import { siteConfig } from '@/metadata';
	import { authStore } from '$lib/stores/auth';
	import { LayoutDashboard, LogIn, LogOut, User } from 'lucide-svelte';
	import Button from '../button/button.svelte';
	import { goto } from '$app/navigation';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { cn } from '@/utils';

	function handleLogout() {
		authStore.logout();
		goto('/login');
	}
</script>

<header
	class="top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
	<nav class={cn('mx-auto flex h-14 w-full items-center justify-between px-4 md:px-6')}>
		<div class="flex items-center">
			{#if !$authStore.isAuthenticated || page.url.pathname === '/'}
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
			{/if}
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
				{#if $authStore.isAuthenticated}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							<Button variant="ghost" size="sm" class="text-xs font-medium md:text-sm">
								<User class="size-4" />
							</Button>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content>
							<DropdownMenu.Group>
								<DropdownMenu.Item>
									<Button
										href="/dashboard"
										variant="ghost"
										size="sm"
										class="text-xs font-medium md:text-sm"
									>
										<LayoutDashboard class="size-4 text-primary" />
										Dashboard
									</Button>
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<Button
										onclick={handleLogout}
										variant="ghost"
										size="sm"
										class="text-xs font-medium md:text-sm"
									>
										<LogOut class="size-4 text-red-500" />
										Logout
									</Button>
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				{:else}
					<Button href="/login" variant="ghost" size="sm" class="text-xs font-medium md:text-sm">
						<LogIn class="size-4" />
					</Button>
				{/if}
				<ThemeToggle />
				<LanguageSwitcher />
			</div>
		</div>
	</nav>
</header>
