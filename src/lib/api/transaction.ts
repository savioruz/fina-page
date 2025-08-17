import { apiClient } from './client';
import { authStore } from '$lib/stores/auth';
import { get } from 'svelte/store';
import type {
	Transaction,
	CreateTransactionRequest,
	UpdateTransactionRequest,
	GetTransactionsResponse,
	TransactionFilters
} from '$lib/types/transaction';

export class TransactionService {
	private getAuthHeaders(): Record<string, string> {
		const auth = get(authStore);

		// Check if user is authenticated and token is valid
		if (!authStore.checkAuth()) {
			throw new Error('Authentication required');
		}

		return auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {};
	}

	private buildQueryParams(filters: TransactionFilters): string {
		const params = new URLSearchParams();

		Object.entries(filters).forEach(([key, value]) => {
			if (value !== undefined && value !== null && value !== '') {
				params.append(key, value.toString());
			}
		});

		return params.toString() ? `?${params.toString()}` : '';
	}

	async getTransactions(filters: TransactionFilters = {}): Promise<GetTransactionsResponse> {
		const queryParams = this.buildQueryParams(filters);
		const raw = await apiClient.get<{ data: GetTransactionsResponse } | GetTransactionsResponse>(
			`/v1/transactions${queryParams}`,
			this.getAuthHeaders()
		);
		if (raw && 'data' in raw && Array.isArray(raw.data.transactions)) {
			return raw.data;
		}
		return raw as GetTransactionsResponse;
	}

	async getTransaction(id: string): Promise<Transaction> {
		return apiClient.get<Transaction>(`/v1/transactions/${id}`, this.getAuthHeaders());
	}

	async createTransaction(transaction: CreateTransactionRequest): Promise<Transaction> {
		return apiClient.post<Transaction>(`/v1/transactions`, transaction, this.getAuthHeaders());
	}

	async createTransactionWithFile(
		transaction: CreateTransactionRequest,
		file: File
	): Promise<Transaction> {
		const formData = new FormData();
		formData.append('amount', transaction.amount.toString());
		formData.append('date', transaction.date);
		formData.append('type', transaction.type);
		formData.append('category', transaction.category);
		formData.append('active', transaction.active.toString());
		if (transaction.description) {
			formData.append('description', transaction.description);
		}
		formData.append('file', file);

		return apiClient.upload<Transaction>(`/v1/transactions`, formData, this.getAuthHeaders());
	}

	async updateTransaction(
		id: string,
		transaction: UpdateTransactionRequest
	): Promise<{ message: string }> {
		return apiClient.patch<{ message: string }>(
			`/v1/transactions/${id}`,
			transaction,
			this.getAuthHeaders()
		);
	}

	async deleteTransaction(id: string): Promise<{ message: string }> {
		return apiClient.delete<{ message: string }>(`/v1/transactions/${id}`, this.getAuthHeaders());
	}

	async uploadProof(id: string, file: File): Promise<{ data: string }> {
		const form = new FormData();
		form.append('file', file);
		return apiClient.upload<{ data: string }>(
			`/v1/transactions/${id}/proof`,
			form,
			this.getAuthHeaders()
		);
	}

	async deleteProof(id: string, imageUrl: string): Promise<{ message: string }> {
		return apiClient.delete<{ message: string }>(
			`/v1/transactions/${id}/proof?image_url=${encodeURIComponent(imageUrl)}`,
			this.getAuthHeaders()
		);
	}
}

export const transactionService = new TransactionService();
