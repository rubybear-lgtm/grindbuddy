<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Log;
use App\Services\CompanyMatchScorer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyMatchController extends Controller
{
    public function __construct(private readonly CompanyMatchScorer $scorer) {}

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
        $summary = $this->scorer->summarizeCompanyPatterns($problems);

        $problemIds = array_map(static fn ($problem): string => $problem->id, $problems);
        $userLogs = Log::query()
            ->with('problem')
            ->where('user_id', $user->id)
            ->whereIn('problem_id', $problemIds)
            ->get();

        $patterns = $this->scorer->computePatternMetrics($problems, $userLogs);

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
}
