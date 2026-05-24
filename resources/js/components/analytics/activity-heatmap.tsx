import { useMemo } from 'react';

interface Props {
    logs: any[];
}

export function ActivityHeatmap({ logs }: Props) {
    const days = useMemo(() => {
        const result: Date[] = [];

        for (let i = 364; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            result.push(date);
        }

        return result;
    }, []);

    const logCounts = useMemo(() => {
        const counts = new Map<string, number>();
        logs.forEach((log) => {
            const dateKey = new Date(log.timestamp)
                .toISOString()
                .split('T')[0];
            counts.set(dateKey, (counts.get(dateKey) || 0) + 1);
        });

        return counts;
    }, [logs]);

    function getIntensity(count: number): string {
        if (count === 0) {
            return 'bg-slate-100 dark:bg-slate-800';
        }

        if (count === 1) {
            return 'bg-emerald-300 dark:bg-emerald-600';
        }

        if (count === 2) {
            return 'bg-emerald-400 dark:bg-emerald-500';
        }

        if (count >= 3) {
            return 'bg-emerald-600 dark:bg-emerald-400';
        }

        return 'bg-slate-100 dark:bg-slate-800';
    }

    function getDateKey(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    return (
        <div className="w-full">
            <div className="grid grid-cols-7 gap-1 sm:grid-cols-14 md:grid-cols-21 lg:grid-cols-35">
                {days.map((day, i) => {
                    const dateKey = getDateKey(day);
                    const count = logCounts.get(dateKey) || 0;

                    return (
                        <div
                            key={i}
                            className={`h-3 w-3 rounded-sm ${getIntensity(count)} transition-colors`}
                            title={`${day.toLocaleDateString()}: ${count} ${count === 1 ? 'problem' : 'problems'} solved`}
                            role="button"
                            tabIndex={0}
                        ></div>
                    );
                })}
            </div>
        </div>
    );
}
