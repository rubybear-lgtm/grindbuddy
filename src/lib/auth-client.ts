import { browser } from '$app/environment';
import { createAuthClient as createNeonAuthClient, type VanillaBetterAuthClient } from '@neondatabase/auth';

// Use our API proxy route instead of direct Neon Auth URL
// This avoids CORS issues and allows us to handle cookies properly
const getApiAuthUrl = () => {
	if (!browser) return '';
	return `${window.location.origin}/api/auth`;
};

// Only create the client in the browser to avoid SSR issues
let authClient: VanillaBetterAuthClient | null = null;

export function getAuthClient(): VanillaBetterAuthClient {
	if (!browser) {
		throw new Error('Auth client can only be used in the browser');
	}
	if (!authClient) {
		const apiAuthUrl = getApiAuthUrl();
		if (!apiAuthUrl) {
			throw new Error('Cannot determine API auth URL');
		}
		authClient = createNeonAuthClient(apiAuthUrl);
	}
	return authClient;
}

// Convenience exports for auth operations
export const signIn = (...args: any[]) => {
	return (getAuthClient() as any).signIn(...args);
};

export const signUp = (...args: any[]) => {
	return (getAuthClient() as any).signUp(...args);
};

export const signOut = (...args: any[]) => {
	return (getAuthClient() as any).signOut(...args);
};

// Get session synchronously (for compatibility)
export const getSession = () => {
	if (!browser) return null;
	try {
		return (getAuthClient() as any).getSession?.() || null;
	} catch {
		return null;
	}
};

// Reset the cached client (for testing only)
export function resetAuthClient() {
	authClient = null;
}

// Legacy export for compatibility
export { getAuthClient as authClient };
