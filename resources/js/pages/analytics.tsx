import { Head } from '@inertiajs/react';
import { Activity, Target, BarChart3 } from 'lucide-react';
import { ActivityHeatmap } from '@/components/analytics/activity-heatmap';
import { PatternMasteryChart } from '@/components/analytics/pattern-mastery-chart';
import { SkillMatch } from '@/components/analytics/skill-match';
import { StatusBreakdown } from '@/components/analytics/status-breakdown';

interface Props {
    companies: any[];
    logs: any[];
    problems?: any[];
}

export default function Analytics({ companies, logs, problems = [] }: Props) {
    const isDataLoaded = true;

    const cleanSolves =
        logs.length > 0
            ? Math.round(
                  (logs.filter(
                      (l) =>
                          l.status === 'Optimal' || l.status === 'Suboptimal',
                  ).length /
                      logs.length) *
                      1000,
              ) / 10
            : 0;

    return (
        <>
            <Head title="Analytics" />
            <div className="mx-auto w-full max-w-7xl space-y-16 px-8 py-16">
                <header className="flex flex-col justify-between gap-8 border-b border-border pb-12 md:flex-row md:items-end">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black tracking-[0.3em] text-primary uppercase">
                            <Activity className="h-3 w-3" />
                            Progress
                        </div>
                        <h1 className="text-h2 leading-none text-foreground italic">
                            Analytics
                        </h1>
                        <p className="text-xl font-medium tracking-tight text-muted-foreground">
                            How your LeetCode retention and pattern coverage are
                            trending over time.
                        </p>
                    </div>
                </header>

                {!isDataLoaded ? (
                    <div className="flex h-96 items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <Activity className="h-10 w-10 animate-pulse text-primary" />
                            <span className="text-xs font-black tracking-[0.4em] text-muted-foreground uppercase">
                                Loading your data...
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="grid auto-rows-min grid-cols-1 gap-8 md:grid-cols-12">
                        <div className="group relative overflow-hidden rounded-[3rem] border border-border bg-card p-12 transition-all hover:bg-muted/50 md:col-span-8">
                            <div className="shimmer-green absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"></div>
                            <div className="relative z-10 space-y-12">
                                <div className="flex items-center justify-between border-b border-border pb-8">
                                    <div className="space-y-2">
                                        <div className="text-[10px] font-black tracking-[0.4em] text-primary uppercase">
                                            Interview readiness
                                        </div>
                                        <h2 className="tracking-tightest text-4xl leading-none font-black text-foreground uppercase italic">
                                            Skill match
                                        </h2>
                                    </div>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted text-muted-foreground transition-colors group-hover:text-primary">
                                        <Target className="h-6 w-6" />
                                    </div>
                                </div>
                                <div className="min-h-[400px]">
                                    <SkillMatch companies={companies} />
                                </div>
                            </div>
                        </div>

                        <div className="group flex flex-col justify-between rounded-[3rem] border border-border bg-card p-10 md:col-span-4">
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <div className="text-[10px] font-black tracking-[0.4em] text-muted-foreground uppercase">
                                        Pattern coverage
                                    </div>
                                    <h2 className="tracking-tightest text-3xl leading-none font-black text-foreground uppercase italic">
                                        Pattern map
                                    </h2>
                                </div>
                                <div className="flex min-h-[300px] items-center justify-center">
                                    <PatternMasteryChart
                                        problems={problems}
                                        logs={logs}
                                    />
                                </div>
                            </div>
                            <p className="border-t border-border pt-8 text-xs font-medium text-muted-foreground opacity-60">
                                Problems attempted per pattern category, as a
                                percentage of your total attempts.
                            </p>
                        </div>

                        <div className="group overflow-hidden rounded-[3rem] border border-border bg-card p-12 md:col-span-12">
                            <div className="mb-12 flex items-center justify-between">
                                <div className="space-y-2">
                                    <div className="text-brand-cyan text-[10px] font-black tracking-[0.4em] uppercase">
                                        Practice activity
                                    </div>
                                    <h2 className="tracking-tightest text-4xl leading-none font-black text-foreground uppercase italic">
                                        Grind history
                                    </h2>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                    <span className="flex items-center gap-1.5">
                                        <div className="h-2 w-2 rounded-sm bg-white/10"></div>{' '}
                                        Low
                                    </span>
                                    <div className="h-px w-8 bg-muted"></div>
                                    <span className="flex items-center gap-1.5">
                                        <div className="h-2 w-2 rounded-sm bg-primary shadow-[0_0_8px_oklch(var(--primary)/0.6)]"></div>{' '}
                                        High
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-x-auto pb-4">
                                <ActivityHeatmap logs={logs} />
                            </div>
                        </div>

                        <div className="items-center gap-20 rounded-[3rem] border border-border bg-card p-12 md:col-span-12 lg:grid lg:grid-cols-2">
                            <div className="space-y-10">
                                <div className="space-y-4">
                                    <div className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-[10px] font-black tracking-[0.3em] text-primary uppercase">
                                        <BarChart3 className="h-3.5 w-3.5" />
                                        Solve quality
                                    </div>
                                    <h2 className="tracking-tightest text-5xl leading-none font-black text-foreground uppercase italic">
                                        How well are you solving?
                                    </h2>
                                    <p className="text-xl leading-snug font-medium text-muted-foreground">
                                        A breakdown of how cleanly you've solved
                                        each problem — clean, optimal, or needed
                                        help.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-8 pt-6">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                            Clean solves
                                        </span>
                                        <div className="tabular tracking-tightest text-3xl font-black text-primary">
                                            {cleanSolves}%
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                            Consistency
                                        </span>
                                        <div className="text-brand-cyan tabular tracking-tightest text-3xl font-black">
                                            A+
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-12 min-h-[300px] lg:mt-0">
                                <StatusBreakdown logs={logs} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

