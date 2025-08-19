<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog';
	import { TransactionForm } from '$lib/components/ui/transaction-form/index.js';
	import { TransactionList } from '$lib/components/ui/transaction-list/index.js';
	import { transactionService } from '$lib/api/transaction';
	import { categoryService } from '$lib/api/category';
	import type {
		Transaction,
		CreateTransactionRequest,
		TransactionFilters
	} from '$lib/types/transaction';
	import { t } from '$lib/i18n';

	let transactions: Transaction[] = [];
	let categories: Array<{ id: string; name: string }> = [];
	let allCategories: Array<{ id: string; name: string }> = [];
	let isLoading = false;
	let isFormLoading = false;
	let showCreateForm = false;
	let showEditForm = false;
	let editingTransaction: Transaction | null = null;

	let searchDescription = '';
	let selectedCategory = '';
	let activeFilter: boolean | undefined = undefined;

	onMount(loadData);

	async function loadData() {
		isLoading = true;
		try {
			const transactionFilters: TransactionFilters = { type: 'income' };
			if (searchDescription.trim()) transactionFilters.description = searchDescription.trim();
			if (selectedCategory) {
				// Find category name from ID for API filter
				const categoryName = allCategories.find((cat) => cat.id === selectedCategory)?.name;
				if (categoryName) transactionFilters.category = categoryName;
			}
			if (activeFilter !== undefined) transactionFilters.active = activeFilter;

			const [transactionsResponse, categoriesResponse, allCategoriesResponse] = await Promise.all([
				transactionService.getTransactions(transactionFilters),
				categoryService.getCategories({ active: true }),
				categoryService.getCategories({}) // Get all categories for filter dropdown
			]);
			transactions = transactionsResponse.transactions;
			categories = categoriesResponse.categories.map((cat) => ({ id: cat.id, name: cat.name }));
			allCategories = allCategoriesResponse.categories.map((cat) => ({
				id: cat.id,
				name: cat.name
			}));
		} catch (e) {
			console.error(e);
		} finally {
			isLoading = false;
		}
	}

	function applyFilters() {
		loadData();
	}

	function clearFilters() {
		searchDescription = '';
		selectedCategory = '';
		activeFilter = undefined;
		loadData();
	}

	function handleEditTransaction(event: CustomEvent<{ transaction: Transaction }>) {
		editingTransaction = event.detail.transaction;
		showEditForm = true;
	}
	async function handleDeleteTransaction(event: CustomEvent<{ id: string }>) {
		if (!confirm('Delete transaction?')) return;
		await transactionService.deleteTransaction(event.detail.id);
		await loadData();
	}
	function handleFormCancel() {
		showCreateForm = false;
		showEditForm = false;
		editingTransaction = null;
	}
	async function handleCreateTransaction(
		event: CustomEvent<{ data: CreateTransactionRequest; file: File | null }>
	) {
		isFormLoading = true;
		try {
			const { data, file } = event.detail;

			if (file) {
				await transactionService.createTransactionWithFile(data, file);
			} else {
				await transactionService.createTransaction(data);
			}

			showCreateForm = false;
			await loadData();
		} finally {
			isFormLoading = false;
		}
	}
	async function handleUpdateTransaction(
		event: CustomEvent<{ data: CreateTransactionRequest; file: File | null }>
	) {
		if (!editingTransaction) return;
		isFormLoading = true;
		try {
			const { data, file } = event.detail;

			await transactionService.updateTransaction(editingTransaction.id, data);

			if (file) {
				try {
					const uploadResult = await transactionService.uploadProof(editingTransaction.id, file);
					await transactionService.updateTransaction(editingTransaction.id, {
						proof: uploadResult.data
					});
				} catch (uploadError) {
					console.error('Failed to upload proof:', uploadError);
				}
			}

			showEditForm = false;
			editingTransaction = null;
			await loadData();
		} finally {
			isFormLoading = false;
		}
	}
</script>

<div class="flex flex-1 flex-col gap-4 p-4">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">{$t('common.transaction.types.income')}</h1>
		<Button
			class="text-xs md:text-sm"
			onclick={() => {
				showCreateForm = true;
			}}>{$t('common.transaction.actions.add_income')}</Button
		>
	</div>

	<!-- Filters Card -->
	<Card>
		<CardContent class="space-y-4 pt-6">
			<div class="flex flex-col gap-4 md:flex-row">
				<div class="flex-1">
					<Input
						placeholder={$t('common.transaction.filters.search_description')}
						bind:value={searchDescription}
						onkeydown={(e) => e.key === 'Enter' && applyFilters()}
					/>
				</div>
				<div class="flex-1">
					<select
						bind:value={selectedCategory}
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
					>
						<option value="">All Categories</option>
						{#each allCategories as category (category.id)}
							<option value={category.id}>{category.name}</option>
						{/each}
					</select>
				</div>
				<div class="flex gap-2">
					<Button onclick={applyFilters} class="md:text-md text-xs">Filter</Button>
					<Button variant="outline" onclick={clearFilters}>Clear</Button>
				</div>
			</div>
			<div class="flex gap-2">
				<Button
					variant={activeFilter === undefined ? 'default' : 'outline'}
					size="sm"
					onclick={() => {
						activeFilter = undefined;
						applyFilters();
					}}
				>
					All Status
				</Button>
				<Button
					variant={activeFilter === true ? 'default' : 'outline'}
					size="sm"
					onclick={() => {
						activeFilter = true;
						applyFilters();
					}}
				>
					Active
				</Button>
				<Button
					variant={activeFilter === false ? 'default' : 'outline'}
					size="sm"
					onclick={() => {
						activeFilter = false;
						applyFilters();
					}}
				>
					Inactive
				</Button>
			</div>
		</CardContent>
	</Card>

	<TransactionList
		{transactions}
		{isLoading}
		on:edit={handleEditTransaction}
		on:delete={handleDeleteTransaction}
	/>
</div>

<!-- Create Income Dialog -->
<Dialog.Root bind:open={showCreateForm}>
	<Dialog.Content class="sm:max-w-[520px]">
		<Dialog.Header>
			<Dialog.Title>Add Income</Dialog.Title>
			<Dialog.Description>Create a new income transaction.</Dialog.Description>
		</Dialog.Header>
		<div class="mt-2">
			<TransactionForm
				type="income"
				{categories}
				isLoading={isFormLoading}
				on:submit={handleCreateTransaction}
				on:cancel={handleFormCancel}
			/>
		</div>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit Income Dialog -->
<Dialog.Root bind:open={showEditForm}>
	<Dialog.Content class="sm:max-w-[520px]">
		<Dialog.Header>
			<Dialog.Title>Edit Income</Dialog.Title>
			<Dialog.Description>Update the income transaction.</Dialog.Description>
		</Dialog.Header>
		<div class="mt-2">
			<TransactionForm
				type="income"
				transaction={editingTransaction}
				{categories}
				isLoading={isFormLoading}
				on:submit={handleUpdateTransaction}
				on:cancel={handleFormCancel}
			/>
		</div>
	</Dialog.Content>
</Dialog.Root>
