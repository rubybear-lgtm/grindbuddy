import { usePage } from '@inertiajs/react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DifficultyBadge } from '@/components/ui/difficulty-badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';

interface ProblemCardProps {
    problem: any;
    onLog?: (problem: any) => void;
}

function formatRelativeTime(date: string) {
    const now = new Date();
    const logDate = new Date(date);
    const diffInHours = Math.floor(
        (now.getTime() - logDate.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) {
        return 'Just now';
    }

    if (diffInHours < 24) {
        return `${diffInHours}h ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);

    return `${diffInDays}d ago`;
}

export function ProblemCard({ problem, onLog }: ProblemCardProps) {
    const { auth } = usePage().props as any;
    const preferredPlatform = auth?.preferredPlatform ?? 'leetcode';
    const practiceUrl = preferredPlatform === 'neetcode' && problem.neetcodeUrl
        ? problem.neetcodeUrl
        : problem.leetcodeUrl;
    const isNew = !problem.lastLog;

    return (
        <div
            className={cn(
                'group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-border bg-card p-8 transition-colors hover:border-primary/30',
                isNew ? 'border-l-2 border-l-primary/40' : '',
            )}
            role="button"
            tabIndex={0}
            onClick={() => onLog?.(problem)}
            onKeyDown={(e) => e.key === 'Enter' && onLog?.(problem)}
        >
            <div className="flex h-full flex-col gap-5">
                <div className="flex items-start justify-between gap-3">
                    <span className="mt-0.5 font-mono text-[10px] font-bold tracking-widest text-primary/50 uppercase">
                        #{problem.number}
                    </span>
                    <DifficultyBadge difficulty={problem.difficulty} />
                </div>

                <h3 className="text-xl leading-tight font-black tracking-tight text-foreground uppercase transition-colors group-hover:text-primary">
                    {problem.title}
                </h3>

                {problem.patterns && problem.patterns.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {problem.patterns.slice(0, 3).map((pattern: string) => (
                            <span
                                key={pattern}
                                className="rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase"
                            >
                                {pattern}
                            </span>
                        ))}
                        {problem.patterns.length > 3 && (
                            <span className="text-[11px] text-muted-foreground/40">
                                +{problem.patterns.length - 3}
                            </span>
                        )}
                    </div>
                )}

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-5">
                    <div className="flex min-w-0 items-center gap-2">
                        {problem.lastLog ? (
                            <>
                                <StatusBadge status={problem.lastLog.status} />
                                <span className="tabular truncate font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                                    {formatRelativeTime(
                                        problem.lastLog.timestamp,
                                    )}
                                </span>
                            </>
                        ) : (
                            <span className="font-mono text-[10px] tracking-widest text-primary/40 uppercase">
                                New
                            </span>
                        )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <a
                            href={practiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground/50 transition-colors hover:text-primary"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Open on ${preferredPlatform === 'neetcode' ? 'NeetCode' : 'LeetCode'}`}
                        >
                            <ExternalLink className="h-4 w-4" />
                        </a>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onLog?.(problem);
                            }}
                            className="h-8 !rounded-md border border-border !px-4 !text-[10px] !font-black tracking-widest transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
                        >
                            Log
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
