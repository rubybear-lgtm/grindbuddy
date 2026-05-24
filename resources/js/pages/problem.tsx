import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ExternalLink, Plus, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { LogProblemDialog } from '@/components/dashboard/log-problem-dialog';
import { Button } from '@/components/ui/button';
import { DifficultyBadge } from '@/components/ui/difficulty-badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { type Difficulty, type Status } from '@/lib/statusUtils';
import { logbook } from '@/routes';

interface ProblemLog {
    id: string;
    status: Status;
    time_complexity: string | null;
    space_complexity: string | null;
    notes: string | null;
    created_at: string;
}

interface ProblemData {
    id: string;
    number: number;
    title: string;
    difficulty: Difficulty;
    patterns: string[];
    neetcodeUrl: string | null;
    leetcodeUrl: string | null;
    companies: Array<{
        id: string;
        name: string;
        slug: string;
        frequency: number | null;
        timeframe: string | null;
    }>;
}

interface Props {
    problem: ProblemData;
    logs: ProblemLog[];
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatRelativeTime(date: string): string {
    const now = new Date();
    const logDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - logDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    return `${Math.floor(diffInDays / 30)}mo ago`;
}

function getBestStatus(logs: ProblemLog[]): Status | null {
    const statusRank: Record<Status, number> = {
        Optimal: 0,
        Suboptimal: 1,
        Hints: 2,
        Solution: 3,
        Failed: 4,
    };

    return logs.reduce<Status | null>((best, log) => {
        if (!best) return log.status;
        return statusRank[log.status] < statusRank[best] ? log.status : best;
    }, null);
}

const STATUS_DOT: Record<Status, string> = {
    Optimal: 'bg-emerald-400',
    Suboptimal: 'bg-amber-400',
    Hints: 'bg-blue-400',
    Solution: 'bg-purple-400',
    Failed: 'bg-rose-400',
};

export default function Problem({ problem, logs }: Props) {
    const [logDialogOpen, setLogDialogOpen] = useState(false);

    const bestStatus = getBestStatus(logs);
    const lastLog = logs[0] ?? null;

    const problemForDialog = {
        ...problem,
        lastLog: lastLog
            ? { ...lastLog, timestamp: lastLog.created_at }
            : null,
    };

    return (
        <>
            <Head title={`#${problem.number} ${problem.title}`} />

            <div className="mx-auto w-full max-w-4xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
                {/* Back nav */}
                <Link
                    href={logbook()}
                    className="inline-flex items-center gap-1.5 font-mono text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="h-3 w-3" />
                    Logbook
                </Link>

                {/* Problem header */}
                <div className="space-y-6 border-b border-border pb-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-3">
                            <span className="font-mono text-[10px] font-bold tracking-widest text-primary/50 uppercase">
                                #{problem.number}
                            </span>
                            <h1 className="text-h2 leading-none text-foreground">
                                {problem.title}
                            </h1>
                        </div>
                        <div className="flex shrink-0 items-center gap-3 pt-1">
                            <DifficultyBadge difficulty={problem.difficulty} />
                        </div>
                    </div>

                    {problem.patterns && problem.patterns.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {problem.patterns.map((pattern) => (
                                <span
                                    key={pattern}
                                    className="rounded-md border border-border bg-muted px-2.5 py-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase"
                                >
                                    {pattern}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4">
                        {problem.leetcodeUrl && (
                            <a
                                href={problem.leetcodeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 font-mono text-[10px] font-black tracking-widest text-muted-foreground uppercase transition-colors hover:text-primary"
                            >
                                <ExternalLink className="h-3 w-3" />
                                LeetCode
                            </a>
                        )}
                        {problem.neetcodeUrl && (
                            <a
                                href={problem.neetcodeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 font-mono text-[10px] font-black tracking-widest text-muted-foreground uppercase transition-colors hover:text-primary"
                            >
                                <BookOpen className="h-3 w-3" />
                                NeetCode
                            </a>
                        )}
                        <Button
                            onClick={() => setLogDialogOpen(true)}
                            size="sm"
                            className="ml-auto bg-primary font-black tracking-widest text-primary-foreground"
                        >
                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                            Log attempt
                        </Button>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="glass-panel rounded-2xl p-5">
                        <p className="text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase">
                            Attempts
                        </p>
                        <p className="tabular mt-2 text-3xl font-black text-foreground">
                            {logs.length}
                        </p>
                    </div>
                    <div className="glass-panel rounded-2xl p-5">
                        <p className="text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase">
                            Best result
                        </p>
                        <div className="mt-2">
                            {bestStatus ? (
                                <StatusBadge status={bestStatus} showIcon />
                            ) : (
                                <span className="text-sm text-muted-foreground">
                                    None yet
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="glass-panel rounded-2xl p-5">
                        <p className="text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase">
                            Last attempt
                        </p>
                        <p className="tabular mt-2 text-sm font-semibold text-foreground">
                            {lastLog
                                ? formatRelativeTime(lastLog.created_at)
                                : '—'}
                        </p>
                    </div>
                </div>

                {/* Attempt history */}
                <div className="space-y-4">
                    <h2 className="text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase">
                        Attempt history
                    </h2>

                    {logs.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
                            <p className="text-sm text-muted-foreground">
                                No attempts logged yet.
                            </p>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setLogDialogOpen(true)}
                                className="mt-4 border border-border font-black tracking-widest uppercase hover:border-primary hover:bg-primary/5 hover:text-primary"
                            >
                                Log your first attempt
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {logs.map((log, index) => (
                                <div
                                    key={log.id}
                                    className="relative rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/20"
                                >
                                    {/* Timeline connector */}
                                    {index < logs.length - 1 && (
                                        <div className="absolute bottom-0 left-8 h-3 w-px translate-y-full bg-border" />
                                    )}

                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[log.status]}`}
                                            />
                                            <div>
                                                <StatusBadge
                                                    status={log.status}
                                                    showIcon
                                                />
                                                {(log.time_complexity ||
                                                    log.space_complexity) && (
                                                    <p className="mt-1.5 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                                                        {log.time_complexity && (
                                                            <span>
                                                                Time:{' '}
                                                                <span className="text-foreground/70">
                                                                    {
                                                                        log.time_complexity
                                                                    }
                                                                </span>
                                                            </span>
                                                        )}
                                                        {log.time_complexity &&
                                                            log.space_complexity && (
                                                                <span className="mx-2 opacity-30">
                                                                    ·
                                                                </span>
                                                            )}
                                                        {log.space_complexity && (
                                                            <span>
                                                                Space:{' '}
                                                                <span className="text-foreground/70">
                                                                    {
                                                                        log.space_complexity
                                                                    }
                                                                </span>
                                                            </span>
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="font-mono text-[10px] font-bold tracking-widest text-foreground/50 uppercase">
                                                {formatDate(log.created_at)}
                                            </p>
                                            <p className="mt-0.5 font-mono text-[10px] tracking-widest text-muted-foreground/50 uppercase">
                                                {formatRelativeTime(
                                                    log.created_at,
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {log.notes && (
                                        <p className="mt-3 border-t border-border pt-3 text-sm leading-relaxed text-muted-foreground">
                                            {log.notes}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Companies */}
                {problem.companies && problem.companies.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase">
                            Asked by
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {problem.companies.map((company) => (
                                <div
                                    key={company.id}
                                    className="rounded-lg border border-border bg-card px-3 py-2"
                                >
                                    <p className="text-sm font-semibold text-foreground">
                                        {company.name}
                                    </p>
                                    {company.timeframe && (
                                        <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                                            {company.timeframe}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <LogProblemDialog
                key={`${problem.id}-dialog`}
                open={logDialogOpen}
                onOpenChange={setLogDialogOpen}
                problems={[problem]}
                defaultProblem={problemForDialog}
            />
        </>
    );
}

Problem.layout = {
    breadcrumbs: [
        {
            title: 'Logbook',
            href: logbook(),
        },
        {
            title: 'Problem',
            href: '#',
        },
    ],
};
