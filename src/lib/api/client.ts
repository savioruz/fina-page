import { PUBLIC_API_BASE_URL } from '$env/static/public';
import type { ErrorResponse } from '$lib/types/api';
import { authStore } from '$lib/stores/auth';
import { get } from 'svelte/store';

export class ApiError extends Error {
	status: number;
	errors?: ErrorResponse['errors'];

	constructor(status: number, message: string, errors?: ErrorResponse['errors']) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.errors = errors;
	}
}

export class ApiClient {
	private baseUrl: string;
	private isRefreshing = false;
	private refreshPromise: Promise<boolean> | null = null;

	constructor(baseUrl: string = PUBLIC_API_BASE_URL) {
		this.baseUrl = baseUrl;
	}

	private async tryRefresh(): Promise<boolean> {
		if (this.isRefreshing && this.refreshPromise) return this.refreshPromise;
		this.isRefreshing = true;
		this.refreshPromise = authStore.refreshToken().finally(() => {
			this.isRefreshing = false;
			this.refreshPromise = null;
		});
		return this.refreshPromise;
	}

	private async request<T>(endpoint: string, options: RequestInit = {}, retry = false): Promise<T> {
		const url = `${this.baseUrl}${endpoint}`;
		const isFormData = options.body instanceof FormData;
		let response: Response;
		try {
			response = await fetch(url, {
				...options,
				headers: {
					Accept: 'application/json',
					...(isFormData ? {} : { 'Content-Type': 'application/json' }),
					...options.headers
				},
				mode: 'cors'
			});
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error';
			throw new ApiError(0, `Network/CORS error accessing ${endpoint}: ${errorMessage}`);
		}

		const responseText = await response.text();
		let data: unknown;
		try {
			data = responseText ? JSON.parse(responseText) : {};
		} catch {
			data = { message: responseText };
		}

		if (!response.ok) {
			// Attempt silent refresh on 401 (once)
			if (
				response.status === 401 &&
				!retry &&
				!endpoint.includes('/auth/login') &&
				!endpoint.includes('/auth/refresh-token')
			) {
				const refreshed = await this.tryRefresh();
				if (refreshed) {
					// retry with new token
					const auth = get(authStore);
					const retryHeaders: Record<string, string> = {
						...(options.headers as Record<string, string>)
					};
					if (auth.accessToken) retryHeaders.Authorization = `Bearer ${auth.accessToken}`;
					return this.request<T>(
						endpoint,
						{
							...options,
							headers: retryHeaders
						},
						true
					);
				}
			}

			if (response.status >= 400 && response.status < 500) {
				const errorData = data as Record<string, unknown>;
				throw new ApiError(
					response.status,
					(errorData.error as string) || (errorData.message as string) || 'Request failed',
					(data as ErrorResponse).errors
				);
			} else {
				const errorData = data as Record<string, unknown>;
				throw new ApiError(
					response.status,
					(errorData.message as string) || 'Server error occurred'
				);
			}
		}

		return data as T;
	}

	async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
		return this.request<T>(endpoint, { method: 'GET', headers });
	}
	async post<T>(endpoint: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'POST',
			body: body ? JSON.stringify(body) : undefined,
			headers
		});
	}
	async put<T>(endpoint: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'PUT',
			body: body ? JSON.stringify(body) : undefined,
			headers
		});
	}
	async patch<T>(endpoint: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'PATCH',
			body: body ? JSON.stringify(body) : undefined,
			headers
		});
	}
	async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
		return this.request<T>(endpoint, { method: 'DELETE', headers });
	}
	async upload<T>(
		endpoint: string,
		formData: FormData,
		headers?: Record<string, string>
	): Promise<T> {
		return this.request<T>(endpoint, { method: 'POST', body: formData, headers });
	}
}

export const apiClient = new ApiClient();
