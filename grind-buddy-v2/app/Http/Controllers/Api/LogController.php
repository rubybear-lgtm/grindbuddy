<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Log;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

class LogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $logs = Log::query()
            ->with('problem')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('timestamp')
            ->get()
            ->map(static fn (Log $log): array => [
                'id' => $log->id,
                'problemId' => $log->problem->id,
                'status' => $log->status,
                'timeComplexity' => $log->time_complexity,
                'spaceComplexity' => $log->space_complexity,
                'notes' => $log->notes,
                'timestamp' => $log->timestamp?->toJSON(),
            ])
            ->all();

        return response()->json($logs);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'problemId' => ['required', 'string', 'exists:problems,id'],
            'status' => ['required', 'string'],
            'timeComplexity' => ['nullable', 'string'],
            'spaceComplexity' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $log = Log::query()->create([
            'id' => (string) Str::uuid(),
            'user_id' => $request->user()->id,
            'problem_id' => $validated['problemId'],
            'status' => $validated['status'],
            'time_complexity' => $validated['timeComplexity'] ?? null,
            'space_complexity' => $validated['spaceComplexity'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'timestamp' => now(),
        ]);

        $log->load('problem');

        return response()->json([
            'success' => true,
            'log' => [
                'id' => $log->id,
                'problemId' => $log->problem->id,
                'status' => $log->status,
                'timeComplexity' => $log->time_complexity,
                'spaceComplexity' => $log->space_complexity,
                'notes' => $log->notes,
                'timestamp' => $log->timestamp?->toJSON(),
            ],
        ]);
    }

    public function update(Request $request, Log $log): JsonResponse
    {
        if ($request->user()->id !== $log->user_id) {
            abort(404);
        }

        $validated = $request->validate([
            'status' => ['required', 'string'],
            'timeComplexity' => ['nullable', 'string'],
            'spaceComplexity' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $log->update([
            'status' => $validated['status'],
            'time_complexity' => $validated['timeComplexity'] ?? null,
            'space_complexity' => $validated['spaceComplexity'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json(['success' => true]);
    }

    public function destroy(Request $request, Log $log): Response
    {
        if ($request->user()->id !== $log->user_id) {
            abort(404);
        }

        $log->delete();

        return response()->noContent();
    }
}
