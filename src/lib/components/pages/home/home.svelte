<script lang="ts">
	import { onMount } from 'svelte';
	import { publicTransactionService } from '$lib/api/public-transaction';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { TransactionList } from '$lib/components/ui/transaction-list/index.js';
	import type { Transaction } from '$lib/types/transaction';
	import { t } from '$lib/i18n';
	import { Trash } from 'lucide-svelte';

	let transactions: Transaction[] = [];
	let filteredTransactions: Transaction[] = [];
	let summary = {
		total_income: 0,
		total_expense: 0
	};
	let isLoading = true;
	let error: string | null = null;
	let isLoadingTransactions = false;
	let selectedType: 'all' | 'income' | 'expense' = 'all';
	let selectedPeriod: 'none' | 'month' | 'year' = 'none';
	let currentPage = 1;
	let totalPages = 1;
	const itemsPerPage = 10;
	let showTransactions = false;

	function getPaginatedTransactions() {
		const start = (currentPage - 1) * itemsPerPage;
		const end = start + itemsPerPage;
		const paginated = filteredTransactions.slice(start, end);

		console.log('getPaginatedTransactions:', {
			filteredTransactions: filteredTransactions.length,
			start,
			end,
			paginated: paginated.length,
			isLoading
		});

		return paginated;
	}

	function getDateFilter(): string | undefined {
		const now = new Date();
		const currentYear = now.getFullYear();
		const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11, API expects 1-12

		switch (selectedPeriod) {
			case 'month':
				// Format: YYYY-MM for current month
				return `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
			case 'year':
				// Format: YYYY for current year
				return currentYear.toString();
			default:
				return undefined;
		}
	}

	function formatAmount(amount: number): string {
		const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(safeAmount);
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
		selectedPeriod = 'none';
		currentPage = 1;
		showTransactions = false;
		transactions = [];
	}

	async function loadTransactions() {
		try {
			isLoadingTransactions = true;
			error = null;

			const filters: {
				limit: number;
				type?: string;
				date?: string;
			} = {
				limit: 100
			};

			if (selectedType !== 'all') {
				filters.type = selectedType;
			}

			const dateFilter = getDateFilter();
			if (dateFilter) {
				filters.date = dateFilter;
			}

			const transactionsData = await publicTransactionService.getPublicTransactions(filters);

			if (Array.isArray(transactionsData)) {
				transactions = transactionsData;
			} else if (transactionsData?.transactions) {
				transactions = transactionsData.transactions;
			} else {
				transactions = [];
			}

			filteredTransactions = transactions;
			totalPages = Math.ceil(transactions.length / itemsPerPage);
			currentPage = 1;
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'Failed to load transactions';
			console.error('Error loading transactions:', err);
		} finally {
			isLoadingTransactions = false;
		}
	}

	function selectFilter(type: 'all' | 'income' | 'expense', period: 'none' | 'month' | 'year') {
		console.log('selectFilter called with:', { type, period });
		selectedType = type;
		selectedPeriod = period;
		showTransactions = true;

		loadTransactions();
	}

	async function loadData() {
		try {
			isLoading = true;
			error = null;

			const summaryData = await publicTransactionService.getPublicTransactionSummary();

			summary = {
				total_income: summaryData?.total_income || 0,
				total_expense: summaryData?.total_expense || 0
			};
		} catch (err: unknown) {
			error = err instanceof Error ? err.message : 'Failed to load data';
			console.error('Error loading summary:', err);
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
	<section class="py-6 sm:py-8 lg:py-12">
		<div class="container mx-auto px-4 sm:px-6 lg:px-8">
			<div class="mx-auto max-w-4xl text-center">
				<h1
					class="mb-6 text-xl font-bold text-foreground sm:mb-8 sm:text-2xl md:text-3xl lg:text-4xl"
				>
					{$t('common.home.welcome_title')}
				</h1>
				{#if isLoading}
					<div class="mx-auto w-full max-w-xs sm:max-w-md lg:max-w-2xl">
						<Card>
							<CardHeader class="space-y-3 text-center sm:space-y-4">
								<Skeleton class="mx-auto h-5 w-20 sm:h-6 sm:w-24" />
								<Skeleton class="mx-auto h-8 w-32 sm:h-10 sm:w-40" />
							</CardHeader>
							<CardContent class="pt-0">
								<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
									<div class="space-y-2 text-center">
										<Skeleton class="mx-auto h-3 w-14 sm:h-4 sm:w-16" />
										<Skeleton class="mx-auto h-5 w-20 sm:h-6 sm:w-24" />
									</div>
									<div class="space-y-2 text-center">
										<Skeleton class="mx-auto h-3 w-16 sm:h-4 sm:w-20" />
										<Skeleton class="mx-auto h-5 w-20 sm:h-6 sm:w-24" />
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				{:else if error}
					<div class="mx-auto w-full max-w-xs sm:max-w-md lg:max-w-2xl">
						<Card class="border-destructive">
							<CardContent class="pt-6">
								<p class="text-center text-sm text-destructive sm:text-base">{error}</p>
								<div class="mt-4 flex justify-center">
									<Button variant="outline" onclick={loadData} size="sm" class="w-full sm:w-auto">
										{$t('common.loading')}
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				{:else}
					<!-- Summary Card with Title -->
					<div class="mx-auto w-full max-w-xs sm:max-w-md lg:max-w-2xl">
						<Card
							class="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-100 dark:border-blue-800 dark:from-blue-950 dark:to-indigo-950"
						>
							<CardHeader class="pb-3 text-center sm:pb-4">
								<CardTitle class="text-lg font-bold text-foreground sm:text-xl">
									{$t('common.home.balance')}
								</CardTitle>
								<CardTitle
									class="text-xl font-bold break-all sm:text-2xl md:text-3xl lg:text-4xl {getBalance() >=
									0
										? 'text-blue-600'
										: 'text-red-600'}"
								>
									{formatAmount(getBalance())}
								</CardTitle>
							</CardHeader>
							<CardContent class="pt-0">
								<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
									<!-- Income -->
									<div
										class="rounded-lg bg-white/50 p-3 text-center sm:bg-transparent sm:p-0 dark:bg-gray-800/50 sm:dark:bg-transparent"
									>
										<div class="mb-1 text-xs font-medium text-muted-foreground sm:text-sm">
											Pemasukan
										</div>
										<div
											class="text-sm font-semibold break-all text-green-600 sm:text-base lg:text-lg"
										>
											{formatAmount(summary.total_income)}
										</div>
									</div>

									<!-- Expense -->
									<div
										class="rounded-lg bg-white/50 p-3 text-center sm:bg-transparent sm:p-0 dark:bg-gray-800/50 sm:dark:bg-transparent"
									>
										<div class="mb-1 text-xs font-medium text-muted-foreground sm:text-sm">
											Pengeluaran
										</div>
										<div
											class="text-sm font-semibold break-all text-red-600 sm:text-base lg:text-lg"
										>
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
	<section class="py-8 sm:py-12">
		<div class="container mx-auto px-4 sm:px-6 lg:px-8">
			<div class="w-full">
				<div
					class="mb-6 flex flex-col items-start justify-between gap-3 sm:mb-8 sm:flex-row sm:items-center sm:gap-4"
				>
					<div>
						<h2 class="text-xl font-bold sm:text-2xl md:text-3xl">{$t('common.transactions')}</h2>
						<p class="mt-1 text-sm text-muted-foreground sm:mt-2 sm:text-base">
							{#if showTransactions}
								{filteredTransactions.length} of {transactions.length} transactions
							{:else}
								Click a filter to view transactions
							{/if}
						</p>
					</div>
				</div>

				<!-- Filter Badges -->
				<div class="mb-4 sm:mb-6">
					<!-- Mobile: Grid layout -->
					<div class="grid grid-cols-2 gap-2 sm:hidden">
						<Badge
							variant={selectedType === 'all' && selectedPeriod === 'month' ? 'default' : 'outline'}
							class="flex min-h-[36px] cursor-pointer items-center justify-center px-3 py-2 text-xs transition-all duration-150 hover:bg-primary/80 active:scale-95 active:bg-primary"
							onclick={() => selectFilter('all', 'month')}
						>
							This Month
						</Badge>
						<Badge
							variant={selectedType === 'all' && selectedPeriod === 'year' ? 'default' : 'outline'}
							class="flex min-h-[36px] cursor-pointer items-center justify-center px-3 py-2 text-xs transition-all duration-150 hover:bg-primary/80 active:scale-95 active:bg-primary"
							onclick={() => selectFilter('all', 'year')}
						>
							This Year
						</Badge>
						<Badge
							variant={selectedType === 'income' && selectedPeriod === 'none'
								? 'default'
								: 'outline'}
							class="flex min-h-[36px] cursor-pointer items-center justify-center px-3 py-2 text-xs transition-all duration-150 hover:bg-green-600/80 hover:text-white active:scale-95 active:bg-green-700"
							onclick={() => selectFilter('income', 'none')}
						>
							All Income
						</Badge>
						<Badge
							variant={selectedType === 'expense' && selectedPeriod === 'none'
								? 'default'
								: 'outline'}
							class="flex min-h-[36px] cursor-pointer items-center justify-center px-3 py-2 text-xs transition-all duration-150 hover:bg-red-600/80 hover:text-white active:scale-95 active:bg-red-700"
							onclick={() => selectFilter('expense', 'none')}
						>
							All Expenses
						</Badge>
						<Badge
							variant={selectedType === 'income' && selectedPeriod === 'month'
								? 'default'
								: 'outline'}
							class="flex min-h-[36px] cursor-pointer items-center justify-center px-3 py-2 text-xs transition-all duration-150 hover:bg-green-600/80 hover:text-white active:scale-95 active:bg-green-700"
							onclick={() => selectFilter('income', 'month')}
						>
							Income Month
						</Badge>
						<Badge
							variant={selectedType === 'expense' && selectedPeriod === 'month'
								? 'default'
								: 'outline'}
							class="flex min-h-[36px] cursor-pointer items-center justify-center px-3 py-2 text-xs transition-all duration-150 hover:bg-red-600/80 hover:text-white active:scale-95 active:bg-red-700"
							onclick={() => selectFilter('expense', 'month')}
						>
							Expense Month
						</Badge>
					</div>

					<!-- Desktop: Horizontal scroll layout -->
					<div class="hidden overflow-x-auto pb-2 sm:block">
						<div class="flex min-w-max gap-2">
							<Badge
								variant={selectedType === 'all' && selectedPeriod === 'month'
									? 'default'
									: 'outline'}
								class="cursor-pointer text-sm whitespace-nowrap transition-all duration-150 hover:bg-primary/80 active:scale-95 active:bg-primary"
								onclick={() => selectFilter('all', 'month')}
							>
								This Month
							</Badge>
							<Badge
								variant={selectedType === 'all' && selectedPeriod === 'year'
									? 'default'
									: 'outline'}
								class="cursor-pointer text-sm whitespace-nowrap transition-all duration-150 hover:bg-primary/80 active:scale-95 active:bg-primary"
								onclick={() => selectFilter('all', 'year')}
							>
								This Year
							</Badge>
							<Badge
								variant={selectedType === 'income' && selectedPeriod === 'none'
									? 'default'
									: 'outline'}
								class="cursor-pointer text-sm whitespace-nowrap transition-all duration-150 hover:bg-green-600/80 hover:text-white active:scale-95 active:bg-green-700"
								onclick={() => selectFilter('income', 'none')}
							>
								All Income
							</Badge>
							<Badge
								variant={selectedType === 'expense' && selectedPeriod === 'none'
									? 'default'
									: 'outline'}
								class="cursor-pointer text-sm whitespace-nowrap transition-all duration-150 hover:bg-red-600/80 hover:text-white active:scale-95 active:bg-red-700"
								onclick={() => selectFilter('expense', 'none')}
							>
								All Expenses
							</Badge>
							<Badge
								variant={selectedType === 'income' && selectedPeriod === 'month'
									? 'default'
									: 'outline'}
								class="cursor-pointer text-sm whitespace-nowrap transition-all duration-150 hover:bg-green-600/80 hover:text-white active:scale-95 active:bg-green-700"
								onclick={() => selectFilter('income', 'month')}
							>
								Income This Month
							</Badge>
							<Badge
								variant={selectedType === 'expense' && selectedPeriod === 'month'
									? 'default'
									: 'outline'}
								class="cursor-pointer text-sm whitespace-nowrap transition-all duration-150 hover:bg-red-600/80 hover:text-white active:scale-95 active:bg-red-700"
								onclick={() => selectFilter('expense', 'month')}
							>
								Expenses This Month
							</Badge>
						</div>
					</div>

					{#if showTransactions}
						<div class="mt-3 flex justify-center sm:justify-start">
							<Badge
								variant="secondary"
								class="cursor-pointer px-3 py-2 text-xs transition-all duration-150 hover:bg-gray-600/80 active:scale-95 active:bg-gray-700 sm:text-sm"
								onclick={resetFilters}
							>
								<Trash class="mr-1 h-3 w-3" />
								Clear Filters
							</Badge>
						</div>
					{/if}
				</div>

				<!-- Transactions List -->
				{#if !showTransactions}
					<Card>
						<CardContent class="pt-6 text-center">
							<p class="text-sm text-muted-foreground sm:text-base">
								Select a filter above to view transactions
							</p>
							<p class="mt-2 text-xs text-muted-foreground sm:text-sm">
								Choose from periods or transaction types
							</p>
						</CardContent>
					</Card>
				{:else if error}
					<Card class="border-destructive">
						<CardContent class="pt-6 text-center">
							<p class="mb-4 text-sm text-destructive sm:text-base">{error}</p>
							<Button
								variant="outline"
								onclick={loadTransactions}
								size="sm"
								class="w-full sm:w-auto">Try Again</Button
							>
						</CardContent>
					</Card>
				{:else if transactions.length === 0}
					<Card>
						<CardContent class="pt-6 text-center">
							<div class="flex items-center justify-center py-4">
								<Skeleton class="h-4 w-32 sm:w-48" />
							</div>
							<p class="text-xs text-muted-foreground sm:text-sm">Loading transactions...</p>
						</CardContent>
					</Card>
				{:else if filteredTransactions.length === 0}
					<Card>
						<CardContent class="pt-6 text-center">
							<p class="text-sm text-muted-foreground sm:text-base">
								{$t('common.no_transactions_found')}
							</p>
							<p class="mt-2 text-xs text-muted-foreground sm:text-sm">
								Try selecting a different filter
							</p>
						</CardContent>
					</Card>
				{:else}
					<div class="w-full overflow-x-auto">
						<TransactionList
							transactions={getPaginatedTransactions()}
							isLoading={isLoadingTransactions}
						/>
					</div>

					<!-- Pagination -->
					{#if totalPages > 1}
						<div
							class="mt-6 flex flex-col items-center gap-3 sm:mt-8 sm:flex-row sm:justify-center sm:gap-2"
						>
							<Button
								variant="outline"
								size="sm"
								onclick={prevPage}
								disabled={currentPage === 1}
								class="w-full sm:w-auto"
							>
								Previous
							</Button>
							<span class="px-2 text-xs text-muted-foreground sm:px-4 sm:text-sm">
								{currentPage} of {totalPages}
							</span>
							<Button
								variant="outline"
								size="sm"
								onclick={nextPage}
								disabled={currentPage === totalPages}
								class="w-full sm:w-auto"
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
