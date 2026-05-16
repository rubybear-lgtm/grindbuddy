import type { MatchResponse, PageContext, ProblemSource, ToastSize } from './lib/types';

let lastContextKey = '';
let activeContextKey = '';
let lastToastKey = '';
let toastRoot: HTMLDivElement | null = null;
let toastTimer: number | null = null;

type ToastState =
    | { kind: 'match'; context: PageContext; match: MatchResponse['match'] }
    | { kind: 'unauthenticated'; context: PageContext };

const TOAST_SIZE_KEY = 'toast-size';

function parsePageContext(urlString: string, title: string, canonicalHref: string | null): PageContext | null {
    let url: URL;

    try {
        url = new URL(urlString);
    } catch {
        return null;
    }

    const source = resolveSource(url.hostname);

    if (!source) {
        return null;
    }

    const slug = extractSlug(url.pathname);

    if (!slug) {
        return null;
    }

    const normalizedTitle = normalizeTitle(title);

    return {
        source,
        url: resolveCanonicalUrl(url, canonicalHref),
        title: normalizedTitle,
        number: extractLeadingNumber(normalizedTitle),
        slug,
    };
}

function resolveSource(hostname: string): ProblemSource | null {
    if (hostname === 'leetcode.com' || hostname === 'www.leetcode.com') {
        return 'leetcode';
    }

    if (hostname === 'neetcode.io') {
        return 'neetcode';
    }

    return null;
}

function normalizeTitle(value: string): string {
    return value
        .replace(/\s*[-|]\s*(LeetCode|NeetCode).*$/i, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractSlug(pathname: string): string | null {
    const segments = pathname
        .split('/')
        .map((segment) => segment.trim())
        .filter(Boolean);
    const index = segments.indexOf('problems');

    if (index === -1) {
        return null;
    }

    return segments[index + 1] ?? null;
}

function extractLeadingNumber(title: string): number | null {
    const match = title.match(/^\s*#?(\d+)[\s.\-:]+(.+)$/);

    if (!match) {
        return null;
    }

    const number = Number.parseInt(match[1] ?? '', 10);

    return Number.isFinite(number) ? number : null;
}

function resolveCanonicalUrl(url: URL, canonicalHref: string | null): string {
    if (canonicalHref) {
        try {
            return new URL(canonicalHref, url).toString().replace(/\/$/, '');
        } catch {
            // fall through to the current page URL
        }
    }

    return url.toString().replace(/\/$/, '');
}

function buildContextKey(context: PageContext): string {
    return `${context.source}|${context.url}|${context.slug}`;
}

function sendMessage<T>(message: Record<string, unknown>): Promise<T> {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response: T) => {
            const error = chrome.runtime.lastError;

            if (error) {
                reject(new Error(error.message));

                return;
            }

            resolve(response);
        });
    });
}

function storageGetLocal<T>(keys: string | string[]): Promise<T> {
    return new Promise((resolve) => {
        chrome.storage.local.get(keys, (items: T) => resolve(items));
    });
}

async function getToastSize(): Promise<ToastSize> {
    const items = await storageGetLocal<{ [TOAST_SIZE_KEY]?: ToastSize }>(TOAST_SIZE_KEY);

    return items[TOAST_SIZE_KEY] ?? 'small';
}

function clearToast(): void {
    if (toastTimer !== null) {
        window.clearTimeout(toastTimer);
        toastTimer = null;
    }

    toastRoot?.remove();
    toastRoot = null;
}

