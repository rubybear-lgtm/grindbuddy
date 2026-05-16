<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ProblemMatchResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProblemMatchController extends Controller
{
    public function __construct(private ProblemMatchResolver $resolver) {}

    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'source' => ['required', 'string', Rule::in(['leetcode', 'neetcode'])],
            'url' => ['required', 'string'],
            'title' => ['nullable', 'string'],
            'number' => ['nullable', 'integer'],
            'slug' => ['nullable', 'string'],
        ]);

        return response()->json(
            $this->resolver->resolve($validated, $request->user()),
        );
    }
}
