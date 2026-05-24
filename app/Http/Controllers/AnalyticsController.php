<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Problem;
use Inertia\Inertia;
use Inertia\Response;

class AnalyticsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('analytics', [
            'companies' => Company::query()
                ->orderBy('name')
                ->get()
                ->map(static fn (Company $company): array => [
                    'id' => $company->id,
                    'name' => $company->name,
                    'slug' => $company->slug,
                    'color' => $company->color,
                ])
                ->all(),
            'problems' => Problem::query()
                ->orderBy('number')
                ->get()
                ->map(static fn (Problem $problem): array => [
                    'id' => $problem->id,
                    'number' => $problem->number,
                    'title' => $problem->title,
                    'difficulty' => $problem->difficulty,
                    'patterns' => $problem->patterns,
                    'neetcodeUrl' => $problem->neetcode_url,
                    'leetcodeUrl' => $problem->leetcode_url,
                ])
                ->all(),
            'logs' => request()->user() ? request()->user()->logs()->with('problem')->get()->map(static fn ($log) => [
                'id' => $log->id,
                'problem_id' => $log->problem_id,
                'status' => $log->status,
                'time_complexity' => $log->time_complexity,
                'space_complexity' => $log->space_complexity,
                'notes' => $log->notes,
                'timestamp' => $log->timestamp,
            ])->all() : [],
        ]);
    }

    public function skillMatchEval(): Response
    {
        return Inertia::render('analytics/skill-match-eval', [
            'companies' => Company::query()
                ->orderBy('name')
                ->get()
                ->map(static fn (Company $company): array => [
                    'id' => $company->id,
                    'name' => $company->name,
                    'slug' => $company->slug,
                    'color' => $company->color,
                ])
                ->all(),
        ]);
    }
}
