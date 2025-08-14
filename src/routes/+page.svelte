<script lang="ts">
	import { t } from '$lib/i18n';
	import { Button } from '@/components/ui/button';
</script>

<div class="space-y-6 text-center">
	<h1 class="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
		{$t('common.welcome')}
	</h1>
	<p class="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
		{$t('common.description')}
	</p>
	<div class="mt-8">
		<Button
			href="https://svelte.dev/docs/kit"
			variant="default"
			size="lg"
			target="_blank"
			rel="noopener noreferrer"
		>
			{$t('common.documentation_link')}
		</Button>
	</div>
</div>
