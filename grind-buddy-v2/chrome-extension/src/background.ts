import { resolveProblemMatch, submitProblemLog } from './lib/api';
import { parsePageContext } from './lib/match';
import { getPageContext, setPageContext } from './lib/storage';
import type { PageContext, SubmitLogPayload } from './lib/types';

type RuntimeMessage =
    | { type: 'PAGE_CONTEXT_UPDATED'; context: PageContext }
    | { type: 'GET_CONTEXT' }
    | { type: 'RESOLVE_CONTEXT'; context: PageContext }
    | { type: 'SUBMIT_LOG'; payload: SubmitLogPayload }
    | { type: 'OPEN_POPUP' }
    | { type: 'OPEN_APP'; url: string };

async function readActiveTabContext(): Promise<PageContext | null> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];

    if (!tab?.id || !tab.url) {
        return null;
    }

    const storedContext = await getPageContext(tab.id);

    if (storedContext) {
        return storedContext;
    }

    const title = typeof tab.title === 'string' ? tab.title : '';
    const canonicalHref = tab.pendingUrl ?? null;

    return parsePageContext(tab.url, title, canonicalHref);
}

chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender: { tab?: { id?: number } }, sendResponse: (response: unknown) => void) => {
    void (async () => {
        if (message.type === 'PAGE_CONTEXT_UPDATED') {
            if (sender.tab?.id !== undefined) {
                await setPageContext(sender.tab.id, message.context);
            }

            sendResponse({ ok: true });

            return;
        }

        if (message.type === 'GET_CONTEXT') {
            sendResponse(await readActiveTabContext());

            return;
        }

        if (message.type === 'RESOLVE_CONTEXT') {
            sendResponse(await resolveProblemMatch(message.context));

            return;
        }

        if (message.type === 'SUBMIT_LOG') {
            sendResponse(await submitProblemLog(message.payload));

            return;
        }

        if (message.type === 'OPEN_APP') {
            await chrome.tabs.create({ url: message.url });
            sendResponse({ ok: true });

            return;
        }

        if (message.type === 'OPEN_POPUP') {
            await chrome.action.openPopup();
            sendResponse({ ok: true });
        }
    })();

    return true;
});
