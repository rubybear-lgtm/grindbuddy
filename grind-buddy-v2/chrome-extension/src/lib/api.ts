import type { MatchResponse, PageContext, SubmitLogPayload } from './types';

type ApiResult<T> =
    | { ok: true; data: T }
    | { ok: false; status: number; message: string };

function appUrl(path: string): string {
    return new URL(path, __GRIND_BUDDY_ORIGIN__).toString();
}

async function readErrorMessage(response: Response): Promise<string> {
    try {
        const data = await response.json();

        return typeof data?.message === 'string' ? data.message : 'Request failed.';
    } catch {
        return 'Request failed.';
    }
}

async function postJson<T>(path: string, body: unknown): Promise<ApiResult<T>> {
    try {
        const response = await fetch(appUrl(path), {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            return {
                ok: false,
                status: response.status,
                message: await readErrorMessage(response),
            };
        }

        return {
            ok: true,
            data: (await response.json()) as T,
        };
    } catch {
        return {
            ok: false,
            status: 0,
            message: 'Network error. Try again.',
        };
    }
}

export async function resolveProblemMatch(context: PageContext): Promise<ApiResult<MatchResponse>> {
    return postJson<MatchResponse>('/api/problem-match', context);
}

export async function submitProblemLog(payload: SubmitLogPayload): Promise<ApiResult<{ success: boolean }>> {
    return postJson<{ success: boolean }>('/api/logs', payload);
}

export function appProblemUrl(problemId: string): string {
    return new URL(`/logbook?problemId=${encodeURIComponent(problemId)}`, __GRIND_BUDDY_ORIGIN__).toString();
}

export function appLoginUrl(): string {
    return new URL('/login', __GRIND_BUDDY_ORIGIN__).toString();
}
