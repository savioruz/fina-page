import { apiClient } from './client';
import type { LoginRequest, LoginResponse } from '$lib/types/auth';

export class AuthService {
	async login(credentials: LoginRequest): Promise<LoginResponse> {
		return apiClient.post<LoginResponse>('/v1/auth/login', credentials);
	}

	async refreshToken(refreshToken: string): Promise<LoginResponse> {
		return apiClient.post<LoginResponse>('/v1/auth/refresh-token', {
			refresh_token: refreshToken
		});
	}
}

export const authService = new AuthService();
