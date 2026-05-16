import { createAuthClient } from '@neondatabase/auth';
import type { AuthClient } from '@neondatabase/auth';
import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// Create auth client factory function for SvelteKit
// Passes cookies from SvelteKit's event.cookies to the auth client
export function getAuthClient(neonAuthUrl: string, cookies?: Cookies): AuthClient {
	if (!neonAuthUrl) {
		throw new Error('NEON_AUTH_BASE_URL is not set');
	}

	// If cookies are provided, configure the auth client with cookie handling
	if (cookies) {
		return createAuthClient(neonAuthUrl, {
			cookies: {
				getAll() {
					return cookies.getAll().map(cookie => ({
						name: cookie.name,
						value: cookie.value
					}));
				},
				setAll(cookiesToSet: any[]) {
					cookiesToSet.forEach(({ name, value, options }) => {
						cookies.set(name, value, { path: '/', ...options });
					});
				}
			}
		} as any);
	}

	// Fallback: create client without cookie handling (for cases where cookies aren't available)
	return createAuthClient(neonAuthUrl) as any;
}

// Helper function that creates an auth client using the env var directly
// Use this when you have access to event.cookies (form actions, hooks, etc.)
export function createAuth(cookies: Cookies): any {
	const neonAuthUrl = env.NEON_AUTH_BASE_URL;
	if (!neonAuthUrl) {
		throw new Error('NEON_AUTH_BASE_URL environment variable is not set');
	}
	return getAuthClient(neonAuthUrl, cookies);
}
