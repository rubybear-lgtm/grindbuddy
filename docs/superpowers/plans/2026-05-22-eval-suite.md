# Eval Suite: CompanyMatch Ranking Algorithm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the CompanyMatch scoring logic into a testable service, then write an eval suite (invariants + flaw-exposure scenarios + integration tests) that characterizes the current algorithm's behavior and quantifies its baseline.

**Architecture:** `App\Services\CompanyMatchScorer` holds all scoring math extracted verbatim from the controller. `CompanyMatchController` becomes a thin adapter that loads DB data and delegates to the scorer. Unit tests call the scorer directly with in-memory model instances (no DB). Three integration tests use factories to cover the full HTTP stack.

**Tech Stack:** PHP 8.5, Laravel 13, Pest v4, Eloquent models (`Problem`, `Log`), `Illuminate\Support\Collection`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `app/Services/CompanyMatchScorer.php` | All scoring math: `computePatternMetrics`, `summarizeCompanyPatterns`, `resolveLevel` |
| Modify | `app/Http/Controllers/Api/CompanyMatchController.php` | Thin adapter — load DB data, delegate to scorer, return JSON |
| Create | `tests/Unit/CompanyMatchScorerTest.php` | Invariants I1–I8, flaw-exposure scenarios S1–S6 |
| Create | `tests/Feature/Api/CompanyMatchEvalTest.php` | Integration scenarios E1–E3 |
| Create | `docs/superpowers/specs/eval-baseline.md` | First run output — pass/fail counts and numeric outputs |

---

## Task 1: Create CompanyMatchScorer

**Files:**
- Create: `app/Services/CompanyMatchScorer.php`
- Test: `tests/Unit/CompanyMatchScorerTest.php` (smoke test only)

- [ ] **Step 1: Write a failing smoke test**

Create `tests/Unit/CompanyMatchScorerTest.php`:

```php
<?php

use App\Models\Log;
use App\Models\Problem;
use App\Services\CompanyMatchScorer;

it('can be instantiated', function () {
    expect(new CompanyMatchScorer())->toBeInstanceOf(CompanyMatchScorer::class);
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
php artisan test --compact tests/Unit/CompanyMatchScorerTest.php
```

Expected: FAIL — `App\Services\CompanyMatchScorer not found`

- [ ] **Step 3: Create the scorer**

Create `app/Services/CompanyMatchScorer.php`:

```php
<?php

namespace App\Services;

use App\Models\Log;
use App\Models\Problem;
use Illuminate\Support\Collection;

class CompanyMatchScorer
{
    /**
     * @param  array<int, Problem>  $problems
     * @param  Collection<int, Log>  $userLogs
     * @return array<string, array{
     *     companyCount: int,
     *     companyDifficulty: array{Easy: int, Medium: int, Hard: int},
     *     userCount: int,
     *     userWeighted: float,
     *     userOptimal: int,
     *     userDifficulty: array{Easy: int, Medium: int, Hard: int},
     *     coverage: int,
     *     alignment: int,
     *     composite: int,
     *     mastery: int,
     *     gap: int,
     *     recency: int,
     *     level: string,
     * }>
     */
    public function computePatternMetrics(array $problems, Collection $userLogs): array
    {
        $summary = $this->summarizeCompanyPatterns($problems);
        $patterns = [];

        foreach ($summary['patternCounts'] as $pattern => $companyCount) {
            $patternProblems = [];

            foreach ($problems as $problem) {
                if (in_array($pattern, $problem->patterns ?? [], true)) {
                    $patternProblems[$problem->id] = $problem;
                }
            }

            $patternUserLogs = $userLogs->filter(
                static fn (Log $log): bool => isset($patternProblems[$log->problem_id])
            );

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

        return $patterns;
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
    public function summarizeCompanyPatterns(array $problems): array
    {
        $totalProblems = count($problems);
        $patternCounts = [];
        $patternDifficulty = [];

        foreach ($problems as $problem) {
            foreach ($problem->patterns ?? [] as $pattern) {
                $patternCounts[$pattern] = ($patternCounts[$pattern] ?? 0) + 1;
                $patternDifficulty[$pattern] ??= ['Easy' => 0, 'Medium' => 0, 'Hard' => 0];
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

    public function resolveLevel(int $companyCount): string
    {
        return match (true) {
            $companyCount <= 1 => 'beginner',
            $companyCount <= 3 => 'intermediate',
            default => 'advanced',
        };
    }
}
```

