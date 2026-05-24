import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { LogProblemDialog } from '@/components/dashboard/log-problem-dialog';
import { ProblemCard } from '@/components/dashboard/problem-card';
import { FilterToolbar } from '@/components/logbook/filter-toolbar';
import { LogTable } from '@/components/logbook/log-table';
import { Button } from '@/components/ui/button';


interface Props {
    problems: any[];
    logs: any[];
    selectedProblemId: string | null;
}

export default function Logbook({ problems, logs, selectedProblemId }: Props) {
    const [logDialogOpen, setLogDialogOpen] = useState(Boolean(selectedProblemId));
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPattern, setSelectedPattern] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedDifficulty, setSelectedDifficulty] = useState('all');
    const [selectedDateRange, setSelectedDateRange] = useState('all');
    const [selectedTimeComplexity, setSelectedTimeComplexity] = useState('all');

    const problemsWithLogs = useMemo(() => {
        return problems.map((p) => {
            const problemLogs = logs
                .filter((l) => l.problem_id === p.id)
                .sort(
                    (a, b) =>
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime(),
                );

            return {
                ...p,
                logs: problemLogs,
                lastLog: problemLogs.length > 0 ? problemLogs[0] : null,
            };
        });
    }, [problems, logs]);

    const selectedProblem = useMemo(() => {
        if (!selectedProblemId) {
            return undefined;
        }

        return problemsWithLogs.find((problem) => problem.id === selectedProblemId);
    }, [problemsWithLogs, selectedProblemId]);

    const allPatterns = useMemo(() => {
        const patterns = new Set<string>();
        problems.forEach((p) => {
            if (p.patterns) {
                p.patterns.forEach((pat: string) => patterns.add(pat));
            }
        });

        return Array.from(patterns).sort();
    }, [problems]);

    const filteredProblems = useMemo(() => {
        let filtered = problemsWithLogs.filter((p) => p.logs.length > 0);

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (p) =>
                    p.title.toLowerCase().includes(query) ||
                    p.number.toString().includes(query) ||
                    (p.patterns &&
                        p.patterns.some((pattern: string) =>
                            pattern.toLowerCase().includes(query),
                        )),
            );
        }

        if (selectedPattern !== 'all' && selectedPattern !== '') {
            filtered = filtered.filter(
                (p) => p.patterns && p.patterns.includes(selectedPattern),
            );
        }

        if (selectedStatus !== 'all' && selectedStatus !== '') {
            filtered = filtered.filter(
                (p) => p.lastLog?.status === selectedStatus,
            );
        }

        if (selectedDifficulty !== 'all' && selectedDifficulty !== '') {
            filtered = filtered.filter(
                (p) => p.difficulty === selectedDifficulty,
            );
        }

        if (selectedTimeComplexity !== 'all' && selectedTimeComplexity !== '') {
            filtered = filtered.filter(
                (p) => p.lastLog?.time_complexity === selectedTimeComplexity,
            );
        }

        if (selectedDateRange !== 'all' && selectedDateRange !== '') {
            const now = new Date();
            const oneDay = 24 * 60 * 60 * 1000;

            filtered = filtered.filter((p) => {
                if (!p.lastLog) {
                    return false;
                }

                const logDate = new Date(p.lastLog.timestamp);

                switch (selectedDateRange) {
                    case '7d':
                        return now.getTime() - logDate.getTime() < 7 * oneDay;
                    case '30d':
                        return now.getTime() - logDate.getTime() < 30 * oneDay;
                    case 'this_month':
                        return (
                            logDate.getMonth() === now.getMonth() &&
                            logDate.getFullYear() === now.getFullYear()
                        );
                    default:
                        return true;
                }
            });
        }

        return filtered;
    }, [
        problemsWithLogs,
        searchQuery,
        selectedPattern,
        selectedStatus,
        selectedDifficulty,
        selectedDateRange,
        selectedTimeComplexity,
    ]);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedPattern('all');
        setSelectedStatus('all');
        setSelectedDifficulty('all');
        setSelectedDateRange('all');
        setSelectedTimeComplexity('all');
    };

    return (
        <>
            <Head title="Logbook" />
            <div className="mx-auto w-full max-w-7xl">
                <div className="mb-6 flex items-center justify-between px-4 pt-6 sm:px-6 lg:px-8">
                    <h1 className="text-h1">Logbook</h1>
                    <Button
                        onClick={() => setLogDialogOpen(true)}
                        className="bg-primary font-black tracking-widest text-primary-foreground"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Log a problem
                    </Button>
                </div>

                <FilterToolbar
                    searchQuery={searchQuery}
                    selectedPattern={
                        selectedPattern === 'all' ? '' : selectedPattern
                    }
                    selectedStatus={
                        selectedStatus === 'all' ? '' : selectedStatus
                    }
                    selectedDifficulty={
                        selectedDifficulty === 'all' ? '' : selectedDifficulty
                    }
                    selectedDateRange={
                        selectedDateRange === 'all' ? '' : selectedDateRange
                    }
                    selectedTimeComplexity={
                        selectedTimeComplexity === 'all'
                            ? ''
                            : selectedTimeComplexity
                    }
                    onSearchChange={setSearchQuery}
                    onPatternChange={(v) =>
                        setSelectedPattern(v === '' ? 'all' : v)
                    }
                    onStatusChange={(v) =>
                        setSelectedStatus(v === '' ? 'all' : v)
                    }
                    onDifficultyChange={(v) =>
                        setSelectedDifficulty(v === '' ? 'all' : v)
                    }
                    onDateRangeChange={(v) =>
                        setSelectedDateRange(v === '' ? 'all' : v)
                    }
                    onTimeComplexityChange={(v) =>
                        setSelectedTimeComplexity(v === '' ? 'all' : v)
                    }
                    onClear={clearFilters}
                    allPatterns={allPatterns}
                />

                <div className="px-4 py-6 sm:px-6 lg:px-8">
                    {filteredProblems.length === 0 ? (
                        <div className="py-12 text-center text-slate-600 dark:text-slate-400">
                            No logs found matching your filters.
                        </div>
                    ) : (
                        <>
                            <div className="hidden md:block">
                                <LogTable problems={filteredProblems} />
                            </div>

                            <div className="space-y-4 md:hidden">
                                {filteredProblems.map((problem) => (
                                    <ProblemCard
                                        key={problem.id}
                                        problem={problem}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
            <LogProblemDialog
                key={selectedProblem?.id ?? 'manual'}
                open={logDialogOpen}
                onOpenChange={setLogDialogOpen}
                problems={problems}
                defaultProblem={selectedProblem}
            />
        </>
    );
}

