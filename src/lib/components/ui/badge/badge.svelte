<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	type $$Props = HTMLAttributes<HTMLDivElement> & {
		variant?: 'default' | 'secondary' | 'destructive' | 'outline';
	};

	let { class: className, variant = 'default', ...restProps }: $$Props = $props();

	function getVariantClasses(variant: string) {
		switch (variant) {
			case 'secondary':
				return 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80';
			case 'destructive':
				return 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80';
			case 'outline':
				return 'text-foreground';
			default:
				return 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80';
		}
	}
</script>

<div
	class={cn(
		'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none',
		getVariantClasses(variant),
		className
	)}
	{...restProps}
>
	<slot />
</div>
