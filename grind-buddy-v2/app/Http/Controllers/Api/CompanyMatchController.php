<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Log;
use App\Models\Problem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyMatchController extends Controller
{
    public function __invoke(Request $request, string $company): JsonResponse
    {
        $companyModel = Company::query()
            ->with('problems')
            ->where('slug', $company)
            ->first();

        if (! $companyModel) {
            return response()->json(['error' => 'Company not found'], 404);
        }

        $user = $request->user();
        $problems = $companyModel->problems->all();
        $summary = $this->summarizeCompanyPatterns($problems);

        $problemIds = array_map(static fn ($problem): string => $problem->id, $problems);
        $userLogs = Log::query()
            ->with('problem')
            ->where('user_id', $user->id)
            ->whereIn('problem_id', $problemIds)
            ->get();

        $patterns = [];

        foreach ($summary['patternCounts'] as $pattern => $companyCount) {
            $patternProblems = [];

            foreach ($problems as $problem) {
                if (in_array($pattern, $problem->patterns ?? [], true)) {
                    $patternProblems[$problem->id] = $problem;
                }
            }

            $patternUserLogs = $userLogs->filter(static fn (Log $log): bool => isset($patternProblems[$log->problem_id]));
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

        return response()->json([
            'company' => [
                'slug' => $companyModel->slug,
                'name' => $companyModel->name,
                'color' => $companyModel->color ?? '#6366f1',
                'totalProblems' => $summary['totalProblems'],
                'patternFrequencies' => $summary['patternPercentages'],
                'patternCounts' => $summary['patternCounts'],
                'patternDifficulty' => $summary['patternDifficulty'],
            ],
            'user' => [
                'totalAttempted' => $userLogs->count(),
            ],
            'patterns' => $patterns,
            'recommendations' => [],
        ]);
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
    private function summarizeCompanyPatterns(array $problems): array
    {
        $totalProblems = count($problems);
        $patternCounts = [];
        $patternDifficulty = [];

        foreach ($problems as $problem) {
            foreach ($problem->patterns ?? [] as $pattern) {
                $patternCounts[$pattern] = ($patternCounts[$pattern] ?? 0) + 1;
                $patternDifficulty[$pattern] ??= [
                    'Easy' => 0,
                    'Medium' => 0,
                    'Hard' => 0,
                ];
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

    private function resolveLevel(int $companyCount): string
    {
        return match (true) {
            $companyCount <= 1 => 'beginner',
            $companyCount <= 3 => 'intermediate',
            default => 'advanced',
        };
    }
}
