<script lang="ts">
	import LoginForm from '$lib/components/ui/login-form/login-form.svelte';
	import { authStore } from '$lib/stores/auth';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		authStore.init();
		const unsubscribe = authStore.subscribe((state) => {
			if (state.isAuthenticated) {
				goto('/dashboard');
			}
		});

		return unsubscribe;
	});
</script>

<div class="flex h-screen w-full items-center justify-center px-4">
	<LoginForm />
</div>
