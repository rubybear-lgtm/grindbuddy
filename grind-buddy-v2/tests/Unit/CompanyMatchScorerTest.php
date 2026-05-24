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
    return new CompanyMatchScorer;
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

// I5: Monotonicity
it('I5: a user who solved more problems has a higher or equal composite than one who solved fewer', function () {
    $problems = makeProblems([
        ['id' => 'p1', 'difficulty' => 'Easy', 'patterns' => ['Trees']],
        ['id' => 'p2', 'difficulty' => 'Medium', 'patterns' => ['Trees']],
        ['id' => 'p3', 'difficulty' => 'Hard', 'patterns' => ['Trees']],
        ['id' => 'p4', 'difficulty' => 'Hard', 'patterns' => ['Trees']],
    ]);

    $logsTwo = makeLogs([
        ['problem_id' => 'p1', 'status' => 'Optimal', 'timestamp' => now()],
        ['problem_id' => 'p2', 'status' => 'Optimal', 'timestamp' => now()],
    ]);
    $logsThree = makeLogs([
        ['problem_id' => 'p1', 'status' => 'Optimal', 'timestamp' => now()],
        ['problem_id' => 'p2', 'status' => 'Optimal', 'timestamp' => now()],
        ['problem_id' => 'p3', 'status' => 'Optimal', 'timestamp' => now()],
    ]);

    $compositeTwo = scorer()->computePatternMetrics($problems, $logsTwo)['Trees']['composite'];
    $compositeThree = scorer()->computePatternMetrics($problems, $logsThree)['Trees']['composite'];

    expect($compositeThree)->toBeGreaterThanOrEqual($compositeTwo);
});

// I6: Quality ordering
it('I6: Optimal > Suboptimal > no logs in composite ordering', function () {
    $problems = makeProblems([
        ['id' => 'p1', 'difficulty' => 'Medium', 'patterns' => ['Graphs']],
        ['id' => 'p2', 'difficulty' => 'Medium', 'patterns' => ['Graphs']],
    ]);

    $logsOptimal = makeLogs([
        ['problem_id' => 'p1', 'status' => 'Optimal', 'timestamp' => now()],
        ['problem_id' => 'p2', 'status' => 'Optimal', 'timestamp' => now()],
    ]);
    $logsSuboptimal = makeLogs([
        ['problem_id' => 'p1', 'status' => 'Suboptimal', 'timestamp' => now()],
        ['problem_id' => 'p2', 'status' => 'Suboptimal', 'timestamp' => now()],
    ]);

    $compositeOptimal = scorer()->computePatternMetrics($problems, $logsOptimal)['Graphs']['composite'];
    $compositeSuboptimal = scorer()->computePatternMetrics($problems, $logsSuboptimal)['Graphs']['composite'];
    $compositeNone = scorer()->computePatternMetrics($problems, makeLogs([]))['Graphs']['composite'];

    expect($compositeOptimal)->toBeGreaterThan($compositeSuboptimal)
        ->and($compositeSuboptimal)->toBeGreaterThan($compositeNone);
});

// I7: Composite formula
it('I7: composite equals round((coverage + alignment) / 2)', function () {
    $problems = makeProblems([
        ['id' => 'p1', 'difficulty' => 'Easy', 'patterns' => ['Sliding Window']],
        ['id' => 'p2', 'difficulty' => 'Medium', 'patterns' => ['Sliding Window']],
        ['id' => 'p3', 'difficulty' => 'Hard', 'patterns' => ['Sliding Window']],
        ['id' => 'p4', 'difficulty' => 'Hard', 'patterns' => ['Sliding Window']],
    ]);

    $logs = makeLogs([
        ['problem_id' => 'p1', 'status' => 'Optimal', 'timestamp' => now()],
        ['problem_id' => 'p2', 'status' => 'Optimal', 'timestamp' => now()],
        ['problem_id' => 'p3', 'status' => 'Suboptimal', 'timestamp' => now()],
    ]);

    $result = scorer()->computePatternMetrics($problems, $logs)['Sliding Window'];

    expect($result['coverage'])->toBe(75)
        ->and($result['alignment'])->toBe(63)
        ->and($result['composite'])->toBe(69);
});

it('I8: coverage stays capped at 100 when a problem is logged twice', function () {
    $problems = makeProblems([
        ['id' => 'p1', 'difficulty' => 'Medium', 'patterns' => ['Backtracking']],
    ]);
    $logs = makeLogs([
        ['problem_id' => 'p1', 'status' => 'Suboptimal', 'timestamp' => now()->subDays(10)],
        ['problem_id' => 'p1', 'status' => 'Optimal', 'timestamp' => now()],
    ]);

    $result = scorer()->computePatternMetrics($problems, $logs)['Backtracking'];

    expect($result['coverage'])->toBe(100)
        ->and($result['alignment'])->toBe(100)
        ->and($result['mastery'])->toBe(100);
});

// S1: Recency blindness
it('S1: a user who practiced today scores identically to one who practiced 2 years ago (recency is binary)', function () {
    $problems = makeProblems([
        ['id' => 'p1', 'difficulty' => 'Medium', 'patterns' => ['Two Pointers']],
    ]);

    $recentLogs = makeLogs([
        ['problem_id' => 'p1', 'status' => 'Optimal', 'timestamp' => now()],
    ]);
    $staleLogs = makeLogs([
        ['problem_id' => 'p1', 'status' => 'Optimal', 'timestamp' => now()->subYears(2)],
    ]);

    $recentResult = scorer()->computePatternMetrics($problems, $recentLogs)['Two Pointers'];
    $staleResult = scorer()->computePatternMetrics($problems, $staleLogs)['Two Pointers'];

    expect($recentResult['recency'])->toBe(100)
        ->and($staleResult['recency'])->toBe(100)
        ->and($recentResult['composite'])->toBe($staleResult['composite']);
});

