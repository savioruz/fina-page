<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import type { CreateTransactionRequest, Transaction } from '$lib/types/transaction';
	import { t } from '$lib/i18n';

	export let type: 'income' | 'expense';
	export let transaction: Transaction | null = null;
	export let categories: Array<{ id: string; name: string }> = [];
	export let isLoading = false;

	const dispatch = createEventDispatcher<{
		submit: { data: CreateTransactionRequest; file: File | null };
		cancel: void;
	}>();

	let form = {
		amount: transaction?.amount ?? 0,
		date: transaction?.date ?? new Date().toISOString().split('T')[0],
		description: transaction?.description ?? '',
		category: transaction?.category ?? '',
		proof: transaction?.proof ?? '',
		active: transaction?.active ?? true
	};

	let uploading = false;
	let selectedFile: File | null = null;

	function handleSubmit() {
		const transactionData: CreateTransactionRequest = {
			amount: Number(form.amount),
			date: form.date,
			type,
			description: form.description || undefined,
			category: form.category,
			proof: selectedFile ? 'file_upload_pending' : form.proof,
			active: form.active
		};

		dispatch('submit', { data: transactionData, file: selectedFile });
	}

	function handleCancel() {
		dispatch('cancel');
	}

	async function handleFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files || !input.files[0]) return;

		selectedFile = input.files[0];
		form.proof = 'file_selected';
	}
</script>

<form onsubmit={handleSubmit} class="space-y-4">
	<div class="space-y-2">
		<Label for="amount">{$t('common.transaction.fields.amount')}</Label>
		<Input
			id="amount"
			type="number"
			step="0.01"
			min="0"
			bind:value={form.amount}
			placeholder={$t('common.transaction.placeholders.enter_amount')}
			required
			disabled={isLoading}
		/>
	</div>

	<div class="space-y-2">
		<Label for="date">{$t('common.transaction.fields.date')}</Label>
		<Input id="date" type="date" bind:value={form.date} required disabled={isLoading} />
	</div>

	<div class="space-y-2">
		<Label for="category">{$t('common.transaction.fields.category')}</Label>
		<select
			id="category"
			bind:value={form.category}
			required
			disabled={isLoading}
			class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
		>
			<option value="">{$t('common.transaction.placeholders.select_category')}</option>
			{#each categories as category (category.id)}
				<option value={category.id}>{category.name}</option>
			{/each}
		</select>
	</div>

	<div class="space-y-2">
		<Label for="description">{$t('common.transaction.fields.description_optional')}</Label>
		<Textarea
			id="description"
			bind:value={form.description}
			placeholder={$t('common.transaction.placeholders.enter_description')}
			disabled={isLoading}
		/>
	</div>

	<div class="space-y-2">
		<Label for="proof"
			>{$t('common.transaction.fields.proof')}
			{transaction ? $t('common.transaction.labels.optional') : '*'}</Label
		>
		<div class="space-y-2">
			{#if transaction && form.proof && form.proof !== 'file_selected' && !selectedFile}
				<div class="flex items-center justify-between rounded border p-2 text-xs">
					<a href={form.proof} target="_blank" class="break-all underline">{form.proof}</a>
					<span class="text-muted-foreground">{$t('common.transaction.labels.current_proof')}</span>
				</div>
				<input
					id="proof"
					type="file"
					accept="image/*"
					onchange={handleFileChange}
					disabled={uploading || isLoading}
					class="block w-full text-sm"
				/>
				<p class="text-xs text-muted-foreground">
					{$t('common.transaction.labels.replace_proof_hint')}
				</p>
			{:else}
				<input
					id="proof"
					type="file"
					accept="image/*"
					onchange={handleFileChange}
					disabled={uploading || isLoading}
					required={!transaction}
					class="block w-full text-sm"
				/>
				{#if selectedFile}
					<p class="text-xs text-green-600">{$t('common.file_selected')}: {selectedFile.name}</p>
				{:else if transaction}
					<p class="text-xs text-muted-foreground">
						{$t('common.transaction.labels.update_proof_hint')}
					</p>
				{:else}
					<p class="text-xs text-muted-foreground">
						{$t('common.transaction.labels.proof_required_hint')}
					</p>
				{/if}
			{/if}
		</div>
	</div>

	<div class="flex items-center space-x-2">
		<input
			id="active"
			type="checkbox"
			bind:checked={form.active}
			disabled={isLoading}
			class="rounded border-gray-300"
		/>
		<Label for="active">{$t('common.transaction.fields.active')}</Label>
	</div>

	<div class="flex justify-end space-x-2">
		<Button type="button" variant="outline" onclick={handleCancel} disabled={isLoading}>
			{$t('common.transaction.actions.cancel')}
		</Button>
		<Button type="submit" disabled={isLoading || !form.category || (!transaction && !selectedFile)}>
			{isLoading
				? $t('common.transaction.actions.saving')
				: transaction
					? $t('common.transaction.actions.update')
					: $t('common.transaction.actions.create')}
			{type === 'income'
				? $t('common.transaction.types.income')
				: $t('common.transaction.types.expense')}
		</Button>
	</div>
</form>
