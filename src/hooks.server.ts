import { getSession } from "$lib/server/auth-api";
import { dev } from "$app/environment";
import type { Handle } from "@sveltejs/kit";

const DEV_USER = {
	id: "00000000-0000-0000-0000-000000000001",
	name: "Dev User",
	email: "dev@localhost",
	image: null,
	emailVerified: true,
	createdAt: new Date(),
	updatedAt: new Date(),
};

export const handle: Handle = async ({ event, resolve }) => {
	if (dev) {
		event.locals.user = DEV_USER;
		return resolve(event);
	}

	// Skip session fetch for auth API requests to prevent infinite recursion
	if (!event.url.pathname.startsWith("/api/auth")) {
		const session = await getSession(event.request.headers, event.fetch);

		if (session) {
			event.locals.session = session.session;
			event.locals.user = session.user;
		}
	}

	return resolve(event);
};