- [ ] **Step 4: Run smoke test to confirm it passes**

```bash
php artisan test --compact tests/Unit/CompanyMatchScorerTest.php
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/Services/CompanyMatchScorer.php tests/Unit/CompanyMatchScorerTest.php
git commit -m "feat: extract CompanyMatchScorer service"
```

---

## Task 2: Wire controller to scorer

**Files:**
- Modify: `app/Http/Controllers/Api/CompanyMatchController.php`

- [ ] **Step 1: Replace controller body**

Replace the entire contents of `app/Http/Controllers/Api/CompanyMatchController.php` with:

```php
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
```

- [ ] **Step 2: Run existing company API tests to confirm no regression**

```bash
php artisan test --compact tests/Feature/Api/CompanyApiTest.php
```

Expected: All tests PASS

- [ ] **Step 3: Run Pint**

```bash
vendor/bin/pint --dirty --format agent
```

- [ ] **Step 4: Commit**

```bash
git add app/Http/Controllers/Api/CompanyMatchController.php
git commit -m "refactor: delegate CompanyMatchController scoring to CompanyMatchScorer"
```

---

## Task 3: Invariant tests I1–I4

**Files:**
- Modify: `tests/Unit/CompanyMatchScorerTest.php`

These four invariants test boundary conditions. All should pass against the current algorithm.

- [ ] **Step 1: Add helper functions and I1–I4 tests**

Replace `tests/Unit/CompanyMatchScorerTest.php` with:

```php
<?php

use App\Models\Log;
use App\Models\Problem;
use App\Services\CompanyMatchScorer;
use Illuminate\Support\Collection;

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
```

- [ ] **Step 2: Run I1–I4**

```bash
php artisan test --compact tests/Unit/CompanyMatchScorerTest.php
```

Expected: All PASS

- [ ] **Step 3: Commit**

```bash
git add tests/Unit/CompanyMatchScorerTest.php
git commit -m "test: add invariant tests I1-I4 for CompanyMatchScorer"
```

---

## Task 4: Invariant tests I5–I8

**Files:**
- Modify: `tests/Unit/CompanyMatchScorerTest.php`

I8 is expected to **fail** — it documents a real bug where repeated logs inflate coverage above 100.

- [ ] **Step 1: Append I5–I8 to the test file**

Add these tests at the bottom of `tests/Unit/CompanyMatchScorerTest.php`:

```php
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
    // Solve 3/4 problems, 2 Optimal + 1 Suboptimal
    // coverage = round(3/4 * 100) = 75
    // alignment = round((2*1 + 1*0.5) / 4 * 100) = round(62.5) = 63
    // composite = round((75 + 63) / 2) = round(69) = 69
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

// I8: Coverage cap — EXPECTED TO FAIL (documents a bug)
it('I8: coverage does not exceed 100 when a user has multiple logs for the same problem', function () {
    // companyCount = 1 problem; user has 2 logs for that same problem
    // Current algorithm: userCount = 2, coverage = round(2/1 * 100) = 200
    // This test documents the bug — it is expected to fail against the current algorithm
    $problems = makeProblems([
        ['id' => 'p1', 'difficulty' => 'Medium', 'patterns' => ['Backtracking']],
    ]);
    $logs = makeLogs([
        ['problem_id' => 'p1', 'status' => 'Optimal', 'timestamp' => now()->subDays(10)],
        ['problem_id' => 'p1', 'status' => 'Optimal', 'timestamp' => now()],
    ]);

    $result = scorer()->computePatternMetrics($problems, $logs)['Backtracking'];

    expect($result['coverage'])->toBeLessThanOrEqual(100);
})->todo('I8 FAILS: duplicate logs inflate coverage above 100 — companyCount=1, userCount=2, coverage=200');
```

- [ ] **Step 2: Run I5–I8**

```bash
php artisan test --compact tests/Unit/CompanyMatchScorerTest.php
```

Expected: I5, I6, I7 PASS. I8 is marked `todo` so it will show as skipped/pending — it documents the known bug without blocking CI.

- [ ] **Step 3: Commit**

```bash
git add tests/Unit/CompanyMatchScorerTest.php
git commit -m "test: add invariant tests I5-I8 (I8 marked todo — documents coverage inflation bug)"
```

---

## Task 5: Flaw-exposure scenarios S1–S3

**Files:**
- Modify: `tests/Unit/CompanyMatchScorerTest.php`

These tests assert the **current** algorithm behavior. They pass, but their assertions document flaws.

