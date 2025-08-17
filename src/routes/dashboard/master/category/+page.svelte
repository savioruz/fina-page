<script lang="ts">
	import { onMount } from 'svelte';
	import { categoryService } from '$lib/api/category';
	import type {
		Category,
		CreateCategoryRequest,
		UpdateCategoryRequest,
		CategoryFilters,
		GetCategoriesResponse
	} from '$lib/types/category';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog';

	let categories: Category[] = [];
	let loading = true;
	let error: string | null = null;

	let search = '';
	let activeFilter: boolean | undefined = undefined;
	let page = 1;
	let limit = 10;
	let totalPage = 1;
	let totalData = 0;

	let showAdd = false;
	let showEdit = false;
	let showDelete = false;
	let selected: Category | null = null;

	let addForm: { name: string; description: string; active: boolean } = {
		name: '',
		description: '',
		active: true
	};
	let editForm: { name: string; description: string; active: boolean } = {
		name: '',
		description: '',
		active: true
	};
	let addErrors = { name: '', description: '' };
	let editErrors = { name: '', description: '' };
	let submitting = false;

	onMount(loadCategories);

	async function loadCategories() {
		try {
			loading = true;
			error = null;
			const filters: CategoryFilters = { page, limit };
			if (search.trim()) filters.name = search.trim();
			if (activeFilter !== undefined) filters.active = activeFilter;
			const res: GetCategoriesResponse = await categoryService.getCategories(filters);
			console.debug('Raw categories payload', res);
			const list = res?.categories ?? [];
			categories = Array.isArray(list) ? list : [];
			totalPage = res?.total_page ?? 1;
			totalData = res?.total_data ?? categories.length;
		} catch (e: unknown) {
			const error = e instanceof Error ? e.message : 'Failed to load categories';
			console.error('Failed to load categories:', error);
		} finally {
			loading = false;
		}
	}

	function refreshFirstPage() {
		page = 1;
		loadCategories();
	}

	function openAdd() {
		addForm = { name: '', description: '', active: true };
		addErrors = { name: '', description: '' };
		showAdd = true;
	}
	function openEdit(cat: Category) {
		selected = cat;
		editForm = { name: cat.name, description: cat.description || '', active: cat.active };
		editErrors = { name: '', description: '' };
		showEdit = true;
	}
	function openDelete(cat: Category) {
		selected = cat;
		showDelete = true;
	}

	function validate(form: typeof addForm, errorsObj: typeof addErrors) {
		errorsObj.name = '';
		errorsObj.description = '';
		let ok = true;
		if (!form.name.trim()) {
			errorsObj.name = 'Category name is required';
			ok = false;
		} else if (form.name.length > 100) {
			errorsObj.name = 'Max 100 chars';
			ok = false;
		}
		if (form.description && form.description.length > 255) {
			errorsObj.description = 'Max 255 chars';
			ok = false;
		}
		return ok;
	}

	async function submitAdd() {
		if (!validate(addForm, addErrors)) return;
		try {
			submitting = true;
			const payload: CreateCategoryRequest = {
				name: addForm.name.trim(),
				description: addForm.description.trim() || undefined,
				active: addForm.active
			};
			await categoryService.createCategory(payload);
			showAdd = false;
			refreshFirstPage();
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Failed to create category';
		} finally {
			submitting = false;
		}
	}

	async function submitEdit() {
		if (!selected) return;
		if (!validate(editForm, editErrors)) return;
		try {
			submitting = true;
			const payload: UpdateCategoryRequest = {
				name: editForm.name.trim(),
				description: editForm.description.trim() || undefined,
				active: editForm.active
			};
			await categoryService.updateCategory(selected.id, payload);
			showEdit = false;
			loadCategories();
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Failed to update category';
		} finally {
			submitting = false;
		}
	}

	async function submitDelete() {
		if (!selected) return;
		try {
			submitting = true;
			await categoryService.deleteCategory(selected.id);
			showDelete = false;
			refreshFirstPage();
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Failed to delete category';
		} finally {
			submitting = false;
		}
	}

	function dateFmt(d: string) {
		return new Date(d).toLocaleDateString();
	}
