<?php

namespace App\Services;

use App\Models\Log;
use App\Models\Problem;
use Illuminate\Support\Collection;

class CompanyMatchScorer
{
    /**
     * @param  array<int, Problem>  $problems
     * @param  Collection<int, Log>  $userLogs
     * @return array<string, array{
     *     companyCount: int,
     *     companyDifficulty: array{Easy: int, Medium: int, Hard: int},
     *     userCount: int,
     *     userWeighted: float,
     *     userOptimal: int,
     *     userDifficulty: array{Easy: int, Medium: int, Hard: int},
     *     coverage: int,
     *     alignment: int,
     *     composite: int,
     *     mastery: int,
     *     gap: int,
     *     recency: int,
     *     level: string,
     * }>
     */
    public function computePatternMetrics(array $problems, Collection $userLogs): array
    {
        $summary = $this->summarizeCompanyPatterns($problems);
        $patterns = [];

        foreach ($summary['patternCounts'] as $pattern => $companyCount) {
            $patternProblems = [];

            foreach ($problems as $problem) {
                if (in_array($pattern, $problem->patterns ?? [], true)) {
                    $patternProblems[$problem->id] = $problem;
                }
            }

            $patternUserLogs = $userLogs->filter(
                static fn (Log $log): bool => isset($patternProblems[$log->problem_id])
            );
            $patternUserLogs = $patternUserLogs
                ->sortByDesc('timestamp')
                ->unique('problem_id')
                ->values();

            $userCount = $patternUserLogs->count();
            $userOptimal = $patternUserLogs->where('status', 'Optimal')->count();
            $userWeighted = $patternUserLogs->sum(static fn (Log $log): float => match ($log->status) {
                'Optimal' => 1,
                'Suboptimal' => 0.5,
                default => 0,
            });

            $companyDifficulty = ['Easy' => 0, 'Medium' => 0, 'Hard' => 0];
            foreach ($patternProblems as $problem) {
                $companyDifficulty[$problem->difficulty]++;
            }

            $userDifficulty = ['Easy' => 0, 'Medium' => 0, 'Hard' => 0];
            foreach ($patternUserLogs as $log) {
                $difficulty = $patternProblems[$log->problem_id]->difficulty;
                $userDifficulty[$difficulty]++;
            }

            $coverage = $companyCount > 0 ? (int) round(($userCount / $companyCount) * 100) : 0;
            $alignment = $companyCount > 0 ? (int) round(($userWeighted / $companyCount) * 100) : 0;
            $composite = (int) round(($coverage + $alignment) / 2);
            $mastery = $companyCount > 0 ? (int) round(($userOptimal / $companyCount) * 100) : 0;

            $patterns[$pattern] = [
                'companyCount' => $companyCount,
                'companyDifficulty' => $companyDifficulty,
                'userCount' => $userCount,
                'userWeighted' => $userWeighted,
                'userOptimal' => $userOptimal,
                'userDifficulty' => $userDifficulty,
                'coverage' => $coverage,
                'alignment' => $alignment,
                'composite' => $composite,
                'mastery' => $mastery,
                'gap' => max(0, 100 - $composite),
                'recency' => $patternUserLogs->isNotEmpty() ? 100 : 0,
                'level' => $this->resolveLevel($companyCount),
            ];
        }

        return $patterns;
    }

    /**
     * @param  array<int, Problem>  $problems
     * @return array{
     *     totalProblems: int,
     *     patternCounts: array<string, int>,
     *     patternPercentages: array<string, int>,
     *     patternDifficulty: array<string, array{Easy: int, Medium: int, Hard: int}>
     * }
     */
    public function summarizeCompanyPatterns(array $problems): array
    {
        $totalProblems = count($problems);
        $patternCounts = [];
        $patternDifficulty = [];

        foreach ($problems as $problem) {
            foreach ($problem->patterns ?? [] as $pattern) {
                $patternCounts[$pattern] = ($patternCounts[$pattern] ?? 0) + 1;
                $patternDifficulty[$pattern] ??= ['Easy' => 0, 'Medium' => 0, 'Hard' => 0];
                $patternDifficulty[$pattern][$problem->difficulty]++;
            }
        }

        $patternPercentages = [];

        foreach ($patternCounts as $pattern => $count) {
            $patternPercentages[$pattern] = $totalProblems > 0 ? (int) round(($count / $totalProblems) * 100) : 0;
        }

        return [
            'totalProblems' => $totalProblems,
            'patternCounts' => $patternCounts,
            'patternPercentages' => $patternPercentages,
            'patternDifficulty' => $patternDifficulty,
        ];
    }

    public function resolveLevel(int $companyCount): string
    {
        return match (true) {
            $companyCount <= 1 => 'beginner',
            $companyCount <= 3 => 'intermediate',
            default => 'advanced',
        };
    }
}
