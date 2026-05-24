import { Head, router, usePage } from '@inertiajs/react';
import { Activity, Brain, Clock, Play, Puzzle, X, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { LogProblemDialog } from '@/components/dashboard/log-problem-dialog';
import { ProblemCard } from '@/components/dashboard/problem-card';
import { ZeroState } from '@/components/dashboard/zero-state';
import { Button } from '@/components/ui/button';


interface Props {
    serverTime: string;
    problems: any[];
    companies: any[];
    logs: any[];
}

export default function Dashboard({
    serverTime,
    problems: _problems,
    logs: _logs,
}: Props) {
    const { auth } = usePage().props as any;
    const preferredPlatform: 'leetcode' | 'neetcode' = auth?.preferredPlatform ?? 'leetcode';
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogProblem, setDialogProblem] = useState<any>(undefined);
    const [showAllProblems, setShowAllProblems] = useState(false);
    const [extensionBannerDismissed, setExtensionBannerDismissed] = useState(
        () => localStorage.getItem('gb_ext_dismissed') === '1',
    );

    const dismissExtensionBanner = () => {
        localStorage.setItem('gb_ext_dismissed', '1');
        setExtensionBannerDismissed(true);
    };

    const togglePlatform = () => {
        router.patch('/settings/platform', {
            preferred_platform: preferredPlatform === 'leetcode' ? 'neetcode' : 'leetcode',
        }, { preserveScroll: true });
    };

    const openLog = (problem?: any) => {
        setDialogProblem(problem);
        setDialogOpen(true);
    };

    const problemsWithLogs = useMemo(() => {
        const logsByProblemId = new Map<string, any[]>();
        _logs.forEach((log) => {
            if (!logsByProblemId.has(log.problem_id)) {
                logsByProblemId.set(log.problem_id, []);
            }

            logsByProblemId.get(log.problem_id)!.push(log);
        });

        logsByProblemId.forEach((logs) => {
            logs.sort(
                (a, b) =>
                    new Date(b.timestamp).getTime() -
                    new Date(a.timestamp).getTime(),
            );
        });

        return _problems.map((problem) => {
            const problemLogs = logsByProblemId.get(problem.id) || [];

            return {
                ...problem,
                logs: problemLogs,
                lastLog: problemLogs[0] || undefined,
            };
        });
    }, [_problems, _logs]);

    const currentTime = Date.parse(serverTime);

    const reviewQueue = useMemo(() => {
        return problemsWithLogs.filter((problem) => {
            if (!problem.lastLog) {
                return false;
            }

            if (problem.lastLog.status === 'Failed') {
                return true;
            }

            const daysSinceLastLog =
                (currentTime - new Date(problem.lastLog.timestamp).getTime()) /
                (1000 * 60 * 60 * 24);

            return daysSinceLastLog >= 1;
        });
    }, [currentTime, problemsWithLogs]);

    const firstDuePracticeUrl = useMemo(() => {
        const first = reviewQueue[0];
        if (!first) return null;
        if (preferredPlatform === 'neetcode' && first.neetcodeUrl) return first.neetcodeUrl;
        return first.leetcodeUrl ?? null;
    }, [reviewQueue, preferredPlatform]);

    const masteryStats = useMemo(() => {
        return {
            streak: 12,
            mastered: 45,
            today: reviewQueue.length,
            recallStability: 84,
        };
    }, [reviewQueue]);

    return (
        <>
            <Head title="Dashboard" />
            <div className="mx-auto max-w-7xl space-y-12 px-8 py-16">
                {/* Extension banner */}
                {!extensionBannerDismissed && (
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
                        <div className="flex items-center gap-3">
                            <Puzzle className="h-4 w-4 shrink-0 text-primary" />
                            <p className="text-sm font-medium text-foreground">
                                <span className="font-black text-primary">Grind Buddy extension</span>
                                {' '}— log problems directly from LeetCode or NeetCode without switching tabs.{' '}
                                <a
                                    href="https://chromewebstore.google.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black text-primary transition-all hover:bg-primary/20 hover:scale-[1.03] active:scale-[0.98] ml-2"
                                >
                                    <img
                                        src="/chrome_logo.png"
                                        alt="Chrome"
                                        className="h-3.5 w-3.5 shrink-0"
                                    />
                                    Add to Chrome
                                </a>
                            </p>
                        </div>
                        <button
                            onClick={dismissExtensionBanner}
                            className="shrink-0 text-muted-foreground/50 transition-colors hover:text-foreground"
                            aria-label="Dismiss"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}
                <header className="flex flex-col justify-between gap-12 border-b border-border pb-12 md:flex-row md:items-end">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black tracking-[0.3em] text-primary uppercase">
                            <Activity className="h-3 w-3" />
                            Daily review
                        </div>
                        <h1 className="text-h2 text-foreground">Dashboard</h1>
                        <p className="text-xl font-medium tracking-tight text-muted-foreground">
                            Your spaced repetition queue for today.
                        </p>
                    </div>

                    <div className="flex gap-6">
                        <div className="glass-panel flex min-w-[160px] flex-col gap-1 rounded-2xl px-8 py-4">
                            <span className="text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase">
                                Retention
                            </span>
                            <div className="tabular tracking-tightest text-3xl font-black text-foreground">
                                {masteryStats.recallStability}%
                            </div>
                        </div>
                        <div className="glass-panel flex min-w-[160px] flex-col gap-1 rounded-2xl px-8 py-4">
                            <span className="text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase">
                                Streak
                            </span>
                            <div className="tabular tracking-tightest text-3xl font-black text-foreground">
                                {masteryStats.streak} days
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
                    <div className="group relative overflow-hidden rounded-[3rem] border border-border bg-card p-16 transition-all hover:bg-muted/50 md:col-span-8">
                        <div className="shimmer-green pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"></div>
                        <div className="relative z-10 flex h-full flex-col">
                            <div className="max-w-lg space-y-8">
                                <div className="space-y-4">
                                    <h2 className="tracking-tightest text-6xl leading-none font-black text-foreground uppercase italic">
                                        Ready to <br />
                                        <span className="text-primary">
                                            review?
                                        </span>
                                    </h2>
                                    <p className="text-2xl leading-tight font-medium text-muted-foreground">
                                        You have{' '}
                                        <span className="font-bold text-foreground">
                                            {masteryStats.today} problems
                                        </span>{' '}
                                        due for review today.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-4 pt-4">
                                    <Button
                                        size="lg"
                                        className="h-14 !rounded-md bg-primary px-10 text-base !font-black tracking-widest text-primary-foreground shadow-[0_0_50px_oklch(var(--primary)/0.3)] transition-all hover:scale-105 disabled:opacity-40"
                                        disabled={reviewQueue.length === 0}
                                        onClick={() =>
                                            document
                                                .getElementById('review-queue')
                                                ?.scrollIntoView({ behavior: 'smooth' })
                                        }
                                    >
                                        <Play className="mr-3 h-5 w-5 fill-current" />
                                        Start review
                                    </Button>
                                    {firstDuePracticeUrl && (
                                        <a
                                            href={firstDuePracticeUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Button
                                                variant="ghost"
                                                size="lg"
                                                className="h-14 !rounded-md border border-border px-8 text-base !font-black tracking-widest text-foreground hover:bg-muted"
                                            >
                                                Practice on {preferredPlatform === 'neetcode' ? 'NeetCode' : 'LeetCode'}
                                            </Button>
                                        </a>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 !rounded-full border border-border px-4 !text-[10px] !font-black tracking-widest text-muted-foreground hover:bg-muted"
                                        onClick={togglePlatform}
                                    >
                                        Switch to {preferredPlatform === 'leetcode' ? 'NeetCode' : 'LeetCode'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <Zap className="pointer-events-none absolute -right-20 -bottom-20 h-96 w-96 -rotate-12 text-primary/5" />
                    </div>

                    <div className="grid grid-rows-2 gap-8 md:col-span-4">
                        <div className="group flex flex-col justify-between rounded-[2.5rem] border border-border bg-card p-10">
                            <div className="space-y-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                                    <Brain className="h-7 w-7 fill-current" />
                                </div>
                                <p className="text-[10px] font-black tracking-[0.4em] text-muted-foreground uppercase">
                                    Patterns mastered
                                </p>
                                <div className="tabular tracking-tightest text-5xl font-black text-foreground">
                                    {masteryStats.mastered}
                                </div>
                            </div>
                            <p className="text-xs font-medium text-muted-foreground opacity-60">
                                Problems you've solved cleanly and reviewed
                                enough to retain.
                            </p>
                        </div>

                        <div className="group flex flex-col justify-between rounded-[2.5rem] border border-border bg-card p-10">
                            <div className="space-y-4">
                                <div className="bg-brand-cyan/10 text-brand-cyan flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110">
                                    <Clock className="h-7 w-7" />
                                </div>
                                <p className="text-[10px] font-black tracking-[0.4em] text-muted-foreground uppercase">
                                    Est. time today
                                </p>
                                <div className="tabular tracking-tightest text-5xl font-black text-foreground">
                                    {masteryStats.today * 12}
                                    <span className="ml-1 text-xl text-muted-foreground">
                                        min
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs font-medium text-muted-foreground opacity-60">
                                Based on your average time per problem.
                            </p>
                        </div>
                    </div>

                    <div id="review-queue" className="space-y-8 pt-12 md:col-span-12">
                        <div className="flex items-center justify-between border-b border-border pb-6">
                            <h3 className="tracking-tightest text-2xl font-black text-foreground uppercase italic">
                                Due for review
                            </h3>
                            <span className="text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase opacity-40">
                                Most overdue first
                            </span>
                        </div>

                        {reviewQueue.length === 0 ? (
                            <ZeroState />
                        ) : (
                            <>
                                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                                    {(showAllProblems ? reviewQueue : reviewQueue.slice(0, 6)).map((problem) => (
                                        <ProblemCard
                                            key={problem.id}
                                            problem={problem}
                                            onLog={openLog}
                                        />
                                    ))}
                                </div>

                                {reviewQueue.length > 6 && (
                                    <div className="pt-12 text-center">
                                        <Button
                                            variant="ghost"
                                            className="text-sm font-black tracking-widest text-primary uppercase hover:bg-primary/5"
                                            onClick={() => setShowAllProblems((v) => !v)}
                                        >
                                            {showAllProblems
                                                ? 'Show fewer'
                                                : `Show all ${reviewQueue.length} problems`}
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
            <LogProblemDialog
                key={dialogProblem?.id ?? 'manual'}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                problems={_problems}
                defaultProblem={dialogProblem}
            />
        </>
    );
}

