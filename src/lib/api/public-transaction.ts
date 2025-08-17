import { apiClient } from './client';
import type {
	Transaction,
	GetTransactionsResponse,
	TransactionFilters
} from '$lib/types/transaction';

interface ApiResponse<T> {
	data: T;
	message?: string;
}

interface SummaryData {
	total_income: number;
	total_expense: number;
}

export class PublicTransactionService {
	private buildQueryParams(filters: TransactionFilters): string {
		const params = new URLSearchParams();

		Object.entries(filters).forEach(([key, value]) => {
			if (value !== undefined && value !== null && value !== '') {
				params.append(key, value.toString());
			}
		});

		return params.toString() ? `?${params.toString()}` : '';
	}

	async getPublicTransactions(filters: TransactionFilters = {}): Promise<GetTransactionsResponse> {
		const queryParams = this.buildQueryParams(filters);
		const raw = await apiClient.get<ApiResponse<GetTransactionsResponse> | GetTransactionsResponse>(
			`/v1/transactions${queryParams}`
		);
		if (raw && 'data' in raw && Array.isArray(raw.data.transactions)) {
			return raw.data;
		}
		return raw as GetTransactionsResponse;
	}

	async getPublicTransaction(id: string): Promise<Transaction> {
		return apiClient.get<Transaction>(`/v1/transactions/${id}`);
	}

	async getPublicTransactionSummary(): Promise<SummaryData> {
		const raw = await apiClient.get<ApiResponse<SummaryData>>(`/v1/transactions/summary`);
		return raw.data;
	}
}

export const publicTransactionService = new PublicTransactionService();