- [ ] **Step 1: Append S1–S3**

Add to the bottom of `tests/Unit/CompanyMatchScorerTest.php`:

```php
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

    // Both recency values are 100 — timestamp is never read
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

    // Both are 100 — difficulty has zero effect on any metric
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
```

- [ ] **Step 2: Run S1–S3**

```bash
php artisan test --compact tests/Unit/CompanyMatchScorerTest.php
```

Expected: All PASS (they document current behavior, not correct behavior)

- [ ] **Step 3: Commit**

```bash
git add tests/Unit/CompanyMatchScorerTest.php
git commit -m "test: add flaw-exposure scenarios S1-S3 (recency blindness, difficulty blindness, suboptimal baseline)"
```

---

## Task 6: Flaw-exposure scenarios S4–S6

**Files:**
- Modify: `tests/Unit/CompanyMatchScorerTest.php`

- [ ] **Step 1: Append S4–S6**

Add to the bottom of `tests/Unit/CompanyMatchScorerTest.php`:

```php
// S4: Level reflects company, not user
it('S4: two users with opposite skill levels get the same level label because it derives from companyCount', function () {
    $problems = makeProblems([
        ['id' => 'p1', 'difficulty' => 'Easy', 'patterns' => ['Linked List']],
        ['id' => 'p2', 'difficulty' => 'Hard', 'patterns' => ['Linked List']],
    ]);
    // companyCount=2 → level='intermediate' for ALL users

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

    // Result is keyed by pattern — there is no top-level score key
    expect($result)->not->toHaveKey('score')
        ->and($result)->not->toHaveKey('readiness')
        ->and($result)->not->toHaveKey('overallComposite');
});

// S6: Radar unit mismatch (documented via assertion comment)
it('S6: user composite and company patternFrequency are different quantities plotted on the same axis', function () {
    // Company: 10 Arrays problems out of 20 total → patternFrequency = 50
    // User: solved 8/10 Optimally → composite = 80
    // These numbers mean different things but the radar chart treats them as comparable

    $allProblems = [];

    // 10 Arrays & Hashing problems
    for ($i = 1; $i <= 10; $i++) {
        $allProblems[] = ['id' => "arrays-{$i}", 'difficulty' => 'Medium', 'patterns' => ['Arrays & Hashing']];
    }

    // 10 other problems (different pattern)
    for ($i = 1; $i <= 10; $i++) {
        $allProblems[] = ['id' => "trees-{$i}", 'difficulty' => 'Medium', 'patterns' => ['Trees']];
    }

    $problems = makeProblems($allProblems);

    // User solved 8/10 Arrays problems Optimally
    $logs = makeLogs(array_map(
        fn (int $i): array => ['problem_id' => "arrays-{$i}", 'status' => 'Optimal', 'timestamp' => now()],
        range(1, 8)
    ));

    $patternMetrics = scorer()->computePatternMetrics($problems, $logs);
    $summary = scorer()->summarizeCompanyPatterns($problems);

    $userComposite = $patternMetrics['Arrays & Hashing']['composite']; // 80: "80% of company's arrays problems covered well"
    $companyFrequency = $summary['patternPercentages']['Arrays & Hashing']; // 50: "50% of company's questions test this pattern"

    // The two values are semantically incomparable, but the radar chart plots them on the same axis
    expect($userComposite)->toBe(80)
        ->and($companyFrequency)->toBe(50)
        ->and($userComposite)->not->toBe($companyFrequency);
});
```

- [ ] **Step 2: Run S4–S6**

```bash
php artisan test --compact tests/Unit/CompanyMatchScorerTest.php
```

Expected: All PASS

- [ ] **Step 3: Commit**

```bash
git add tests/Unit/CompanyMatchScorerTest.php
git commit -m "test: add flaw-exposure scenarios S4-S6 (level label, no overall score, radar unit mismatch)"
```

---

## Task 7: Integration eval tests E1–E3

**Files:**
- Create: `tests/Feature/Api/CompanyMatchEvalTest.php`

- [ ] **Step 1: Write the integration eval tests**

Create `tests/Feature/Api/CompanyMatchEvalTest.php`:

