<script lang="ts">
	import { onMount } from 'svelte';
	import { publicTransactionService } from '$lib/api/public-transaction';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import type { Transaction } from '$lib/types/transaction';
	import { t } from '$lib/i18n';
	import { Trash, FileImage } from 'lucide-svelte';

	let transactions: Transaction[] = [];
	let filteredTransactions: Transaction[] = [];
	let summary = {
		total_income: 0,
		total_expense: 0
	};
	let isLoading = true;
	let error: string | null = null;
	let searchQuery = '';
	let selectedType: 'all' | 'income' | 'expense' = 'all';
	let currentPage = 1;
	let totalPages = 1;
	const itemsPerPage = 10;

	let showProofDialog = false;
	let selectedProof: string | null = null;
	let selectedProofTransaction: Transaction | null = null;

	$: {
		if (transactions.length > 0) {
			filterTransactions();
		}
	}

	function filterTransactions() {
		let filtered = transactions;

		if (searchQuery.trim()) {
			filtered = filtered.filter(
				(t) =>
					t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
					t.category_name.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}

		if (selectedType !== 'all') {
			filtered = filtered.filter((t) => t.type === selectedType);
		}

		filtered = filtered.filter((t) => t.active);

		filteredTransactions = filtered;
		totalPages = Math.ceil(filtered.length / itemsPerPage);
		currentPage = Math.min(currentPage, totalPages || 1);
	}

	function getPaginatedTransactions() {
		const start = (currentPage - 1) * itemsPerPage;
		const end = start + itemsPerPage;
		return filteredTransactions.slice(start, end);
	}

	function formatAmount(amount: number): string {
		// Handle null, undefined, or NaN values
		const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(safeAmount);
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('id-ID', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getBalance(): number {
		return summary.total_income - summary.total_expense;
	}

	function nextPage() {
		if (currentPage < totalPages) {
			currentPage++;
		}
	}

	function prevPage() {
		if (currentPage > 1) {
			currentPage--;
		}
	}

	function resetFilters() {
		searchQuery = '';
		selectedType = 'all';
		currentPage = 1;
	}

	function openProofDialog(transaction: Transaction) {
		selectedProof = transaction.proof || null;
		selectedProofTransaction = transaction;
		showProofDialog = true;
	}

	async function loadData() {
		try {
			isLoading = true;
			error = null;

			// Load summary and recent transactions in parallel
			const [summaryData, transactionsData] = await Promise.all([
				publicTransactionService.getPublicTransactionSummary(),
				publicTransactionService.getPublicTransactions({
					limit: 100,
					active: true
				})
			]);

			// Handle potential null/undefined values from API
			summary = {
				total_income: summaryData?.total_income || 0,
				total_expense: summaryData?.total_expense || 0
			};
			transactions = transactionsData?.transactions || [];
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'Failed to load data';
			console.error('Error loading public transactions:', err);
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadData();
	});
</script>

<!-- Main Container -->
<div class="min-h-screen bg-background">
	<!-- Hero Section -->
	<section class="py-4">
		<div class="container mx-auto px-4">
			<div class="mx-auto max-w-4xl text-center">
				<h1 class="mb-8 text-2xl font-bold text-foreground md:text-3xl">
					{$t('common.home.welcome_title')}
				</h1>
				{#if isLoading}
					<div class="mx-auto max-w-2xl">
						<Card>
							<CardHeader class="space-y-4 text-center">
								<Skeleton class="mx-auto h-6 w-24" />
								<Skeleton class="mx-auto h-10 w-40" />
							</CardHeader>
							<CardContent class="pt-0">
								<div class="grid grid-cols-2 gap-4">
									<div class="space-y-2 text-center">
										<Skeleton class="mx-auto h-4 w-16" />
										<Skeleton class="mx-auto h-6 w-24" />
									</div>
									<div class="space-y-2 text-center">
										<Skeleton class="mx-auto h-4 w-20" />
										<Skeleton class="mx-auto h-6 w-24" />
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				{:else if error}
					<Card class="border-destructive">
						<CardContent class="pt-6">
							<p class="text-center text-destructive">{error}</p>
							<Button variant="outline" onclick={loadData} class="mt-4">
								{$t('common.loading')}
							</Button>
						</CardContent>
					</Card>
				{:else}
					<!-- Summary Card with Title -->
					<div class="mx-auto max-w-2xl">
						<Card
							class="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-100 dark:border-blue-800 dark:from-blue-950 dark:to-indigo-950"
						>
							<CardHeader class="pb-4 text-center">
								<CardTitle class="text-xl font-bold text-foreground">
									{$t('common.home.balance')}
								</CardTitle>
								<CardTitle
									class="text-3xl font-bold md:text-4xl {getBalance() >= 0
										? 'text-blue-600'
										: 'text-red-600'}"
								>
									{formatAmount(getBalance())}
								</CardTitle>
							</CardHeader>
							<CardContent class="pt-0">
								<div class="grid grid-cols-2 gap-4">
									<!-- Income -->
									<div class="text-center">
										<div class="mb-1 text-sm text-muted-foreground">Pemasukan</div>
										<div class="text-lg font-semibold text-green-600">
											{formatAmount(summary.total_income)}
										</div>
									</div>

									<!-- Expense -->
									<div class="text-center">
										<div class="mb-1 text-sm text-muted-foreground">Pengeluaran</div>
										<div class="text-lg font-semibold text-red-600">
											{formatAmount(summary.total_expense)}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				{/if}
			</div>
		</div>
	</section>

	<!-- Transactions Section -->
	<section class="py-12">
		<div class="container mx-auto px-4">
			<div class="mx-auto max-w-6xl">
				<div
					class="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
				>
					<div>
						<h2 class="text-2xl font-bold md:text-3xl">{$t('common.transactions')}</h2>
						<p class="mt-2 text-muted-foreground">
							{#if !isLoading}
								{filteredTransactions.length} of {transactions.length} transactions
							{/if}
						</p>
					</div>

					<!-- Filters -->
					<div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
						<Input
							bind:value={searchQuery}
							placeholder={$t('common.search_by_description')}
							class="w-full sm:w-64"
						/>
						<select
							bind:value={selectedType}
							class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none sm:w-auto"
						>
							<option value="all">{$t('common.all')}</option>
							<option value="income">{$t('common.income')}</option>
							<option value="expense">{$t('common.expenses')}</option>
						</select>
						{#if searchQuery || selectedType !== 'all'}
							<Button variant="outline" size="sm" onclick={resetFilters}>
								<Trash class="h-4 w-4 text-red-500" />
							</Button>
						{/if}
					</div>
				</div>

				<!-- Transactions List -->
				{#if isLoading}
					<div class="space-y-4">
						{#each [0, 1, 2, 3, 4] as index (index)}
							<Card>
								<CardContent class="p-4">
									<div class="flex items-center justify-between">
										<div class="flex-1 space-y-2">
											<Skeleton class="h-4 w-32" />
											<Skeleton class="h-3 w-48" />
										</div>
										<div class="space-y-2 text-right">
											<Skeleton class="ml-auto h-4 w-20" />
											<Skeleton class="ml-auto h-3 w-16" />
										</div>
									</div>
								</CardContent>
							</Card>
						{/each}
					</div>
				{:else if error}
					<Card class="border-destructive">
						<CardContent class="pt-6 text-center">
							<p class="mb-4 text-destructive">{error}</p>
							<Button variant="outline" onclick={loadData}>Try Again</Button>
						</CardContent>
					</Card>
				{:else if filteredTransactions.length === 0}
					<Card>
						<CardContent class="pt-6 text-center">
							<p class="text-muted-foreground">{$t('common.no_transactions_found')}</p>
							{#if searchQuery || selectedType !== 'all'}
								<Button variant="outline" onclick={resetFilters} class="mt-4">
									{$t('common.clear')}
									{$t('common.filter')}
								</Button>
							{/if}
						</CardContent>
					</Card>
				{:else}
					<!-- Desktop Table View -->
					<div class="hidden lg:block">
						<Card>
							<div class="overflow-x-auto">
								<table class="w-full text-sm">
									<thead class="bg-muted/50">
										<tr class="text-left">
											<th class="p-4 font-medium">{$t('common.transaction.fields.date')}</th>
											<th class="p-4 font-medium">{$t('common.transaction.fields.type')}</th>
											<th class="p-4 font-medium">{$t('common.transaction.fields.category')}</th>
											<th class="p-4 font-medium">{$t('common.transaction.fields.description')}</th>
											<th class="p-4 text-right font-medium"
												>{$t('common.transaction.fields.amount_idr')}</th
											>
											<th class="p-4 text-center font-medium"
												>{$t('common.transaction.fields.proof')}</th
											>
										</tr>
									</thead>
									<tbody>
										{#each getPaginatedTransactions() as transaction (transaction.id)}
											<tr class="border-t transition-colors hover:bg-muted/30">
												<td class="p-4 whitespace-nowrap">{formatDate(transaction.date)}</td>
												<td class="p-4">
													<Badge
														variant={transaction.type === 'income' ? 'default' : 'destructive'}
														class="capitalize"
													>
														{transaction.type}
													</Badge>
												</td>
												<td class="p-4">{transaction.category_name}</td>
												<td class="max-w-[300px] truncate p-4" title={transaction.description}>
													{transaction.description}
												</td>
												<td class="p-4 text-right font-medium tabular-nums">
													{formatAmount(transaction.amount)}
												</td>
												<td class="p-4 text-center">
													{#if transaction.proof}
														<Button
															size="sm"
															variant="outline"
															onclick={() => openProofDialog(transaction)}
														>
															<FileImage class="mr-1 h-4 w-4" />
															{$t('common.transaction.actions.view_proof')}
														</Button>
													{:else}
														<span class="text-sm text-muted-foreground"
															>{$t('common.transaction.proof.no_proof')}</span
														>
													{/if}
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</Card>
					</div>

					<!-- Mobile Card View -->
					<div class="space-y-4 lg:hidden">
						{#each getPaginatedTransactions() as transaction (transaction.id)}
							<Card>
								<CardContent class="p-4">
									<div class="mb-3 flex items-start justify-between">
										<div class="flex-1">
											<div class="mb-2 flex items-center gap-2">
												<Badge
													variant={transaction.type === 'income' ? 'default' : 'destructive'}
													class="text-xs capitalize"
												>
													{transaction.type}
												</Badge>
												<span class="text-xs text-muted-foreground">
													{formatDate(transaction.date)}
												</span>
											</div>
											<h3 class="mb-1 text-sm font-medium">{transaction.category_name}</h3>
											<p class="line-clamp-2 text-xs text-muted-foreground">
												{transaction.description}
											</p>
										</div>
										<div class="ml-4 text-right">
											<div
												class="text-lg font-bold tabular-nums {transaction.type === 'income'
													? 'text-green-600'
													: 'text-red-600'}"
											>
												{formatAmount(transaction.amount)}
											</div>
										</div>
									</div>
									<!-- Proof button for mobile -->
									<div class="mt-3 flex justify-end">
										{#if transaction.proof}
											<Button
												size="sm"
												variant="outline"
												onclick={() => openProofDialog(transaction)}
											>
												<FileImage class="mr-1 h-4 w-4" />
												{$t('common.transaction.actions.view_proof')}
											</Button>
										{:else}
											<span class="text-xs text-muted-foreground"
												>{$t('common.transaction.proof.no_proof')}</span
											>
										{/if}
									</div>
								</CardContent>
							</Card>
						{/each}
					</div>

					<!-- Pagination -->
					{#if totalPages > 1}
						<div class="mt-8 flex items-center justify-center gap-2">
							<Button variant="outline" size="sm" onclick={prevPage} disabled={currentPage === 1}>
								Previous
							</Button>
							<span class="px-4 text-sm text-muted-foreground">
								{currentPage} of {totalPages}
							</span>
							<Button
								variant="outline"
								size="sm"
								onclick={nextPage}
								disabled={currentPage === totalPages}
							>
								Next
							</Button>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</section>
</div>

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

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
