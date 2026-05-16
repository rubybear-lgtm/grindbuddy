import type { PageContext, ToastSize } from './types';

const CONTEXT_KEY_PREFIX = 'page-context:';
const TOAST_SIZE_KEY = 'toast-size';

function storageGet<T>(keys: string | string[]): Promise<T> {
    return new Promise((resolve) => {
        chrome.storage.session.get(keys, (items: T) => resolve(items));
    });
}

function storageSet(items: Record<string, unknown>): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.session.set(items, () => resolve());
    });
}

function storageGetLocal<T>(keys: string | string[]): Promise<T> {
    return new Promise((resolve) => {
        chrome.storage.local.get(keys, (items: T) => resolve(items));
    });
}

function storageSetLocal(items: Record<string, unknown>): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.local.set(items, () => resolve());
    });
}

export async function setPageContext(tabId: number, context: PageContext): Promise<void> {
    await storageSet({ [CONTEXT_KEY_PREFIX + tabId]: context });
}

export async function getPageContext(tabId: number): Promise<PageContext | null> {
    const items = await storageGet<Record<string, PageContext>>(
        CONTEXT_KEY_PREFIX + tabId,
    );

    return items[CONTEXT_KEY_PREFIX + tabId] ?? null;
}

export async function getToastSize(): Promise<ToastSize> {
    const items = await storageGetLocal<{ [TOAST_SIZE_KEY]?: ToastSize }>(TOAST_SIZE_KEY);

    return items[TOAST_SIZE_KEY] ?? 'small';
}

export async function setToastSize(size: ToastSize): Promise<void> {
    await storageSetLocal({ [TOAST_SIZE_KEY]: size });
}
