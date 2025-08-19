<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import type { Transaction } from '$lib/types/transaction';
	import { t } from '$lib/i18n';

	$: activeText = $t('common.status.active');
	$: inactiveText = $t('common.status.inactive');
	$: viewProofText = $t('common.transaction.actions.view_proof');

	export let transactions: Transaction[] = [];
	export let isLoading = false;

	let showProofDialog = false;
	let selectedProof: string | null = null;
	let selectedProofTransaction: Transaction | null = null;

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
	<!-- Responsive table wrapper with horizontal scroll -->
	<div class="w-full overflow-hidden rounded-md border">
		<div class="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-muted/50">
					<tr class="text-left">
						<th class="min-w-[80px] p-2 font-medium whitespace-nowrap sm:p-3"
							>{$t('common.transaction.fields.date')}</th
						>
						<th class="min-w-[70px] p-2 font-medium whitespace-nowrap sm:p-3"
							>{$t('common.transaction.fields.type')}</th
						>
						<th class="min-w-[90px] p-2 font-medium whitespace-nowrap sm:p-3"
							>{$t('common.transaction.fields.category')}</th
						>
						<th class="min-w-[120px] p-2 font-medium whitespace-nowrap sm:p-3"
							>{$t('common.transaction.fields.description')}</th
						>
						<th class="min-w-[60px] p-2 font-medium whitespace-nowrap sm:p-3"
							>{$t('common.transaction.fields.active')}</th
						>
						<th class="min-w-[100px] p-2 text-right font-medium whitespace-nowrap sm:p-3"
							>{$t('common.transaction.fields.amount_idr')}</th
						>
						<th class="min-w-[80px] p-2 text-right font-medium whitespace-nowrap sm:p-3"
							>{$t('common.transaction.fields.actions')}</th
						>
					</tr>
				</thead>
				<tbody>
					{#each transactions as t (t.id)}
						<tr class="border-t hover:bg-muted/30">
							<td class="p-2 text-xs whitespace-nowrap sm:p-3 sm:text-sm">{formatDate(t.date)}</td>
							<td class="p-2 whitespace-nowrap sm:p-3">
								<Badge
									variant={t.type === 'income' ? 'default' : 'destructive'}
									class="px-1 py-0.5 text-xs capitalize"
								>
									{t.type}
								</Badge>
							</td>
							<td
								class="max-w-[90px] truncate p-2 text-xs whitespace-nowrap sm:p-3 sm:text-sm"
								title={t.category_name}>{t.category_name}</td
							>
							<td
								class="max-w-[120px] truncate p-2 text-xs sm:max-w-[160px] sm:p-3 sm:text-sm"
								title={t.description || '-'}>{t.description || '-'}</td
							>
							<td class="p-2 whitespace-nowrap sm:p-3">
								<Badge variant={t.active ? 'default' : 'secondary'} class="px-1 py-0.5 text-xs">
									{t.active ? activeText : inactiveText}
								</Badge>
							</td>
							<td
								class="p-2 text-right text-xs font-medium whitespace-nowrap tabular-nums sm:p-3 sm:text-sm"
								>{formatAmount(t.amount)}</td
							>
							<td class="p-2 text-right whitespace-nowrap sm:p-3">
								{#if t.proof}
									<Button
										size="sm"
										variant="outline"
										onclick={() => openProofDialog(t)}
										class="h-6 px-2 py-1 text-xs"
									>
										{viewProofText}
									</Button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Scroll indicator for mobile -->
		<div class="block border-t bg-muted/20 p-2 text-center text-xs text-muted-foreground sm:hidden">
			← Scroll to see more →
		</div>
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