function isDarkTheme(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function showToast(state: ToastState, toastSize: ToastSize): void {
    const fingerprint = `${state.context.url}|${toastSize}|${state.kind === 'match' && state.match ? state.match.id : 'unauthenticated'}`;

    if (fingerprint === lastToastKey) {
        return;
    }

    lastToastKey = fingerprint;
    clearToast();

    const host = document.createElement('div');
    host.setAttribute('aria-live', 'polite');
    host.setAttribute('aria-atomic', 'true');
    const width = toastSize === 'large' ? '360px' : toastSize === 'medium' ? '300px' : '240px';
    const padding = toastSize === 'large' ? '14px' : toastSize === 'medium' ? '12px' : '10px';
    const top = toastSize === 'large' ? '84px' : '88px';

    host.style.cssText = [
        'position:fixed',
        `top:${top}`,
        'right:18px',
        'z-index:2147483647',
        'pointer-events:none',
        `width:min(${width}, calc(100vw - 36px))`,
    ].join(';');

    const root = document.createElement('div');
    const dark = isDarkTheme();
    root.style.cssText = [
        'pointer-events:auto',
        `border-radius:${toastSize === 'large' ? '18px' : '16px'}`,
        'border:1px solid ' + (dark ? 'rgba(148,163,184,0.22)' : 'rgba(15,23,42,0.10)'),
        'background:' + (dark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.96)'),
        'box-shadow:0 24px 60px ' + (dark ? 'rgba(2,6,23,0.40)' : 'rgba(15,23,42,0.16)'),
        'backdrop-filter:blur(16px)',
        `padding:${padding}`,
        'color:' + (dark ? '#e5e7eb' : '#0f172a'),
        'animation:gb-toast-in 180ms ease-out',
        'font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
    ].join(';');

    const heading = document.createElement('p');
    heading.style.cssText = [
        `margin:0 0 ${toastSize === 'small' ? '4px' : '6px'}`,
        'color:' + (dark ? '#4ade80' : '#14b8a6'),
        `font-size:${toastSize === 'small' ? '9px' : '10px'}`,
        'font-weight:800',
        `letter-spacing:${toastSize === 'small' ? '0.18em' : '0.22em'}`,
        'text-transform:uppercase',
    ].join(';');
    heading.textContent = 'Grind Buddy';
    root.append(heading);

    const title = document.createElement('h2');
    title.style.cssText = [
        'margin:0',
        `font-size:${toastSize === 'large' ? '15px' : '14px'}`,
        'font-weight:800',
        'line-height:1.2',
        'color:inherit',
    ].join(';');

    const summary = document.createElement('p');
    summary.style.cssText = [
        `margin:${toastSize === 'small' ? '6px' : '8px'} 0 0`,
        'color:' + (dark ? '#94a3b8' : '#475569'),
        `font-size:${toastSize === 'small' ? '11px' : '12px'}`,
        'line-height:1.4',
    ].join(';');

    const actions = document.createElement('div');
    actions.style.cssText = `display:flex; gap:${toastSize === 'small' ? '6px' : '8px'}; margin-top:${toastSize === 'small' ? '10px' : '12px'};`;

    const primary = document.createElement('button');
    primary.style.cssText = [
        'flex:1',
        'border:0',
        `border-radius:${toastSize === 'small' ? '10px' : '12px'}`,
        `padding:${toastSize === 'small' ? '7px 9px' : '8px 10px'}`,
        'background:' + (dark ? '#4ade80' : '#14b8a6'),
        'color:' + (dark ? '#052e16' : '#ecfeff'),
        `font-size:${toastSize === 'small' ? '11px' : '12px'}`,
        'font-weight:700',
        'cursor:pointer',
    ].join(';');

    const secondary = document.createElement('button');
    secondary.style.cssText = [
        'flex:1',
        'border:1px solid ' + (dark ? 'rgba(148,163,184,0.22)' : 'rgba(15,23,42,0.10)'),
        `border-radius:${toastSize === 'small' ? '10px' : '12px'}`,
        `padding:${toastSize === 'small' ? '7px 9px' : '8px 10px'}`,
        'background:' + (dark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.04)'),
        'color:inherit',
        `font-size:${toastSize === 'small' ? '11px' : '12px'}`,
        'font-weight:700',
        'cursor:pointer',
    ].join(';');
    secondary.textContent = 'Dismiss';

    primary.addEventListener('click', () => {
        void chrome.runtime.sendMessage({
            type: 'OPEN_POPUP',
        });
        clearToast();
    });

    secondary.addEventListener('click', clearToast);

    if (state.kind === 'match' && state.match) {
        title.textContent = `#${state.match.number} ${state.match.title}`;
        summary.textContent = `${state.context.source === 'leetcode' ? 'LeetCode' : 'NeetCode'} · ${state.match.difficulty} · ${state.match.patterns[0] ?? 'catalog match'}`;
        primary.textContent = toastSize === 'small' ? 'Log' : 'Log problem';
    } else {
        title.textContent = state.context.title;
        summary.textContent = 'Sign in from the extension to log this problem.';
        primary.textContent = 'Sign in';
    }

    actions.append(primary, secondary);
    root.append(title, summary, actions);

    const style = document.createElement('style');
    style.textContent = `
        @keyframes gb-toast-in {
            from {
                opacity: 0;
                transform: translateY(-8px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;

    root.prepend(style);
    host.append(root);
    (document.body ?? document.documentElement).append(host);
    toastRoot = host;

    toastTimer = window.setTimeout(() => {
        clearToast();
    }, 7000);
}

async function resolveAndToast(context: PageContext, contextKey: string): Promise<void> {
    try {
        const toastSize = await getToastSize();
        const result = await sendMessage<{ ok: true; data: MatchResponse } | { ok: false; status: number; message: string }>({
            type: 'RESOLVE_CONTEXT',
            context,
        });

        if (contextKey !== activeContextKey) {
            return;
        }

        if (!result.ok) {
            if (result.status === 401) {
                showToast({ kind: 'unauthenticated', context }, toastSize);
            } else {
                clearToast();
            }

            return;
        }

        if (!result.data.match) {
            clearToast();

            return;
        }

        showToast({ kind: 'match', context, match: result.data.match }, toastSize);
    } catch {
        // Ignore background resolution failures; the popup still works.
    }
}

function publishContext(): void {
    const canonicalHref = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? null;
    const context = parsePageContext(window.location.href, document.title, canonicalHref);

    if (!context) {
        return;
    }

    const contextKey = buildContextKey(context);

    if (contextKey === lastContextKey) {
        return;
    }

    lastContextKey = contextKey;
    activeContextKey = contextKey;

    chrome.runtime.sendMessage({
        type: 'PAGE_CONTEXT_UPDATED',
        context,
    });

    void resolveAndToast(context, activeContextKey);
}

publishContext();
setInterval(publishContext, 1000);
