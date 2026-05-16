<?php

namespace App\Http\Controllers;

use App\Models\Problem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LogbookController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $problemModels = Problem::query()
            ->orderBy('number')
            ->get();

        $selectedProblemId = $request->string('problemId')->toString();
        if ($selectedProblemId === '' || ! $problemModels->contains(static fn (Problem $problem): bool => $problem->id === $selectedProblemId)) {
            $selectedProblemId = null;
        }

        return Inertia::render('logbook', [
            'problems' => $problemModels
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
            'selectedProblemId' => $selectedProblemId,
            'logs' => $request->user()
                ? $request->user()->logs()->with('problem')->get()->map(static fn ($log) => [
                    'id' => $log->id,
                    'problem_id' => $log->problem_id,
                    'status' => $log->status,
                    'time_complexity' => $log->time_complexity,
                    'space_complexity' => $log->space_complexity,
                    'notes' => $log->notes,
                    'created_at' => $log->created_at,
                    'updated_at' => $log->updated_at,
                ])->all()
                : [],
        ]);
    }
}
