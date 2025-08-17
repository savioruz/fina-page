<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import type { Transaction } from '$lib/types/transaction';
	import { t } from '$lib/i18n';

	$: activeText = $t('common.status.active');
	$: inactiveText = $t('common.status.inactive');
	$: viewProofText = $t('common.transaction.actions.view_proof');
	$: editText = $t('common.transaction.actions.edit');
	$: deleteText = $t('common.transaction.actions.delete');

	export let transactions: Transaction[] = [];
	export let isLoading = false;

	// Dialog state for proof viewing
	let showProofDialog = false;
	let selectedProof: string | null = null;
	let selectedProofTransaction: Transaction | null = null;

	const dispatch = createEventDispatcher<{
		edit: { transaction: Transaction };
		delete: { id: string };
	}>();

	function handleEdit(transaction: Transaction) {
		dispatch('edit', { transaction });
	}

	function handleDelete(id: string) {
		dispatch('delete', { id });
	}

	function openProofDialog(transaction: Transaction) {
		selectedProof = transaction.proof || null;
		selectedProofTransaction = transaction;
		showProofDialog = true;
	}

	function formatAmount(amount: number): string {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount);
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('id-ID');
	}
</script>

{#if isLoading}
	<div class="flex items-center justify-center py-8 text-muted-foreground">
		{$t('common.loading_transactions')}
	</div>
{:else if transactions.length === 0}
	<div class="flex items-center justify-center py-8 text-muted-foreground">
		{$t('common.no_transactions_found')}
	</div>
{:else}
	<div class="overflow-x-auto rounded-md border">
		<table class="w-full text-sm">
			<thead class="bg-muted/50">
				<tr class="text-left">
					<th class="p-3 font-medium">{$t('common.transaction.fields.date')}</th>
					<th class="p-3 font-medium">{$t('common.transaction.fields.type')}</th>
					<th class="p-3 font-medium">{$t('common.transaction.fields.category')}</th>
					<th class="p-3 font-medium">{$t('common.transaction.fields.description')}</th>
					<th class="p-3 font-medium">{$t('common.transaction.fields.active')}</th>
					<th class="p-3 text-right font-medium">{$t('common.transaction.fields.amount_idr')}</th>
					<th class="p-3 text-right font-medium">{$t('common.transaction.fields.actions')}</th>
				</tr>
			</thead>
			<tbody>
				{#each transactions as t (t.id)}
					<tr class="border-t">
						<td class="p-3 whitespace-nowrap">{formatDate(t.date)}</td>
						<td class="p-3">
							<Badge variant={t.type === 'income' ? 'default' : 'destructive'} class="capitalize">
								{t.type}
							</Badge>
						</td>
						<td class="p-3">{t.category_name}</td>
						<td class="max-w-[240px] truncate p-3" title={t.description}>{t.description}</td>
						<td class="p-3">
							<Badge variant={t.active ? 'default' : 'secondary'}>
								{t.active ? activeText : inactiveText}
							</Badge>
						</td>
						<td class="p-3 text-right font-medium tabular-nums">{formatAmount(t.amount)}</td>
						<td class="space-x-1 p-3 text-right">
							{#if t.proof}
								<Button size="sm" variant="outline" onclick={() => openProofDialog(t)}
									>{viewProofText}</Button
								>
							{/if}
							<Button size="sm" variant="ghost" onclick={() => handleEdit(t)}>{editText}</Button>
							<Button
								size="sm"
								variant="ghost"
								class="text-red-600"
								onclick={() => handleDelete(t.id)}>{deleteText}</Button
							>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<!-- Proof Dialog -->
<Dialog.Root bind:open={showProofDialog}>
	<Dialog.Content class="sm:max-w-[600px]">
		<Dialog.Header>
			<Dialog.Title>{$t('common.transaction.proof.dialog_title')}</Dialog.Title>
			{#if selectedProofTransaction}
				<Dialog.Description>
					{selectedProofTransaction.type === 'income'
						? $t('common.transaction.types.income')
						: $t('common.transaction.types.expense')} -
					{selectedProofTransaction.category_name} -
					{formatAmount(selectedProofTransaction.amount)}
				</Dialog.Description>
			{/if}
		</Dialog.Header>
		<div class="mt-4">
			{#if selectedProof}
				<div class="flex justify-center">
					<img
						src={selectedProof}
						alt="Transaction proof"
						class="max-h-[400px] max-w-full rounded-lg object-contain shadow-lg"
						onerror={(e) => {
							const target = e.target as HTMLImageElement;
							if (target) {
								target.style.display = 'none';
								const sibling = target.nextElementSibling as HTMLElement;
								if (sibling) sibling.style.display = 'block';
							}
						}}
					/>
					<div class="hidden text-center text-muted-foreground">
						<p>{$t('common.transaction.proof.failed_to_load')}</p>
						<Button
							variant="outline"
							onclick={() => selectedProof && window.open(selectedProof, '_blank')}
							class="mt-2"
						>
							{$t('common.transaction.proof.open_in_new_tab')}
						</Button>
					</div>
				</div>
				<div class="mt-4 flex justify-center gap-2">
					<Button
						variant="outline"
						onclick={() => selectedProof && window.open(selectedProof, '_blank')}
					>
						{$t('common.transaction.proof.open_in_new_tab')}
					</Button>
					<Button variant="outline" onclick={() => (showProofDialog = false)}>
						{$t('common.transaction.actions.close')}
					</Button>
				</div>
			{:else}
				<p class="text-center text-muted-foreground">
					{$t('common.transaction.proof.no_proof_available')}
				</p>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