// S2: Difficulty blindness
it('S2: solving an Easy problem Optimally gives the same composite as solving a Hard problem Optimally', function () {
    $easyProblems = makeProblems([
        ['id' => 'easy-p1', 'difficulty' => 'Easy', 'patterns' => ['Easy Pattern']],
    ]);
    $hardProblems = makeProblems([
        ['id' => 'hard-p1', 'difficulty' => 'Hard', 'patterns' => ['Hard Pattern']],
    ]);

    $easyLogs = makeLogs([
        ['problem_id' => 'easy-p1', 'status' => 'Optimal', 'timestamp' => now()],
    ]);
    $hardLogs = makeLogs([
        ['problem_id' => 'hard-p1', 'status' => 'Optimal', 'timestamp' => now()],
    ]);

    $easyComposite = scorer()->computePatternMetrics($easyProblems, $easyLogs)['Easy Pattern']['composite'];
    $hardComposite = scorer()->computePatternMetrics($hardProblems, $hardLogs)['Hard Pattern']['composite'];

    expect($easyComposite)->toBe(100)
        ->and($hardComposite)->toBe(100)
        ->and($easyComposite)->toBe($hardComposite);
});

// S3: Suboptimal-only baseline
it('S3: all Suboptimal logs produce coverage=100 alignment=50 composite=75 mastery=0', function () {
    $problems = makeProblems([
        ['id' => 'p1', 'difficulty' => 'Easy', 'patterns' => ['Stack']],
        ['id' => 'p2', 'difficulty' => 'Medium', 'patterns' => ['Stack']],
        ['id' => 'p3', 'difficulty' => 'Hard', 'patterns' => ['Stack']],
        ['id' => 'p4', 'difficulty' => 'Hard', 'patterns' => ['Stack']],
    ]);
    $logs = makeLogs([
        ['problem_id' => 'p1', 'status' => 'Suboptimal', 'timestamp' => now()],
        ['problem_id' => 'p2', 'status' => 'Suboptimal', 'timestamp' => now()],
        ['problem_id' => 'p3', 'status' => 'Suboptimal', 'timestamp' => now()],
        ['problem_id' => 'p4', 'status' => 'Suboptimal', 'timestamp' => now()],
    ]);

    $result = scorer()->computePatternMetrics($problems, $logs)['Stack'];

    expect($result['coverage'])->toBe(100)
        ->and($result['alignment'])->toBe(50)
        ->and($result['composite'])->toBe(75)
        ->and($result['mastery'])->toBe(0);
});

// S4: Level reflects company, not user
it('S4: two users with opposite skill levels get the same level label because it derives from companyCount', function () {
    $problems = makeProblems([
        ['id' => 'p1', 'difficulty' => 'Easy', 'patterns' => ['Linked List']],
        ['id' => 'p2', 'difficulty' => 'Hard', 'patterns' => ['Linked List']],
    ]);

    $expertLogs = makeLogs([
        ['problem_id' => 'p1', 'status' => 'Optimal', 'timestamp' => now()],
        ['problem_id' => 'p2', 'status' => 'Optimal', 'timestamp' => now()],
    ]);

    $noviceResult = scorer()->computePatternMetrics($problems, makeLogs([]))['Linked List'];
    $expertResult = scorer()->computePatternMetrics($problems, $expertLogs)['Linked List'];

    expect($noviceResult['level'])->toBe('intermediate')
        ->and($expertResult['level'])->toBe('intermediate')
        ->and($noviceResult['level'])->toBe($expertResult['level']);
});

// S5: No overall score
it('S5: computePatternMetrics returns no top-level readiness or overall composite score', function () {
    $problems = makeProblems([
        ['id' => 'p1', 'difficulty' => 'Easy', 'patterns' => ['Arrays & Hashing']],
        ['id' => 'p2', 'difficulty' => 'Medium', 'patterns' => ['Trees']],
    ]);
    $logs = makeLogs([
        ['problem_id' => 'p1', 'status' => 'Optimal', 'timestamp' => now()],
    ]);

    $result = scorer()->computePatternMetrics($problems, $logs);

    expect($result)->not->toHaveKey('score')
        ->and($result)->not->toHaveKey('readiness')
        ->and($result)->not->toHaveKey('overallComposite');
});

// S6: Radar unit mismatch (documented via assertion comment)
it('S6: user composite and company patternFrequency are different quantities plotted on the same axis', function () {
    $allProblems = [];

    for ($i = 1; $i <= 10; $i++) {
        $allProblems[] = ['id' => "arrays-{$i}", 'difficulty' => 'Medium', 'patterns' => ['Arrays & Hashing']];
    }

    for ($i = 1; $i <= 10; $i++) {
        $allProblems[] = ['id' => "trees-{$i}", 'difficulty' => 'Medium', 'patterns' => ['Trees']];
    }

    $problems = makeProblems($allProblems);

    $logs = makeLogs(array_map(
        fn (int $i): array => ['problem_id' => "arrays-{$i}", 'status' => 'Optimal', 'timestamp' => now()],
        range(1, 8)
    ));

    $patternMetrics = scorer()->computePatternMetrics($problems, $logs);
    $summary = scorer()->summarizeCompanyPatterns($problems);

    $userComposite = $patternMetrics['Arrays & Hashing']['composite'];
    $companyFrequency = $summary['patternPercentages']['Arrays & Hashing'];

    expect($userComposite)->toBe(80)
        ->and($companyFrequency)->toBe(50)
        ->and($userComposite)->not->toBe($companyFrequency);
});