</script>

<div class="flex flex-1 flex-col gap-4 p-4">
	<div class="space-y-6">
		<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
			<div>
				<h1 class="text-2xl font-bold">Categories</h1>
				<p class="text-sm text-muted-foreground">Manage transaction categories</p>
			</div>
			<Button onclick={openAdd}>Add Category</Button>
		</div>

		<Card>
			<CardContent class="space-y-4 pt-6">
				<div class="flex flex-col gap-4 md:flex-row">
					<div class="flex flex-1 gap-2">
						<Input
							placeholder="Search..."
							bind:value={search}
							onkeydown={(e) => e.key === 'Enter' && refreshFirstPage()}
						/>
						<Button onclick={refreshFirstPage}>Search</Button>
					</div>
					<div class="flex gap-2">
						<Button
							variant={activeFilter === undefined ? 'default' : 'outline'}
							size="sm"
							onclick={() => {
								activeFilter = undefined;
								refreshFirstPage();
							}}>All</Button
						>
						<Button
							variant={activeFilter === true ? 'default' : 'outline'}
							size="sm"
							onclick={() => {
								activeFilter = true;
								refreshFirstPage();
							}}>Active</Button
						>
						<Button
							variant={activeFilter === false ? 'default' : 'outline'}
							size="sm"
							onclick={() => {
								activeFilter = false;
								refreshFirstPage();
							}}>Inactive</Button
						>
					</div>
				</div>
				{#if error}
					<p class="text-sm text-red-600">{error}</p>
				{/if}
			</CardContent>
		</Card>

		{#if loading}
			<p class="text-sm text-muted-foreground">Loading...</p>
		{:else if categories.length === 0}
			<Card
				><CardContent class="p-6 text-center text-muted-foreground">No categories found</CardContent
				></Card
			>
		{:else}
			<!-- Datatable with pagination -->
			<div class="overflow-x-auto rounded-md border">
				<table class="w-full text-sm">
					<thead class="bg-muted/50">
						<tr class="text-left">
							<th class="p-3 font-medium">Name</th>
							<th class="p-3 font-medium">Description</th>
							<th class="p-3 font-medium">Status</th>
							<th class="p-3 font-medium">Created</th>
							<th class="p-3 font-medium">Updated</th>
							<th class="p-3 text-right font-medium">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each categories as c (c.id)}
							<tr class="border-t">
								<td class="p-3 font-medium">{c.name}</td>
								<td class="max-w-[260px] truncate p-3" title={c.description}>{c.description}</td>
								<td class="p-3">
									<span
										class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {c.active
											? 'bg-green-500/10 text-green-600'
											: 'bg-gray-500/10 text-gray-500'}">{c.active ? 'Active' : 'Inactive'}</span
									>
								</td>
								<td class="p-3 whitespace-nowrap">{dateFmt(c.created_at)}</td>
								<td class="p-3 whitespace-nowrap">{dateFmt(c.modified_at)}</td>
								<td class="space-x-1 p-3 text-right">
									<Button size="sm" variant="ghost" onclick={() => openEdit(c)}>Edit</Button>
									<Button
										size="sm"
										variant="ghost"
										class="text-red-600"
										onclick={() => openDelete(c)}>Del</Button
									>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div class="flex flex-col items-center justify-between gap-3 pt-3 text-sm sm:flex-row">
				<div class="text-muted-foreground">Page {page} of {totalPage} • {totalData} items</div>
				<div class="flex items-center gap-2">
					<Button
						size="sm"
						variant="outline"
						disabled={page === 1}
						onclick={() => {
							page = 1;
							loadCategories();
						}}>First</Button
					>
					<Button
						size="sm"
						variant="outline"
						disabled={page === 1}
						onclick={() => {
							page = Math.max(1, page - 1);
							loadCategories();
						}}>Prev</Button
					>
					<Button
						size="sm"
						variant="outline"
						disabled={page === totalPage}
						onclick={() => {
							page = Math.min(totalPage, page + 1);
							loadCategories();
						}}>Next</Button
					>
					<Button
						size="sm"
						variant="outline"
						disabled={page === totalPage}
						onclick={() => {
							page = totalPage;
							loadCategories();
						}}>Last</Button
					>
					<select
						class="h-8 rounded-md border bg-background px-2"
						bind:value={limit}
						on:change={() => {
							page = 1;
							loadCategories();
						}}
					>
						<option value={5}>5</option>
						<option value={10}>10</option>
						<option value={20}>20</option>
						<option value={50}>50</option>
					</select>
				</div>
			</div>
		{/if}
	</div>

	<!-- Add Dialog -->
	<Dialog.Root bind:open={showAdd}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Add Category</Dialog.Title>
				<Dialog.Description>Create a new category</Dialog.Description>
			</Dialog.Header>
			<form on:submit|preventDefault={submitAdd} class="space-y-4">
				<div class="space-y-2">
					<Label for="add-name">Name *</Label>
					<Input
						id="add-name"
						bind:value={addForm.name}
						class={addErrors.name && 'border-red-500'}
						required
					/>
					{#if addErrors.name}<p class="text-xs text-red-600">{addErrors.name}</p>{/if}
				</div>
				<div class="space-y-2">
					<Label for="add-desc">Description</Label>
					<Textarea
						id="add-desc"
						bind:value={addForm.description}
						class={addErrors.description && 'border-red-500'}
					/>
					{#if addErrors.description}<p class="text-xs text-red-600">
							{addErrors.description}
						</p>{/if}
				</div>
				<div class="flex items-center gap-2">
					<input id="add-active" type="checkbox" bind:checked={addForm.active} class="h-4 w-4" />
					<Label for="add-active">Active</Label>
				</div>
				<Dialog.Footer>
					<Button type="button" variant="outline" onclick={() => (showAdd = false)}>Cancel</Button>
					<Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Create'}</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>

	<!-- Edit Dialog -->
	<Dialog.Root bind:open={showEdit}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Edit Category</Dialog.Title>
				<Dialog.Description>{selected ? selected.name : ''}</Dialog.Description>
			</Dialog.Header>
			<form on:submit|preventDefault={submitEdit} class="space-y-4">
				<div class="space-y-2">
					<Label for="edit-name">Name *</Label>
					<Input
						id="edit-name"
						bind:value={editForm.name}
						class={editErrors.name && 'border-red-500'}
						required
					/>
					{#if editErrors.name}<p class="text-xs text-red-600">{editErrors.name}</p>{/if}
				</div>
				<div class="space-y-2">
					<Label for="edit-desc">Description</Label>
					<Textarea
						id="edit-desc"
						bind:value={editForm.description}
						class={editErrors.description && 'border-red-500'}
					/>
					{#if editErrors.description}<p class="text-xs text-red-600">
							{editErrors.description}
						</p>{/if}
				</div>
				<div class="flex items-center gap-2">
					<input id="edit-active" type="checkbox" bind:checked={editForm.active} class="h-4 w-4" />
					<Label for="edit-active">Active</Label>
				</div>
				<Dialog.Footer>
					<Button type="button" variant="outline" onclick={() => (showEdit = false)}>Cancel</Button>
					<Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Update'}</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>

	<!-- Delete Dialog -->
	<Dialog.Root bind:open={showDelete}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Delete Category</Dialog.Title>
				<Dialog.Description>{selected ? `Delete ${selected.name}?` : ''}</Dialog.Description>
			</Dialog.Header>
			<div class="space-y-4">
				<p class="text-sm">This action cannot be undone.</p>
				<Dialog.Footer>
					<Button variant="outline" onclick={() => (showDelete = false)}>Cancel</Button>
					<Button variant="destructive" disabled={submitting} onclick={submitDelete}
						>{submitting ? 'Deleting...' : 'Delete'}</Button
					>
				</Dialog.Footer>
			</div>
		</Dialog.Content>
	</Dialog.Root>
</div>
