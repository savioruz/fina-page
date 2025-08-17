<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { authService } from '$lib/api/auth';
	import { authStore } from '$lib/stores/auth';
	import { ApiError } from '$lib/api/client';
	import { goto } from '$app/navigation';

	interface Props {
		id?: string;
	}

	const { id = crypto.randomUUID() }: Props = $props();

	let email = $state('');
	let password = $state('');
	let isLoading = $state(false);
	let errorMessage = $state('');
	let fieldErrors = $state<Record<string, string[]>>({});

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (!email.trim() || !password.trim()) {
			errorMessage = 'Please fill in all fields';
			return;
		}

		errorMessage = '';
		fieldErrors = {};
		isLoading = true;

		try {
			const response = await authService.login({
				email: email.trim(),
				password: password.trim()
			});

			if (response.data && response.data.access_token && response.data.refresh_token) {
				// Login successful
				authStore.login(response.data.access_token, response.data.refresh_token);
				// Redirect to dashboard
				await goto('/dashboard');
			} else {
				errorMessage = 'Login failed. Invalid response from server.';
			}
		} catch (error) {
			if (error instanceof ApiError) {
				if (error.errors) {
					// Handle field-specific validation errors
					fieldErrors = error.errors;
				} else {
					// Handle general error messages
					errorMessage = error.message || 'Login failed. Please check your credentials.';
				}
			} else {
				errorMessage = 'An unexpected error occurred. Please try again.';
			}
		} finally {
			isLoading = false;
		}
	}
</script>

<Card.Root class="mx-auto w-full max-w-sm">
	<Card.Header>
		<Card.Title class="text-2xl">Login</Card.Title>
		<Card.Description>Enter your email below to login to your account</Card.Description>
	</Card.Header>
	<Card.Content>
		<form onsubmit={handleSubmit} class="grid gap-4">
			{#if errorMessage}
				<div class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
					{errorMessage}
				</div>
			{/if}

			<div class="grid gap-2">
				<Label for="email-{id}">Email</Label>
				<Input
					id="email-{id}"
					type="email"
					placeholder="m@example.com"
					bind:value={email}
					required
					disabled={isLoading}
					class={fieldErrors.email ? 'border-red-500' : ''}
				/>
				{#if fieldErrors.email}
					<div class="text-sm text-red-600">
						{#each fieldErrors.email as error, index (index)}
							<div>{error}</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="grid gap-2">
				<div class="flex items-center">
					<Label for="password-{id}">Password</Label>
				</div>
				<Input
					id="password-{id}"
					type="password"
					bind:value={password}
					required
					disabled={isLoading}
					class={fieldErrors.password ? 'border-red-500' : ''}
				/>
				{#if fieldErrors.password}
					<div class="text-sm text-red-600">
						{#each fieldErrors.password as error, index (index)}
							<div>{error}</div>
						{/each}
					</div>
				{/if}
			</div>

			<Button type="submit" class="w-full" disabled={isLoading}>
				{#if isLoading}
					<svg
						class="mr-3 -ml-1 h-4 w-4 animate-spin text-white"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					Signing in...
				{:else}
					Login
				{/if}
			</Button>
		</form>
	</Card.Content>
</Card.Root>
