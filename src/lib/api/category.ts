import { apiClient } from './client';
import { authStore } from '$lib/stores/auth';
import { get } from 'svelte/store';
import type {
	Category,
	CreateCategoryRequest,
	UpdateCategoryRequest,
	GetCategoriesResponse,
	CategoryFilters
} from '$lib/types/category';

export class CategoryService {
	private getAuthHeaders(): Record<string, string> {
		const auth = get(authStore);

		if (!authStore.checkAuth()) {
			throw new Error('Authentication required');
		}

		return auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {};
	}

	private buildQueryParams(filters: CategoryFilters): string {
		const params = new URLSearchParams();

		Object.entries(filters).forEach(([key, value]) => {
			if (value !== undefined && value !== null && value !== '') {
				params.append(key, value.toString());
			}
		});

		return params.toString() ? `?${params.toString()}` : '';
	}

	async getCategories(filters: CategoryFilters = {}): Promise<GetCategoriesResponse> {
		// Handle API envelope { data: { categories, total_data, total_page }, message }
		const queryParams = this.buildQueryParams(filters);
		const raw = await apiClient.get<{ data: GetCategoriesResponse } | GetCategoriesResponse>(
			`/v1/categories${queryParams}`,
			this.getAuthHeaders()
		);
		if (raw && 'data' in raw && Array.isArray(raw.data.categories)) {
			return raw.data;
		}
		return raw as GetCategoriesResponse;
	}

	async getCategory(id: string): Promise<Category> {
		return apiClient.get<Category>(`/v1/categories/${id}`, this.getAuthHeaders());
	}

	async createCategory(category: CreateCategoryRequest): Promise<{ message: string }> {
		return apiClient.post<{ message: string }>('/v1/categories', category, this.getAuthHeaders());
	}

	async updateCategory(id: string, category: UpdateCategoryRequest): Promise<{ message: string }> {
		return apiClient.patch<{ message: string }>(
			`/v1/categories/${id}`,
			category,
			this.getAuthHeaders()
		);
	}

	async deleteCategory(id: string): Promise<{ message: string }> {
		return apiClient.delete<{ message: string }>(`/v1/categories/${id}`, this.getAuthHeaders());
	}
}

export const categoryService = new CategoryService();
