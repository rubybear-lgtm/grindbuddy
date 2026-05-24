interface PatternFrequency {
    pattern: string;
    percentage: number;
    count: number;
}

interface Props {
    patterns: Record<string, number>;
    patternCounts?: Record<string, number>;
    totalProblems?: number;
    companyName: string;
    description?: string;
}

function getFrequencyLabel(percentage: number): string {
    if (percentage >= 70) {
        return 'Very Common';
    }

    if (percentage >= 40) {
        return 'Common';
    }

    if (percentage >= 20) {
        return 'Moderate';
    }

    if (percentage > 0) {
        return 'Rare';
    }

    return 'Not Tested';
}

function getFrequencyColor(percentage: number): string {
    if (percentage >= 70) {
        return 'bg-emerald-500';
    }

    if (percentage >= 40) {
        return 'bg-blue-500';
    }

    if (percentage >= 20) {
        return 'bg-amber-500';
    }

    if (percentage > 0) {
        return 'bg-slate-400';
    }

    return 'bg-slate-300';
}

export function PatternFrequencyTable({
    patterns,
    patternCounts = {},
    totalProblems,
    companyName,
    description,
}: Props) {
    const patternFrequencies: PatternFrequency[] = Object.entries(patterns)
        .map(([pattern, percentage]) => ({
            pattern,
            percentage,
            count: patternCounts[pattern] || 0,
        }))
        .sort((a, b) => b.percentage - a.percentage);

    return (
        <div className="w-full">
            <div className="mb-4">
                <h3 className="mb-2 text-lg font-semibold">
                    Pattern Frequency Breakdown
                </h3>
                <p className="text-sm text-muted-foreground">
                    {description ||
                        `Detailed breakdown of how often ${companyName} tests each pattern in their interviews.`}
                </p>
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
                <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 z-10 bg-muted">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium">
                                    Pattern
                                </th>
                                <th className="px-4 py-3 text-center text-sm font-medium">
                                    Frequency
                                </th>
                                <th className="px-4 py-3 text-center text-sm font-medium">
                                    Count
                                </th>
                                <th className="px-4 py-3 text-center text-sm font-medium">
                                    Category
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {patternFrequencies.map(
                                ({ pattern, percentage, count }) => (
                                    <tr
                                        key={pattern}
                                        className="border-t border-border transition-colors hover:bg-muted/50"
                                    >
                                        <td className="px-4 py-3 text-sm font-medium">
                                            {pattern}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="h-2 w-24 rounded-full bg-slate-200 dark:bg-slate-700">
                                                    <div
                                                        className={`h-2 rounded-full ${getFrequencyColor(percentage)} transition-all`}
                                                        style={{
                                                            width: `${percentage}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                                <span className="w-12 text-right text-sm font-medium">
                                                    {percentage}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                                            {count}{' '}
                                            {count === 1
                                                ? 'question'
                                                : 'questions'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getFrequencyColor(percentage)} text-white`}
                                            >
                                                {getFrequencyLabel(percentage)}
                                            </span>
                                        </td>
                                    </tr>
                                ),
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {totalProblems && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                    {companyName === 'Your Mastery'
                        ? `Based on ${totalProblems} total problems available`
                        : `Based on ${totalProblems} interview questions from ${companyName}`}
                </p>
            )}
        </div>
    );
}
