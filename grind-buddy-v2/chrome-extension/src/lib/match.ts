import type { PageContext, ProblemSource } from './types';

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

function resolveSource(hostname: string): ProblemSource | null {
    if (hostname === 'leetcode.com' || hostname === 'www.leetcode.com') {
        return 'leetcode';
    }

    if (hostname === 'neetcode.io') {
        return 'neetcode';
    }

    return null;
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

export function parsePageContext(urlString: string, title: string, canonicalHref: string | null): PageContext | null {
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