```php
<?php

use App\Models\Company;
use App\Models\CompanyProblem;
use App\Models\Log;
use App\Models\Problem;
use App\Models\User;

// E1: Full expert — user solved all problems in all patterns Optimally
it('E1: full expert user gets composite=100 on all patterns', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create(['id' => 'eval-e1', 'slug' => 'eval-e1', 'name' => 'Eval E1']);

    // Pattern A: 2 problems
    $a1 = Problem::factory()->create(['id' => 'e1-a1', 'difficulty' => 'Easy', 'patterns' => ['Pattern A']]);
    $a2 = Problem::factory()->create(['id' => 'e1-a2', 'difficulty' => 'Hard', 'patterns' => ['Pattern A']]);

    // Pattern B: 2 problems
    $b1 = Problem::factory()->create(['id' => 'e1-b1', 'difficulty' => 'Medium', 'patterns' => ['Pattern B']]);
    $b2 = Problem::factory()->create(['id' => 'e1-b2', 'difficulty' => 'Hard', 'patterns' => ['Pattern B']]);

    // Pattern C: 2 problems
    $c1 = Problem::factory()->create(['id' => 'e1-c1', 'difficulty' => 'Easy', 'patterns' => ['Pattern C']]);
    $c2 = Problem::factory()->create(['id' => 'e1-c2', 'difficulty' => 'Medium', 'patterns' => ['Pattern C']]);

    foreach ([$a1, $a2, $b1, $b2, $c1, $c2] as $problem) {
        CompanyProblem::factory()->create(['company_id' => $company->id, 'problem_id' => $problem->id]);
        Log::factory()->create(['user_id' => $user->id, 'problem_id' => $problem->id, 'status' => 'Optimal', 'timestamp' => now()]);
    }

    $response = $this->actingAs($user)->getJson('/api/companies/eval-e1/match');

    $response->assertOk();

    expect($response->json('patterns.Pattern A.composite'))->toBe(100)
        ->and($response->json('patterns.Pattern B.composite'))->toBe(100)
        ->and($response->json('patterns.Pattern C.composite'))->toBe(100)
        ->and($response->json('user.totalAttempted'))->toBe(6);
});

// E2: Zero coverage — user solved nothing
it('E2: zero coverage user gets all-zero metrics and no division-by-zero errors', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create(['id' => 'eval-e2', 'slug' => 'eval-e2', 'name' => 'Eval E2']);

    $p1 = Problem::factory()->create(['id' => 'e2-p1', 'difficulty' => 'Easy', 'patterns' => ['Pattern A']]);
    $p2 = Problem::factory()->create(['id' => 'e2-p2', 'difficulty' => 'Hard', 'patterns' => ['Pattern A']]);

    CompanyProblem::factory()->create(['company_id' => $company->id, 'problem_id' => $p1->id]);
    CompanyProblem::factory()->create(['company_id' => $company->id, 'problem_id' => $p2->id]);

    $response = $this->actingAs($user)->getJson('/api/companies/eval-e2/match');

    $response->assertOk();

    expect($response->json('patterns.Pattern A.coverage'))->toBe(0)
        ->and($response->json('patterns.Pattern A.alignment'))->toBe(0)
        ->and($response->json('patterns.Pattern A.composite'))->toBe(0)
        ->and($response->json('patterns.Pattern A.mastery'))->toBe(0)
        ->and($response->json('patterns.Pattern A.gap'))->toBe(100)
        ->and($response->json('user.totalAttempted'))->toBe(0);
});

// E3: Multi-pattern partial — varying coverage per pattern
it('E3: per-pattern coverage is isolated correctly across patterns with varying user completion', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create(['id' => 'eval-e3', 'slug' => 'eval-e3', 'name' => 'Eval E3']);

    // Pattern A: 2 problems — user solved both
    $a1 = Problem::factory()->create(['id' => 'e3-a1', 'difficulty' => 'Medium', 'patterns' => ['Pattern A']]);
    $a2 = Problem::factory()->create(['id' => 'e3-a2', 'difficulty' => 'Medium', 'patterns' => ['Pattern A']]);

    // Pattern B: 2 problems — user solved one
    $b1 = Problem::factory()->create(['id' => 'e3-b1', 'difficulty' => 'Medium', 'patterns' => ['Pattern B']]);
    $b2 = Problem::factory()->create(['id' => 'e3-b2', 'difficulty' => 'Medium', 'patterns' => ['Pattern B']]);

    // Pattern C: 2 problems — user solved none
    $c1 = Problem::factory()->create(['id' => 'e3-c1', 'difficulty' => 'Medium', 'patterns' => ['Pattern C']]);
    $c2 = Problem::factory()->create(['id' => 'e3-c2', 'difficulty' => 'Medium', 'patterns' => ['Pattern C']]);

    foreach ([$a1, $a2, $b1, $b2, $c1, $c2] as $problem) {
        CompanyProblem::factory()->create(['company_id' => $company->id, 'problem_id' => $problem->id]);
    }

    // User: solved A fully, B partially, C not at all
    Log::factory()->create(['user_id' => $user->id, 'problem_id' => $a1->id, 'status' => 'Optimal', 'timestamp' => now()]);
    Log::factory()->create(['user_id' => $user->id, 'problem_id' => $a2->id, 'status' => 'Optimal', 'timestamp' => now()]);
    Log::factory()->create(['user_id' => $user->id, 'problem_id' => $b1->id, 'status' => 'Optimal', 'timestamp' => now()]);

    $response = $this->actingAs($user)->getJson('/api/companies/eval-e3/match');

    $response->assertOk();

    // Pattern A: 2/2 solved → coverage=100
    expect($response->json('patterns.Pattern A.coverage'))->toBe(100);

    // Pattern B: 1/2 solved → coverage=50
    expect($response->json('patterns.Pattern B.coverage'))->toBe(50);

    // Pattern C: 0/2 solved → coverage=0, but must still appear in patterns
    expect($response->json('patterns.Pattern C.coverage'))->toBe(0);
    expect($response->json('patterns'))->toHaveKey('Pattern C');
});
```

