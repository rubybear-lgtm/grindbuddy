import { Link } from '@inertiajs/react';
import { DifficultyBadge } from '@/components/ui/difficulty-badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { show as problemShow } from '@/routes/problem';

interface Props {
    problems: any[];
}

function formatRelativeTime(date: string): string {
    const now = new Date();
    const logDate = new Date(date);
    const diffInSeconds = Math.floor(
        (now.getTime() - logDate.getTime()) / 1000,
    );

    if (diffInSeconds < 60) {
        return 'just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);

    if (diffInMinutes < 60) {
        return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInHours < 24) {
        return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays < 7) {
        return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);

    if (diffInWeeks < 4) {
        return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);

    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
}

export function LogTable({ problems }: Props) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                            Problem
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                            Pattern
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                            Last Status
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                            Last Logged
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {problems.map((problem) => (
                        <tr
                            key={problem.id}
                            className="cursor-pointer border-b border-slate-200 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                        >
                            <td className="px-4 py-3">
                                <Link
                                    href={problemShow(problem.id).url}
                                    className="block"
                                >
                                    <div className="font-mono font-semibold whitespace-nowrap hover:text-primary">
                                        #{problem.number} {problem.title}
                                    </div>
                                    <DifficultyBadge
                                        difficulty={problem.difficulty}
                                    />
                                </Link>
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                    {problem.patterns &&
                                        problem.patterns
                                            .slice(0, 2)
                                            .map((pattern: string) => (
                                                <span
                                                    key={pattern}
                                                    className="rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase"
                                                >
                                                    {pattern}
                                                </span>
                                            ))}
                                    {problem.patterns &&
                                        problem.patterns.length > 2 && (
                                            <span className="text-xs text-slate-500">
                                                +{problem.patterns.length - 2}
                                            </span>
                                        )}
                                </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                {problem.lastLog ? (
                                    <StatusBadge
                                        status={problem.lastLog.status}
                                    />
                                ) : (
                                    <span className="text-slate-400">
                                        Never
                                    </span>
                                )}
                            </td>
                            <td className="px-4 py-3 text-sm whitespace-nowrap text-slate-600 dark:text-slate-400">
                                {problem.lastLog
                                    ? formatRelativeTime(
                                          problem.lastLog.timestamp,
                                      )
                                    : '—'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
