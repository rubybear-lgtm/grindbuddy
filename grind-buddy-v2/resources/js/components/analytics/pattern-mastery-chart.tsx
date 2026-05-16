import { useMemo } from 'react';
import { PatternFrequencyTable } from '@/components/analytics/pattern-frequency-table';
import { RadarChart } from '@/components/common/radar-chart';

interface Props {
    problems: any[];
    logs: any[];
}

export function PatternMasteryChart({ problems, logs }: Props) {
    const allAvailablePatterns = useMemo(() => {
        const patternSet = new Set<string>();
        problems.forEach((problem) => {
            if (problem.patterns) {
                problem.patterns.forEach((pattern: string) => {
                    patternSet.add(pattern);
                });
            }
        });

        return Array.from(patternSet).sort();
    }, [problems]);

    const { patternMastery, masteryTableData, totalQuestionsAnswered } =
        useMemo(() => {
            const totalAvailable = new Map<string, number>();
            problems.forEach((problem) => {
                if (problem.patterns) {
                    problem.patterns.forEach((pattern: string) => {
                        totalAvailable.set(
                            pattern,
                            (totalAvailable.get(pattern) || 0) + 1,
                        );
                    });
                }
            });

            const attemptedCount = new Map<string, number>();
            let totalQuestions = 0;

            problems.forEach((problem) => {
                const problemLogs = logs.filter(
                    (l) => l.problem_id === problem.id,
                );

                if (problemLogs.length > 0) {
                    totalQuestions++;

                    if (problem.patterns) {
                        problem.patterns.forEach((pattern: string) => {
                            attemptedCount.set(
                                pattern,
                                (attemptedCount.get(pattern) || 0) + 1,
                            );
                        });
                    }
                }
            });

            const mastery: Record<string, number> = {};
            const patterns: Record<string, number> = {};
            const patternCounts: Record<string, number> = {};
            let totalProblems = 0;

            totalAvailable.forEach((total, pattern) => {
                const attempted = attemptedCount.get(pattern) || 0;
                const percentage =
                    total > 0 ? Math.round((attempted / total) * 100) : 0;
                mastery[pattern] = percentage;
                patterns[pattern] = percentage;
                patternCounts[pattern] = attempted;
                totalProblems += total;
            });

            return {
                patternMastery: mastery,
                masteryTableData: { patterns, patternCounts, totalProblems },
                totalQuestionsAnswered: totalQuestions,
            };
        }, [problems, logs]);

    const chartData = useMemo(() => {
        const labels = allAvailablePatterns;
        const data = labels.map((pattern) => patternMastery[pattern] || 0);

        return {
            labels,
            primary: {
                label: 'Pattern Mastery %',
                data,
                color: 'rgb(59, 130, 246)',
            },
        };
    }, [allAvailablePatterns, patternMastery]);

    return (
        <div className="flex h-full w-full flex-col">
            <div className="h-72">
                {chartData.labels.length > 0 ? (
                    <RadarChart
                        labels={chartData.labels}
                        primaryData={chartData.primary}
                        totalQuestionsAnswered={totalQuestionsAnswered}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        No data available yet. Start solving problems!
                    </div>
                )}
            </div>

            {masteryTableData.patterns &&
                Object.keys(masteryTableData.patterns).length > 0 && (
                    <div className="mt-auto pt-8">
                        <PatternFrequencyTable
                            patterns={masteryTableData.patterns}
                            patternCounts={masteryTableData.patternCounts}
                            totalProblems={masteryTableData.totalProblems}
                            companyName="Your Mastery"
                            description="Detailed breakdown of your mastery percentage for each pattern. Shows what percentage of available problems you've attempted in each pattern."
                        />
                    </div>
                )}
        </div>
    );
}
