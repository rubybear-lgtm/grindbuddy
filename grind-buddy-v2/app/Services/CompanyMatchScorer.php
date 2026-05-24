<?php

namespace App\Services;

use App\Models\Log;
use App\Models\Problem;
use Carbon\Carbon;
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

        $difficultyWeight = static fn (Problem $problem): float => match ($problem->difficulty) {
            'Hard' => 3.0,
            'Medium' => 2.0,
            default => 1.0,
        };

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

            $companyWeight = (float) array_sum(array_map($difficultyWeight, array_values($patternProblems)));

            $userCoverageWeight = $patternUserLogs->sum(
                static fn (Log $log): float => $difficultyWeight($patternProblems[$log->problem_id])
            );

            $userWeighted = $patternUserLogs->sum(
                static fn (Log $log): float => $difficultyWeight($patternProblems[$log->problem_id]) * match ($log->status) {
                    'Optimal' => 1.0,
                    'Suboptimal' => 0.5,
                    default => 0.0,
                }
            );

            $companyDifficulty = ['Easy' => 0, 'Medium' => 0, 'Hard' => 0];
            foreach ($patternProblems as $problem) {
                $companyDifficulty[$problem->difficulty]++;
            }

            $userDifficulty = ['Easy' => 0, 'Medium' => 0, 'Hard' => 0];
            foreach ($patternUserLogs as $log) {
                $difficulty = $patternProblems[$log->problem_id]->difficulty;
                $userDifficulty[$difficulty]++;
            }

            $coverage = $companyWeight > 0 ? (int) round(($userCoverageWeight / $companyWeight) * 100) : 0;
            $alignment = $companyWeight > 0 ? (int) round(($userWeighted / $companyWeight) * 100) : 0;
            $composite = (int) round(($coverage + $alignment) / 2);

            $userMasteryWeight = $patternUserLogs->where('status', 'Optimal')->sum(
                static fn (Log $log): float => $difficultyWeight($patternProblems[$log->problem_id])
            );
            $mastery = $companyWeight > 0 ? (int) round(($userMasteryWeight / $companyWeight) * 100) : 0;

            $recency = 0;
            if ($patternUserLogs->isNotEmpty()) {
                $lastTimestamp = $patternUserLogs->max('timestamp');
                if ($lastTimestamp !== null) {
                    $daysSince = Carbon::parse($lastTimestamp)->diffInDays(now());
                    // Full score within 30 days, linear decay to 0 at 365 days
                    $recency = (int) max(0, round(100 * max(0, 1 - ($daysSince / 365))));
                }
            }

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
                'recency' => $recency,
                'level' => $this->resolveUserLevel($composite),
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

    /**
     * @param  array<string, array{composite: int}>  $patternMetrics
     * @param  array<string, int>  $patternCounts
     */
    public function computeOverallReadiness(array $patternMetrics, array $patternCounts): int
    {
        $totalProblems = array_sum($patternCounts);
        if ($totalProblems === 0) {
            return 0;
        }

        $weightedSum = 0.0;
        foreach ($patternMetrics as $pattern => $metrics) {
            $weight = $patternCounts[$pattern] ?? 0;
            $weightedSum += $metrics['composite'] * $weight;
        }

        return (int) round($weightedSum / $totalProblems);
    }

    public function resolveUserLevel(int $composite): string
    {
        return match (true) {
            $composite >= 80 => 'expert',
            $composite >= 50 => 'proficient',
            $composite >= 20 => 'developing',
            default => 'beginner',
        };
    }
}
