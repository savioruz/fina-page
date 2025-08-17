import { authStore } from '$lib/stores/auth';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';

/**
 * Auth guard utility to protect routes that require authentication
 * Call this in your page's load function to ensure user is authenticated
 */
export function requireAuth() {
	const auth = get(authStore);

	if (!auth.isAuthenticated || !authStore.checkAuth()) {
		throw redirect(302, '/login');
	}

	return auth;
}

/**
 * Redirect authenticated users away from auth pages (login, register)
 * Call this in auth pages to redirect already authenticated users
 */
export function redirectIfAuthenticated(redirectTo: string = '/dashboard') {
	const auth = get(authStore);

	if (auth.isAuthenticated && authStore.checkAuth()) {
		throw redirect(302, redirectTo);
	}
}