- [ ] **Step 2: Run E1–E3**

```bash
php artisan test --compact tests/Feature/Api/CompanyMatchEvalTest.php
```

Expected: All PASS

- [ ] **Step 3: Run Pint**

```bash
vendor/bin/pint --dirty --format agent
```

- [ ] **Step 4: Commit**

```bash
git add tests/Feature/Api/CompanyMatchEvalTest.php
git commit -m "test: add integration eval scenarios E1-E3 (full expert, zero coverage, multi-pattern partial)"
```

---

## Task 8: Run the full eval suite and record the baseline

**Files:**
- Create: `docs/superpowers/specs/eval-baseline.md`

- [ ] **Step 1: Run the complete eval suite and capture output**

```bash
php artisan test --compact tests/Unit/CompanyMatchScorerTest.php tests/Feature/Api/CompanyMatchEvalTest.php 2>&1 | tee /tmp/eval-baseline-run.txt
cat /tmp/eval-baseline-run.txt
```

- [ ] **Step 2: Write baseline doc**

Create `docs/superpowers/specs/eval-baseline.md` with the following structure, filling in the actual run date and output:

```markdown
# Eval Baseline — CompanyMatch Ranking Algorithm

**Run date:** 2026-05-22
**Algorithm version:** (paste the git SHA from `git rev-parse --short HEAD`)

## Run output

(paste the full output from the test run here)

## Summary

| Suite | Tests | Passed | Failed | Todo/Skipped |
|-------|-------|--------|--------|--------------|
| Unit invariants (I1–I8) | 8 | ? | ? | ? |
| Unit flaw scenarios (S1–S6) | 6 | ? | ? | ? |
| Integration (E1–E3) | 3 | ? | ? | ? |
| **Total** | **17** | **?** | **?** | **?** |

## Known flaw confirmations

| ID | Flaw | Confirmed |
|----|------|-----------|
| I8 | Coverage inflates above 100 on duplicate logs | todo (documents bug) |
| S1 | Recency is binary — timestamp ignored | ✓ both users get recency=100 |
| S2 | Difficulty not weighted — Easy == Hard | ✓ both composites are 100 |
| S3 | Suboptimal-only produces composite=75, mastery=0 | ✓ baseline value recorded |
| S4 | Level label ignores user performance | ✓ novice and expert both get 'intermediate' |
| S5 | No overall readiness score | ✓ no top-level score key in response |
| S6 | Radar axes are semantically incomparable | ✓ composite=80, patternFrequency=50 |

## Numeric outputs (S1–S6)

| Scenario | Key metric | Value |
|----------|-----------|-------|
| S1 recent user recency | recency | 100 |
| S1 stale user recency | recency | 100 |
| S2 easy composite | composite | 100 |
| S2 hard composite | composite | 100 |
| S3 all-suboptimal | coverage=100, alignment=50, composite=75, mastery=0 | — |
| S4 novice level | level | intermediate |
| S4 expert level | level | intermediate |
| S6 user composite | composite | 80 |
| S6 company frequency | patternFrequency | 50 |
```

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/eval-baseline.md
git commit -m "docs: record eval suite baseline for CompanyMatch ranking algorithm"
```
