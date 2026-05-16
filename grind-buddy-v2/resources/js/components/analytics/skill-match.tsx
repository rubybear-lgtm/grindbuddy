import { RefreshCw } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { PatternFrequencyTable } from '@/components/analytics/pattern-frequency-table';
import { RadarChart } from '@/components/common/radar-chart';
import { Label } from '@/components/ui/label';

interface Props {
    companies: any[];
}

const CORE_PATTERNS = [
    'Arrays & Hashing',
    'Two Pointers',
    'Sliding Window',
    'Stack',
    'Binary Search',
    'Linked List',
    'Trees',
    'Backtracking',
    'Graphs',
    '1-D Dynamic Programming',
];

export function SkillMatch({ companies }: Props) {
    const [selectedCompanySlug, setSelectedCompanySlug] = useState('google');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [matchData, setMatchData] = useState<any | null>(null);

    const loadMatchData = async (slug: string) => {
        setIsRefreshing(true);

        try {
            const res = await fetch(`/api/companies/${slug}/match`);

            if (res.ok) {
                const data = await res.json();
                setMatchData(data);
            }
        } finally {
            setIsRefreshing(false);
        }
    };

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        if (selectedCompanySlug) {
            void loadMatchData(selectedCompanySlug);
        }
    }, [selectedCompanySlug]);

    const chartData = useMemo(() => {
        if (!matchData) {
            return {
                labels: [],
                primary: { label: 'You', data: [], color: '' },
                comparison: { label: '', data: [], color: '' },
            };
        }

        const patterns = matchData.company.patternFrequencies;
        const patternCounts = matchData.company.patternCounts;

        const patternsWithData = CORE_PATTERNS.filter((pattern) => {
            const userValue = matchData?.patterns[pattern]?.composite ?? 0;
            const companyValue = patterns[pattern] ?? 0;

            return userValue > 0 || companyValue > 0;
        });

        const userDataPoints = patternsWithData.map(
            (pattern) => matchData?.patterns[pattern]?.composite ?? 0,
        );
        const companyDataPoints = patternsWithData.map(
            (pattern) => patterns[pattern] ?? 0,
        );
        const companyCounts = patternsWithData.map(
            (pattern) => patternCounts[pattern] ?? 0,
        );
        const userCounts = patternsWithData.map(
            (pattern) => matchData?.patterns[pattern]?.userCount ?? 0,
        );

        return {
            labels: patternsWithData,
            primary: {
                label: 'You',
                data: userDataPoints,
                counts: userCounts,
                color: 'hsl(217, 91%, 60%)',
            },
            comparison: {
                label: matchData.company.name,
                data: companyDataPoints,
                counts: companyCounts,
                color: matchData.company.color || '#6366f1',
            },
        };
    }, [matchData]);

    return (
        <div className="flex h-full flex-col">
            <p className="mb-4 text-sm text-muted-foreground">
                Compare your skill profile against our estimated requirements
                for top tech companies.
            </p>
            {matchData && matchData.company.totalProblems && (
                <p className="mb-4 text-xs text-muted-foreground">
                    Pattern frequency shows what percentage of{' '}
                    {matchData.company.name}'s interview questions test each
                    pattern. Values are calculated from{' '}
                    {matchData.company.totalProblems} actual interview
                    questions.
                </p>
            )}

            <div className="mb-6 flex items-center gap-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="company-select">Target Company</Label>
                    <div className="flex items-center gap-2">
                        <select
                            id="company-select"
                            value={selectedCompanySlug}
                            onChange={(e) =>
                                setSelectedCompanySlug(e.target.value)
                            }
                            className="flex h-10 w-[240px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                        >
                            {companies.map((company) => (
                                <option key={company.slug} value={company.slug}>
                                    {company.name}
                                </option>
                            ))}
                        </select>
                        <button
                            className="rounded-md border border-input p-2 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
                            onClick={() => loadMatchData(selectedCompanySlug)}
                            disabled={isRefreshing}
                            aria-label="Refresh analysis"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            <div className="h-[320px] w-full">
                {isRefreshing ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        Loading company data...
                    </div>
                ) : chartData.labels.length > 0 ? (
                    <RadarChart
                        labels={chartData.labels}
                        primaryData={chartData.primary}
                        comparisonData={chartData.comparison}
                        totalQuestionsAnswered={
                            matchData?.user.totalAttempted ?? 0
                        }
                    />
                ) : !matchData ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        Select a company to see the comparison.
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        No data available for this company.
                    </div>
                )}
            </div>

            {matchData &&
                Object.keys(matchData.company.patternFrequencies).length >
                    0 && (
                    <div className="mt-auto pt-8">
                        <PatternFrequencyTable
                            patterns={matchData.company.patternFrequencies}
                            patternCounts={matchData.company.patternCounts}
                            totalProblems={matchData.company.totalProblems}
                            companyName={matchData.company.name}
                        />
                    </div>
                )}
        </div>
    );
}
