export interface Category {
	id: string;
	name: string;
	description: string;
	active: boolean;
	created_at: string;
	modified_at: string;
	created_by: string;
	modified_by: string;
}

export interface CreateCategoryRequest {
	name: string;
	description?: string;
	active: boolean;
}

export interface UpdateCategoryRequest {
	name?: string;
	description?: string;
	active?: boolean;
}

export interface GetCategoriesResponse {
	categories: Category[];
	total_data: number;
	total_page: number;
}

export interface CategoryFilters {
	name?: string;
	description?: string;
	active?: boolean;
	page?: number; // added for pagination
	limit?: number; // page size
}
