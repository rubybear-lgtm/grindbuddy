<?php

namespace App\Http\Controllers;

use App\Models\Problem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProblemController extends Controller
{
    public function show(Request $request, Problem $problem): Response
    {
        $problem->load('companies');

        $logs = $request->user()
            ? $request->user()
                ->logs()
                ->where('problem_id', $problem->id)
                ->orderByDesc('created_at')
                ->get()
                ->map(static fn ($log) => [
                    'id' => $log->id,
                    'status' => $log->status,
                    'time_complexity' => $log->time_complexity,
                    'space_complexity' => $log->space_complexity,
                    'notes' => $log->notes,
                    'created_at' => $log->created_at,
                ])->all()
            : [];

        return Inertia::render('problem', [
            'problem' => [
                'id' => $problem->id,
                'number' => $problem->number,
                'title' => $problem->title,
                'difficulty' => $problem->difficulty,
                'patterns' => $problem->patterns,
                'neetcodeUrl' => $problem->neetcode_url,
                'leetcodeUrl' => $problem->leetcode_url,
                'companies' => $problem->companies->map(static fn ($company) => [
                    'id' => $company->id,
                    'name' => $company->name,
                    'slug' => $company->slug,
                    'frequency' => $company->pivot->frequency,
                    'timeframe' => $company->pivot->timeframe,
                ])->all(),
            ],
            'logs' => $logs,
        ]);
    }
}
