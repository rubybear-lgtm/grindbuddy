import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { appLoginUrl, appProblemUrl } from './lib/api';
import type { MatchResponse, PageContext, ProblemMatch, SubmitLogPayload } from './lib/types';
import './styles.css';

const STATUSES = ['Optimal', 'Suboptimal', 'Hints', 'Solution', 'Failed'] as const;

type ViewState =
    | { kind: 'loading' }
    | { kind: 'inactive' }
    | { kind: 'matching'; context: PageContext }
    | { kind: 'not_found'; context: PageContext }
    | { kind: 'unauthenticated'; context: PageContext }
    | { kind: 'ready'; context: PageContext; match: ProblemMatch }
    | { kind: 'success'; context: PageContext; match: ProblemMatch }
    | { kind: 'error'; context?: PageContext; message: string };

type ResolveResponse =
    | { ok: true; data: MatchResponse }
    | { ok: false; status: number; message: string };

type SubmitResponse =
    | { ok: true; data: { success: boolean } }
    | { ok: false; status: number; message: string };

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

function PopupApp() {
    const [state, setState] = useState<ViewState>({ kind: 'loading' });
    const [status, setStatus] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const context = 'context' in state ? state.context : null;
    const match = 'match' in state ? state.match : null;

    useEffect(() => {
        void (async () => {
            try {
                const activeContext = await sendMessage<PageContext | null>({
                    type: 'GET_CONTEXT',
                });

                if (!activeContext) {
                    setState({ kind: 'inactive' });

                    return;
                }

                setState({ kind: 'matching', context: activeContext });

                const result = await sendMessage<ResolveResponse>({
                    type: 'RESOLVE_CONTEXT',
                    context: activeContext,
                });

                if (!result.ok) {
                    if (result.status === 401) {
                        setState({ kind: 'unauthenticated', context: activeContext });

                        return;
                    }

                    setState({
                        kind: 'error',
                        context: activeContext,
                        message: result.message,
                    });

                    return;
                }

                if (!result.data.match) {
                    setState({ kind: 'not_found', context: activeContext });

                    return;
                }

                setStatus('');
                setNotes('');
                setMessage(null);
                setState({
                    kind: 'ready',
                    context: activeContext,
                    match: result.data.match,
                });
            } catch (error) {
                setState({
                    kind: 'error',
                    message: error instanceof Error ? error.message : 'Unexpected error.',
                });
            }
        })();
    }, []);

    const openInApp = async () => {
        await sendMessage({
            type: 'OPEN_APP',
            url: match
                ? appProblemUrl(match.id)
                : new URL('/logbook', __GRIND_BUDDY_ORIGIN__).toString(),
        });
    };

    const openLogin = async () => {
        await sendMessage({
            type: 'OPEN_APP',
            url: appLoginUrl(),
        });
    };

    const handleSubmit = async () => {
        if (!match || !context || !status) {
            return;
        }

        setSubmitting(true);
        setMessage(null);

        try {
            const payload: SubmitLogPayload = {
                problemId: match.id,
                status,
                notes: notes.trim() ? notes.trim() : null,
            };

            const result = await sendMessage<SubmitResponse>({
                type: 'SUBMIT_LOG',
                payload,
            });

            if (!result.ok) {
                if (result.status === 401) {
                    setState({ kind: 'unauthenticated', context });

                    return;
                }

                setMessage(result.message);

                return;
            }

            setState({
                kind: 'success',
                context,
                match,
            });
            setMessage('Saved.');
        } finally {
            setSubmitting(false);
        }
    };

    const canSubmit = Boolean(match && status && !submitting);
    const lastLogText = useMemo(() => {
        if (!match?.lastLog) {
            return null;
        }

        return `${match.lastLog.status} · ${new Date(match.lastLog.timestamp).toLocaleString()}`;
    }, [match]);

    return (
        <div className="popup">
            {state.kind === 'loading' || state.kind === 'matching' ? (
                <div className="card state-grid">
                    <p className="eyebrow">Grind Buddy</p>
                    <h1 className="state-title">Matching current problem</h1>
                    <p className="state-copy">
                        {state.kind === 'loading'
                            ? 'Checking the active tab.'
                            : `Looking up ${state.context.title}.`}
                    </p>
                </div>
            ) : null}

            {state.kind === 'inactive' ? (
                <div className="card state-grid">
                    <p className="eyebrow">Grind Buddy</p>
                    <h1 className="state-title">No supported problem detected</h1>
                    <p className="state-copy">
                        Open a LeetCode or NeetCode problem page, then reopen the popup.
                    </p>
                </div>
            ) : null}

            {state.kind === 'not_found' ? (
                <div className="card state-grid">
                    <p className="eyebrow">Not in catalog</p>
                    <h1 className="state-title">{state.context.title}</h1>
                    <p className="state-copy">
                        This problem does not have an exact match in Grind Buddy yet.
                    </p>
                    <div className="actions">
                        <button className="button button-secondary" onClick={openInApp}>
                            Open in app
                        </button>
                    </div>
                </div>
            ) : null}

            {state.kind === 'unauthenticated' ? (
                <div className="card state-grid">
                    <p className="eyebrow">Sign in required</p>
                    <h1 className="state-title">{state.context.title}</h1>
                    <p className="state-copy">
                        Sign in from the extension, then come back here to save this problem.
                    </p>
                    <div className="actions">
                        <button className="button button-primary" onClick={openLogin}>
                            Sign in
                        </button>
                    </div>
                </div>
            ) : null}

            {state.kind === 'error' ? (
                <div className="card state-grid">
                    <p className="eyebrow">Error</p>
                    <h1 className="state-title">Could not load the current problem</h1>
                    <p className="state-copy">{state.message}</p>
                </div>
            ) : null}

            {state.kind === 'ready' || state.kind === 'success' ? (
                <div className="card">
                    <p className="eyebrow">Matched problem</p>
                    <h1 className="title">#{match?.number} {match?.title}</h1>
                    <p className="subtle">
                        {match?.difficulty} · {state.context.source === 'leetcode' ? 'LeetCode' : 'NeetCode'}
                    </p>

                    <div className="meta">
                        <span className="badge">{match?.patterns[0] ?? 'catalog match'}</span>
                        {lastLogText ? <span className="subtle">{lastLogText}</span> : <span className="subtle">No prior logs</span>}
                    </div>

                    <div className="stack">
                        <div className="field">
                            <label className="label" htmlFor="status">
                                Status
                            </label>
                            <select
                                id="status"
                                className="control"
                                value={status}
                                onChange={(event) => setStatus(event.target.value)}
                            >
                                <option value="">Choose one</option>
                                {STATUSES.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="field">
                            <label className="label" htmlFor="notes">
                                Notes
                            </label>
                            <textarea
                                id="notes"
                                className="control"
                                value={notes}
                                onChange={(event) => setNotes(event.target.value)}
                                placeholder="What mattered?"
                            />
                        </div>
                    </div>

                    {message ? <div className="message error">{message}</div> : null}
                    {state.kind === 'success' ? <div className="message success">Saved. You can open the problem in the app.</div> : null}

                    <div className="actions">
                        <button className="button button-primary" disabled={!canSubmit} onClick={handleSubmit}>
                            {submitting ? 'Saving…' : 'Log problem'}
                        </button>
                        <button className="button button-secondary" onClick={openInApp}>
                            Open in app
                        </button>
                    </div>
                </div>
            ) : null}

            <div className="footer">
                <button className="button button-secondary button-footnote" onClick={() => void chrome.runtime.openOptionsPage()}>
                    Notification settings
                </button>
            </div>
        </div>
    );
}

createRoot(document.getElementById('root') as HTMLElement).render(<PopupApp />);
