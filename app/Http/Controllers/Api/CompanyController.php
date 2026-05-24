<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Problem;
use Illuminate\Http\JsonResponse;

class CompanyController extends Controller
{
    public function index(): JsonResponse
    {
        $companies = Company::query()
            ->orderBy('name')
            ->get()
            ->map(static fn (Company $company): array => [
                'id' => $company->id,
                'name' => $company->name,
                'slug' => $company->slug,
                'color' => $company->color,
            ])
            ->all();

        return response()->json($companies);
    }

    public function show(string $company): JsonResponse
    {
        $companyModel = Company::query()
            ->with('problems')
            ->where('slug', $company)
            ->first();

        if (! $companyModel) {
            return response()->json(['error' => 'Company not found'], 404);
        }

        $summary = $this->summarizeCompanyPatterns($companyModel->problems->all());

        return response()->json([
            'id' => $companyModel->id,
            'name' => $companyModel->name,
            'slug' => $companyModel->slug,
            'color' => $companyModel->color,
            'patterns' => $summary['patternPercentages'],
            'patternCounts' => $summary['patternCounts'],
            'patternDifficulty' => $summary['patternDifficulty'],
            'totalProblems' => $summary['totalProblems'],
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
}
