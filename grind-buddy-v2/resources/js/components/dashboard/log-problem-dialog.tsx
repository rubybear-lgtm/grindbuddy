import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { DifficultyBadge } from '@/components/ui/difficulty-badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Status } from '@/lib/statusUtils';

const STATUSES: Status[] = ['Optimal', 'Suboptimal', 'Hints', 'Solution', 'Failed'];

const STATUS_META: Record<Status, { dot: string; description: string }> = {
    Optimal:    { dot: 'bg-emerald-400', description: 'Clean solve, no hints' },
    Suboptimal: { dot: 'bg-amber-400',   description: 'Correct but not optimal' },
    Hints:      { dot: 'bg-blue-400',    description: 'Needed a nudge' },
    Solution:   { dot: 'bg-purple-400',  description: 'Read the solution' },
    Failed:     { dot: 'bg-rose-400',    description: "Couldn't finish it" },
};

function formatRelativeTime(date: string) {
    const now = new Date();
    const logDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - logDate.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
return 'just now';
}

    if (diffInHours < 24) {
return `${diffInHours}h ago`;
}

    return `${Math.floor(diffInHours / 24)}d ago`;
}

function getCsrfToken(): string {
    const match = document.cookie.split(';').find((c) => c.trim().startsWith('XSRF-TOKEN='));

    return decodeURIComponent(match?.split('=')?.[1] ?? '');
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    problems: any[];
    defaultProblem?: any;
}

export function LogProblemDialog({ open, onOpenChange, problems, defaultProblem }: Props) {
    const [problemId, setProblemId] = useState<string>(defaultProblem?.id ?? '');
    const [status, setStatus] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reset = () => {
        setProblemId(defaultProblem?.id ?? '');
        setStatus('');
        setNotes('');
        setError(null);
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            reset();
        }

        onOpenChange(next);
    };

    const handleSubmit = async () => {
        if (!problemId || !status) {
            setError('Select a problem and a status.');

            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch('/api/logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getCsrfToken(),
                    Accept: 'application/json',
                },
                body: JSON.stringify({ problemId, status, notes: notes || null }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data?.message ?? 'Something went wrong.');

                return;
            }

            onOpenChange(false);
            reset();
            router.reload();
        } catch {
            setError('Network error. Try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-black tracking-widest uppercase">
                        Log a problem
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {defaultProblem ? (
                        <div className="rounded-md border border-border bg-muted/40 px-4 py-3">
                            <div className="flex items-center justify-between gap-2">
                                <p className="font-mono text-[10px] tracking-widest text-primary/60 uppercase">
                                    #{defaultProblem.number}
                                </p>
                                <DifficultyBadge difficulty={defaultProblem.difficulty} />
                            </div>
                            <p className="mt-1 font-black tracking-tight text-foreground uppercase">
                                {defaultProblem.title}
                            </p>
                            {defaultProblem.lastLog && (
                                <p className="mt-2 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                                    Last:{' '}
                                    <span className="text-foreground/70">
                                        {defaultProblem.lastLog.status}
                                    </span>{' '}
                                    · {formatRelativeTime(defaultProblem.lastLog.timestamp)}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase">
                                Problem
                            </label>
                            <Select value={problemId} onValueChange={setProblemId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a problem…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {problems.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            <span className="font-mono text-xs text-muted-foreground">
                                                #{p.number}
                                            </span>{' '}
                                            {p.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase">
                            Result
                        </label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="How did it go?" />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUSES.map((s) => (
                                    <SelectItem key={s} value={s}>
                                        <span className="flex items-center gap-2.5">
                                            <span className={`size-2 shrink-0 rounded-full ${STATUS_META[s].dot}`} />
                                            <span className="font-medium">{s}</span>
                                            <span className="text-muted-foreground/60">
                                                — {STATUS_META[s].description}
                                            </span>
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase">
                            Notes{' '}
                            <span className="font-normal normal-case tracking-normal opacity-50">
                                optional
                            </span>
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="What did you struggle with? Key insight?"
                            rows={3}
                            className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-rose-400">{error}</p>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => handleOpenChange(false)}
                        disabled={submitting}
                        className="border border-border"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || !status || (!defaultProblem && !problemId)}
                        className="bg-primary font-black tracking-widest text-primary-foreground hover:bg-primary/90"
                    >
                        {submitting ? 'Saving…' : 'Log it'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
