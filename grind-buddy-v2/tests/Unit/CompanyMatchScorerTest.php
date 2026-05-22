<?php

use App\Models\Log;
use App\Models\Problem;
use App\Services\CompanyMatchScorer;
use Illuminate\Support\Collection;
use Tests\TestCase;

uses(TestCase::class);

function makeProblems(array $specs): array
{
    return array_map(fn (array $spec): Problem => Problem::make($spec), $specs);
}

/**
 * @param  array<int, array<string, mixed>>  $specs
 * @return Collection<int, Log>
 */
function makeLogs(array $specs): Collection
{
    return collect(array_map(fn (array $spec): Log => Log::make($spec), $specs));
}

function scorer(): CompanyMatchScorer
{
    return new CompanyMatchScorer();
}

it('can be instantiated', function () {
    expect(scorer())->toBeInstanceOf(CompanyMatchScorer::class);
});

// I1: Zero baseline
it('I1: returns zero metrics when the user has no logs', function () {
    $problems = makeProblems([
        ['id' => 'p1', 'difficulty' => 'Easy', 'patterns' => ['Arrays & Hashing']],
        ['id' => 'p2', 'difficulty' => 'Medium', 'patterns' => ['Arrays & Hashing']],
    ]);

    $result = scorer()->computePatternMetrics($problems, makeLogs([]));

    expect($result['Arrays & Hashing']['coverage'])->toBe(0)
        ->and($result['Arrays & Hashing']['alignment'])->toBe(0)
        ->and($result['Arrays & Hashing']['composite'])->toBe(0)
        ->and($result['Arrays & Hashing']['mastery'])->toBe(0)
        ->and($result['Arrays & Hashing']['recency'])->toBe(0);
});

// I2: Full coverage ceiling
it('I2: returns 100 for coverage, alignment, and mastery when user solved all problems optimally', function () {
    $problems = makeProblems([
        ['id' => 'p1', 'difficulty' => 'Easy', 'patterns' => ['Arrays & Hashing']],
        ['id' => 'p2', 'difficulty' => 'Medium', 'patterns' => ['Arrays & Hashing']],
        ['id' => 'p3', 'difficulty' => 'Hard', 'patterns' => ['Arrays & Hashing']],
    ]);
    $logs = makeLogs([
        ['problem_id' => 'p1', 'status' => 'Optimal', 'timestamp' => now()],
        ['problem_id' => 'p2', 'status' => 'Optimal', 'timestamp' => now()],
        ['problem_id' => 'p3', 'status' => 'Optimal', 'timestamp' => now()],
    ]);

    $result = scorer()->computePatternMetrics($problems, $logs);

    expect($result['Arrays & Hashing']['coverage'])->toBe(100)
        ->and($result['Arrays & Hashing']['alignment'])->toBe(100)
        ->and($result['Arrays & Hashing']['mastery'])->toBe(100);
});

// I3: Composite is always in [0, 100]
it('I3: composite is always between 0 and 100 inclusive', function (array $logSpecs, int $problemCount) {
    $problems = makeProblems(
        array_map(fn (int $i): array => ['id' => "p{$i}", 'difficulty' => 'Medium', 'patterns' => ['Stack']], range(1, $problemCount))
    );

    $result = scorer()->computePatternMetrics($problems, makeLogs($logSpecs));

    expect($result['Stack']['composite'])->toBeGreaterThanOrEqual(0)->toBeLessThanOrEqual(100);
})->with([
    'no logs' => [[], 3],
    'partial optimal' => [[['problem_id' => 'p1', 'status' => 'Optimal', 'timestamp' => now()]], 3],
    'full optimal' => [
        [
            ['problem_id' => 'p1', 'status' => 'Optimal', 'timestamp' => now()],
            ['problem_id' => 'p2', 'status' => 'Optimal', 'timestamp' => now()],
            ['problem_id' => 'p3', 'status' => 'Optimal', 'timestamp' => now()],
        ],
        3,
    ],
    'all suboptimal' => [
        [
            ['problem_id' => 'p1', 'status' => 'Suboptimal', 'timestamp' => now()],
            ['problem_id' => 'p2', 'status' => 'Suboptimal', 'timestamp' => now()],
        ],
        3,
    ],
]);

// I4: Gap correctness
it('I4: gap equals max(0, 100 - composite) for any input', function () {
    $problems = makeProblems([
        ['id' => 'p1', 'difficulty' => 'Easy', 'patterns' => ['Binary Search']],
        ['id' => 'p2', 'difficulty' => 'Medium', 'patterns' => ['Binary Search']],
        ['id' => 'p3', 'difficulty' => 'Hard', 'patterns' => ['Binary Search']],
        ['id' => 'p4', 'difficulty' => 'Hard', 'patterns' => ['Binary Search']],
    ]);
    $logs = makeLogs([
        ['problem_id' => 'p1', 'status' => 'Optimal', 'timestamp' => now()],
        ['problem_id' => 'p2', 'status' => 'Suboptimal', 'timestamp' => now()],
    ]);

    $result = scorer()->computePatternMetrics($problems, $logs);
    $composite = $result['Binary Search']['composite'];
    $gap = $result['Binary Search']['gap'];

    expect($gap)->toBe(max(0, 100 - $composite));
});
