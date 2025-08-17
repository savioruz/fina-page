export interface Transaction {
	id: string;
	amount: number;
	date: string;
	type: 'income' | 'expense';
	description: string;
	category: string;
	category_name: string;
	proof?: string;
	active: boolean;
	created_at: string;
	modified_at: string;
	created_by: string;
	modified_by: string;
}

export interface CreateTransactionRequest {
	amount: number;
	date: string;
	type: 'income' | 'expense';
	description?: string;
	category: string;
	proof: string;
	active: boolean;
}

export interface UpdateTransactionRequest {
	amount?: number;
	date?: string;
	type?: 'income' | 'expense';
	description?: string;
	category?: string;
	proof?: string;
	active?: boolean;
}

export interface GetTransactionsResponse {
	transactions: Transaction[];
	total_data: number;
	total_page: number;
}

export interface TransactionFilters {
	amount?: string;
	date?: string;
	type?: 'income' | 'expense';
	description?: string;
	active?: boolean;
	created_at?: string;
	category?: string;
	page?: number;
	limit?: number;
}
