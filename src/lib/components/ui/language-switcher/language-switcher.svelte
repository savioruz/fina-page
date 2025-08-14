<script lang="ts">
	import { locale, loadTranslations } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import lang from '$lang/lang.json';
	import { t } from '$lib/i18n';
	import * as Select from '$lib/components/ui/select/index.js';

	async function switchLanguage(newLocale: string) {
		await loadTranslations(newLocale, 'common');
		await loadTranslations(newLocale, 'navigation');

		locale.set(newLocale);

		const url = new URL(page.url);
		url.searchParams.set('lang', newLocale);
		goto(url.toString());
	}
</script>

<Select.Root type="single" bind:value={$locale} onValueChange={switchLanguage}>
	<Select.Trigger class="relative">
		{$t('common.logo')}
	</Select.Trigger>
	<Select.Content>
		{#each Object.entries(lang) as [code, name] (code)}
			<Select.Item value={code}>
				{name}
			</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>
