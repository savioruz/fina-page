import type { Response } from './api';

export interface LoginRequest {
	email: string;
	password: string;
}

export type LoginResponse = Response<{
	access_token: string;
	refresh_token: string;
}>;
