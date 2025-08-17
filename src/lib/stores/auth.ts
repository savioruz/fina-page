import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';

interface User {
	id: string;
	email: string;
	name: string;
	role?: string;
}

interface AuthState {
	isAuthenticated: boolean;
	accessToken: string | null;
	refreshToken: string | null;
	user: User | null;
	tokenExpiry: number | null;
}

const initialState: AuthState = {
	isAuthenticated: false,
	accessToken: null,
	refreshToken: null,
	user: null,
	tokenExpiry: null
};

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>(initialState);

	let currentStore: AuthState = initialState;
	subscribe((state) => {
		currentStore = state;
	});

	function getTokenExpiry(token: string): number | null {
		try {
			const payload = JSON.parse(atob(token.split('.')[1]));
			return payload.exp * 1000;
		} catch {
			return null;
		}
	}

	function isTokenExpired(tokenExpiry: number | null): boolean {
		if (!tokenExpiry) return true;
		return Date.now() >= tokenExpiry - 60000;
	}

	let refreshTimer: number | null = null;

	function scheduleTokenRefresh(expiry: number) {
		if (refreshTimer) {
			clearTimeout(refreshTimer);
		}

		const refreshTime = expiry - Date.now() - 5 * 60 * 1000;

		if (refreshTime > 0) {
			refreshTimer = window.setTimeout(async () => {
				await tryRefreshToken();
			}, refreshTime);
		}
	}

	async function tryRefreshToken(): Promise<boolean> {
		try {
			const { authService } = await import('$lib/api/auth');

			if (!currentStore.refreshToken) {
				await logout();
				return false;
			}

			const response = await authService.refreshToken(currentStore.refreshToken);

			if (response.data?.access_token && response.data?.refresh_token) {
				const expiry = getTokenExpiry(response.data.access_token);
				update((state) => ({
					...state,
					accessToken: response.data!.access_token,
					refreshToken: response.data!.refresh_token,
					tokenExpiry: expiry
				}));

				if (browser) {
					localStorage.setItem('access_token', response.data.access_token);
					localStorage.setItem('refresh_token', response.data.refresh_token);
					if (expiry) {
						localStorage.setItem('token_expiry', expiry.toString());
					}
				}

				if (expiry) {
					scheduleTokenRefresh(expiry);
				}

				return true;
			} else {
				await logout();
				return false;
			}
		} catch (error) {
			console.error('Token refresh failed:', error);
			await logout();
			return false;
		}
	}

	async function logout() {
		if (refreshTimer) {
			clearTimeout(refreshTimer);
		}

		set(initialState);

		if (browser) {
			localStorage.removeItem('access_token');
			localStorage.removeItem('refresh_token');
			localStorage.removeItem('token_expiry');

			goto('/login');
		}
	}

	return {
		subscribe,
		login: (accessToken: string, refreshToken: string) => {
			const expiry = getTokenExpiry(accessToken);

			update((state) => ({
				...state,
				isAuthenticated: true,
				accessToken,
				refreshToken,
				tokenExpiry: expiry
			}));

			if (browser) {
				localStorage.setItem('access_token', accessToken);
				localStorage.setItem('refresh_token', refreshToken);
				if (expiry) {
					localStorage.setItem('token_expiry', expiry.toString());
					scheduleTokenRefresh(expiry);
				}
			}
		},
		logout,
		updateTokens: (accessToken: string, refreshToken: string) => {
			const expiry = getTokenExpiry(accessToken);

			update((state) => ({
				...state,
				accessToken,
				refreshToken,
				tokenExpiry: expiry
			}));

			if (browser) {
				localStorage.setItem('access_token', accessToken);
				localStorage.setItem('refresh_token', refreshToken);
				if (expiry) {
					localStorage.setItem('token_expiry', expiry.toString());
					scheduleTokenRefresh(expiry);
				}
			}
		},
		init: () => {
			if (browser) {
				const accessToken = localStorage.getItem('access_token');
				const refreshToken = localStorage.getItem('refresh_token');
				const tokenExpiry = localStorage.getItem('token_expiry');

				if (accessToken && refreshToken) {
					const expiry = tokenExpiry ? parseInt(tokenExpiry) : getTokenExpiry(accessToken);

					if (isTokenExpired(expiry)) {
						tryRefreshToken();
					} else {
						update((state) => ({
							...state,
							isAuthenticated: true,
							accessToken,
							refreshToken,
							tokenExpiry: expiry
						}));

						if (expiry) {
							scheduleTokenRefresh(expiry);
						}
					}
				}
			}
		},
		checkAuth: () => {
			if (!currentStore.isAuthenticated || !currentStore.accessToken) {
				return false;
			}

			if (isTokenExpired(currentStore.tokenExpiry)) {
				tryRefreshToken();
				return false;
			}

			return true;
		},
		refreshToken: tryRefreshToken
	};
}

export const authStore = createAuthStore();
