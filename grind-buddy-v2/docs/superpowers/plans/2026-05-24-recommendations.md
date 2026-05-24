# Recommendations Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface a ranked list of 5 problems the user should practice next for a target company, based on gap × emphasis × difficulty × recency.

**Architecture:** New `recommendProblems` method on `CompanyMatchScorer` (pure function, no DB). Controller calls it and replaces the existing `'recommendations' => []` placeholder. Frontend renders a compact ranked list in `skill-match.tsx` below the radar chart.

**Tech Stack:** PHP 8.5, Laravel 13, Pest v4, React 19, Tailwind CSS v4, Inertia v3.

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `app/Services/CompanyMatchScorer.php` | Add `recommendProblems` method |
| Modify | `app/Http/Controllers/Api/CompanyMatchController.php` | Call scorer, replace `[]` placeholder |
| Modify | `resources/js/components/analytics/skill-match.tsx` | Render recommendations section; round display scores |
| Modify | `tests/Unit/CompanyMatchScorerTest.php` | Unit tests for `recommendProblems` |
| Modify | `tests/Feature/Api/CompanyMatchEvalTest.php` | Integration assertions on `recommendations` key |

---

## Task 1: Unit tests for `recommendProblems`

**Files:**
- Modify: `tests/Unit/CompanyMatchScorerTest.php`

- [ ] **Step 1: Add six failing tests at the bottom of the file**

Open `tests/Unit/CompanyMatchScorerTest.php` and append these tests after the S6 test. The `makeProblems`, `makeLogs`, and `scorer` helpers are already defined at the top of the file.

```php
// Recommendations

it('R1: returns empty recommendations when all problems solved Optimally with fresh recency', function () {
    $problems = makeProblems([
        ['id' => 'p1', 'difficulty' => 'Hard', 'patterns' => ['DP'], 'title' => 'P1'],
        ['id' => 'p2', 'difficulty' => 'Medium', 'patterns' => ['DP'], 'title' => 'P2'],
    ]);
    $logs = makeLogs([
        ['problem_id' => 'p1', 'status' => 'Optimal', 'timestamp' => now()],
        ['problem_id' => 'p2', 'status' => 'Optimal', 'timestamp' => now()],
    ]);
    $metrics = scorer()->computePatternMetrics($problems, $logs);
    $summary = scorer()->summarizeCompanyPatterns($problems);

    $result = scorer()->recommendProblems($problems, $logs, $metrics, $summary['patternPercentages'], 'Google');

    expect($result)->toBeEmpty();
});

it('R2: returns unsolved problems sorted by priority (gap × emphasis × difficulty)', function () {
    // Pattern A: 1 Hard problem (50% emphasis). Pattern B: 1 Easy problem (50% emphasis).
    // Both unsolved → gap=100 for both patterns.
    // Hard A priority: 100 * (50/100) * 3 * 1.0 = 150
    // Easy B priority: 100 * (50/100) * 1 * 1.0 = 50
    $problems = makeProblems([
        ['id' => 'p1', 'difficulty' => 'Hard', 'patterns' => ['Pattern A'], 'title' => 'Hard A'],
        ['id' => 'p2', 'difficulty' => 'Easy', 'patterns' => ['Pattern B'], 'title' => 'Easy B'],
    ]);
    $logs = makeLogs([]);
    $metrics = scorer()->computePatternMetrics($problems, $logs);
    $summary = scorer()->summarizeCompanyPatterns($problems);

    $result = scorer()->recommendProblems($problems, $logs, $metrics, $summary['patternPercentages'], 'Google');

    expect($result)->toHaveCount(2)
        ->and($result[0]['problemId'])->toBe('p1')
        ->and($result[0]['status'])->toBe('unsolved')
        ->and($result[1]['problemId'])->toBe('p2')
        ->and($result[1]['status'])->toBe('unsolved');
});

it('R3: stale Optimal solve is boosted above unsolved via recency multiplier', function () {
    // Setup: 2 Medium problems in "Arrays". p1 solved Optimally 2 years ago (stale). p2 unsolved.
    // After scoring: recency=0, gap=70 (composite decayed to 30).
    // p1 (stale): priority = 70 * 1.0 * 2 * 2.0 = 280
    // p2 (unsolved): priority = 70 * 1.0 * 2 * 1.0 = 140
    $problems = makeProblems([
        ['id' => 'p1', 'difficulty' => 'Medium', 'patterns' => ['Arrays'], 'title' => 'P1'],
        ['id' => 'p2', 'difficulty' => 'Medium', 'patterns' => ['Arrays'], 'title' => 'P2'],
    ]);
    $logs = makeLogs([
        ['problem_id' => 'p1', 'status' => 'Optimal', 'timestamp' => now()->subYears(2)->toDateTimeString()],
    ]);
    $metrics = scorer()->computePatternMetrics($problems, $logs);
    $summary = scorer()->summarizeCompanyPatterns($problems);

    $result = scorer()->recommendProblems($problems, $logs, $metrics, $summary['patternPercentages'], 'Google');

    expect($result[0]['problemId'])->toBe('p1')
        ->and($result[0]['status'])->toBe('stale')
        ->and($result[1]['problemId'])->toBe('p2')
        ->and($result[1]['status'])->toBe('unsolved');
});

it('R4: suboptimal solved problem appears as a recommendation', function () {
    $problems = makeProblems([
        ['id' => 'p1', 'difficulty' => 'Hard', 'patterns' => ['DP'], 'title' => 'P1'],
    ]);
    $logs = makeLogs([
        ['problem_id' => 'p1', 'status' => 'Suboptimal', 'timestamp' => now()],
    ]);
    $metrics = scorer()->computePatternMetrics($problems, $logs);
    $summary = scorer()->summarizeCompanyPatterns($problems);

    $result = scorer()->recommendProblems($problems, $logs, $metrics, $summary['patternPercentages'], 'Google');

    expect($result)->toHaveCount(1)
        ->and($result[0]['status'])->toBe('suboptimal')
        ->and($result[0]['problemId'])->toBe('p1');
});

it('R5: respects the limit parameter', function () {
    $problems = makeProblems(
        array_map(
            fn (int $i): array => ['id' => "p{$i}", 'difficulty' => 'Medium', 'patterns' => ['Stack'], 'title' => "P{$i}"],
            range(1, 10)
        )
    );
    $logs = makeLogs([]);
    $metrics = scorer()->computePatternMetrics($problems, $logs);
    $summary = scorer()->summarizeCompanyPatterns($problems);

    $result = scorer()->recommendProblems($problems, $logs, $metrics, $summary['patternPercentages'], 'Google', 3);

    expect($result)->toHaveCount(3);
});

it('R6: skips problems with no pattern in patternMetrics', function () {
    $problems = makeProblems([
        ['id' => 'p1', 'difficulty' => 'Hard', 'patterns' => [], 'title' => 'P1'],
    ]);
    $logs = makeLogs([]);
    $metrics = scorer()->computePatternMetrics($problems, $logs);
    $summary = scorer()->summarizeCompanyPatterns($problems);

    $result = scorer()->recommendProblems($problems, $logs, $metrics, $summary['patternPercentages'], 'Google');

    expect($result)->toBeEmpty();
});
```

- [ ] **Step 2: Run tests — confirm all 6 new tests fail**

```bash
php artisan test --compact tests/Unit/CompanyMatchScorerTest.php
```

Expected: 6 new failures with "Call to undefined method" or similar. Existing tests still pass.

- [ ] **Step 3: Commit the failing tests**

```bash
git add tests/Unit/CompanyMatchScorerTest.php
git commit -m "test: add failing unit tests for recommendProblems (R1–R6)"
```

---

## Task 2: Implement `recommendProblems` in CompanyMatchScorer

**Files:**
- Modify: `app/Services/CompanyMatchScorer.php`

- [ ] **Step 1: Read the current scorer**

Open `app/Services/CompanyMatchScorer.php`. The class has three existing public methods: `computePatternMetrics`, `summarizeCompanyPatterns`, `computeOverallReadiness`, and `resolveUserLevel`. Add the new method after `computeOverallReadiness`.

- [ ] **Step 2: Add the `recommendProblems` method**

Insert after the closing `}` of `computeOverallReadiness` (before `resolveUserLevel`):

```php
/**
 * @param  array<int, Problem>  $problems
 * @param  Collection<int, Log>  $userLogs
 * @param  array<string, array{gap: int, recency: int}>  $patternMetrics
 * @param  array<string, int>  $patternPercentages
 * @return array<int, array{
 *     problemId: string,
 *     title: string,
 *     difficulty: string,
 *     pattern: string,
 *     status: string,
 *     reason: string,
 *     leetcodeUrl: string|null,
 *     neetcodeUrl: string|null,
 *     priority: float,
 * }>
 */
public function recommendProblems(
    array $problems,
    Collection $userLogs,
    array $patternMetrics,
    array $patternPercentages,
    string $companyName = '',
    int $limit = 5
): array {
    $latestLogByProblem = $userLogs
        ->sortByDesc('timestamp')
        ->unique('problem_id')
        ->keyBy('problem_id');

    $difficultyWeight = static fn (string $difficulty): float => match ($difficulty) {
        'Hard' => 3.0,
        'Medium' => 2.0,
        default => 1.0,
    };

    $recommendations = [];

    foreach ($problems as $problem) {
        $primaryPattern = $problem->patterns[0] ?? null;

        if ($primaryPattern === null || ! isset($patternMetrics[$primaryPattern])) {
            continue;
        }

        $metrics = $patternMetrics[$primaryPattern];
        $gap = $metrics['gap'];
        $recency = $metrics['recency'];
        $emphasis = $patternPercentages[$primaryPattern] ?? 0;

        /** @var Log|null $log */
        $log = $latestLogByProblem->get($problem->id);

        if ($log === null) {
            $status = 'unsolved';
            $recencyMultiplier = 1.0;
        } elseif ($log->status === 'Suboptimal') {
            $status = 'suboptimal';
            $recencyMultiplier = 1.0 + (1.0 - $recency / 100);
        } elseif ($log->status === 'Optimal' && $recency < 50) {
            $status = 'stale';
            $recencyMultiplier = 1.0 + (1.0 - $recency / 100);
        } else {
            continue;
        }

        $priority = $gap * ($emphasis / 100) * $difficultyWeight($problem->difficulty) * $recencyMultiplier;

        $gapDescriptor = match (true) {
            $gap >= 60 => 'High-gap pattern',
            $gap >= 30 => 'Partial gap',
            default => 'Refresh needed',
        };
        $companyLabel = $companyName !== '' ? " of {$companyName} interviews" : ' of interviews';
        $reason = "{$gapDescriptor} — {$emphasis}%{$companyLabel}";

        $recommendations[] = [
            'problemId'   => $problem->id,
            'title'       => $problem->title,
            'difficulty'  => $problem->difficulty,
            'pattern'     => $primaryPattern,
            'status'      => $status,
            'reason'      => $reason,
            'leetcodeUrl' => $problem->leetcode_url,
            'neetcodeUrl' => $problem->neetcode_url,
            'priority'    => $priority,
        ];
    }

    usort($recommendations, static function (array $a, array $b) use ($difficultyWeight): int {
        $byPriority = $b['priority'] <=> $a['priority'];
        if ($byPriority !== 0) {
            return $byPriority;
        }

        return $difficultyWeight($b['difficulty']) <=> $difficultyWeight($a['difficulty']);
    });

    return array_slice($recommendations, 0, $limit);
}
```

- [ ] **Step 3: Run tests — confirm R1–R6 pass**

```bash
php artisan test --compact tests/Unit/CompanyMatchScorerTest.php
```

Expected: all tests pass (previously failing R1–R6 now green).

- [ ] **Step 4: Run pint**

```bash
vendor/bin/pint --dirty --format agent
```

- [ ] **Step 5: Commit**

```bash
git add app/Services/CompanyMatchScorer.php
git commit -m "feat: add recommendProblems scorer method (gap × emphasis × difficulty × recency)"
```

---

## Task 3: Wire controller + integration test assertions

**Files:**
- Modify: `app/Http/Controllers/Api/CompanyMatchController.php`
- Modify: `tests/Feature/Api/CompanyMatchEvalTest.php`

- [ ] **Step 1: Update integration tests first**

Open `tests/Feature/Api/CompanyMatchEvalTest.php`.

In the **E1** test (full expert, all fresh Optimal), add after the existing assertions:

```php
->and($response->json('recommendations'))->toBeArray()
->and($response->json('recommendations'))->toBeEmpty();
```

In the **E2** test (zero coverage), add after the existing assertions:

```php
->and($response->json('recommendations'))->toBeArray()
->and(count($response->json('recommendations')))->toBeGreaterThan(0)
->and($response->json('recommendations.0.status'))->toBe('unsolved')
->and($response->json('recommendations.0'))->toHaveKeys(['title', 'difficulty', 'pattern', 'status', 'reason', 'priority']);
```

- [ ] **Step 2: Run integration tests — confirm new assertions fail**

```bash
php artisan test --compact tests/Feature/Api/CompanyMatchEvalTest.php
```

Expected: E1 and E2 fail on the new `recommendations` assertions (the key exists but is `[]`).

- [ ] **Step 3: Update the controller**

Open `app/Http/Controllers/Api/CompanyMatchController.php`. Find the line:

```php
'recommendations' => [],
```

Replace the entire `return response()->json([...])` block so it reads:

```php
$recommendations = $this->scorer->recommendProblems(
    $problems,
    $userLogs,
    $patterns,
    $summary['patternPercentages'],
    $companyModel->name
);

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
        'overallReadiness' => $overall,
        'patternReadiness' => array_map(
            static fn (array $m): int => $m['composite'],
            $patterns
        ),
    ],
    'patterns' => $patterns,
    'recommendations' => $recommendations,
]);
```

- [ ] **Step 4: Run all tests**

```bash
php artisan test --compact tests/Unit/CompanyMatchScorerTest.php tests/Feature/Api/CompanyMatchEvalTest.php
```

Expected: all tests pass.

- [ ] **Step 5: Run pint**

```bash
vendor/bin/pint --dirty --format agent
```

- [ ] **Step 6: Commit**

```bash
git add app/Http/Controllers/Api/CompanyMatchController.php tests/Feature/Api/CompanyMatchEvalTest.php
git commit -m "feat: wire recommendProblems into CompanyMatchController response"
```

---

## Task 4: Frontend — recommendations section + display rounding

**Files:**
- Modify: `resources/js/components/analytics/skill-match.tsx`

- [ ] **Step 1: Read the current component**

Open `resources/js/components/analytics/skill-match.tsx`. The structure is:
- Company selector + refresh button
- Radar chart (320px height)
- Pattern frequency table (at the bottom via `mt-auto pt-8`)

The recommendations section goes between the radar chart and the pattern frequency table.

- [ ] **Step 2: Add `roundToNearest5` helper and apply to chart data**

Near the top of the `useMemo` block (after the `if (!matchData)` guard), add the helper:

```ts
const roundToNearest5 = (n: number) => Math.round(n / 5) * 5;
```

Apply it when constructing `userDataPoints`:

```ts
const userDataPoints = patternsWithData.map(
    (pattern) => roundToNearest5(patternReadiness[pattern] ?? 0),
);
```

Leave `companyDataPoints` unrounded — interview frequency percentages are categorical labels, not performance scores.

- [ ] **Step 3: Add the recommendations section**

In the JSX return, between the radar chart `div` and the pattern frequency table `div`, add:

```tsx
{matchData && (
    <div className="mt-8">
        <h3 className="mb-3 font-outfit text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Recommended Practice
        </h3>
        {matchData.recommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
                Nothing urgent — you're covering this company well.
            </p>
        ) : (
            <ol className="space-y-2">
                {matchData.recommendations.map(
                    (rec: {
                        problemId: string;
                        title: string;
                        difficulty: string;
                        pattern: string;
                        status: string;
                        reason: string;
                        leetcodeUrl: string | null;
                        neetcodeUrl: string | null;
                    }, i: number) => (
                        <li
                            key={rec.problemId}
                            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                        >
                            <span className="w-4 shrink-0 text-xs tabular-nums text-muted-foreground">
                                {i + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                                <a
                                    href={rec.leetcodeUrl ?? rec.neetcodeUrl ?? '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block truncate text-sm font-medium hover:underline"
                                >
                                    {rec.title}
                                </a>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {rec.reason}
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <span
                                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                                        rec.difficulty === 'Hard'
                                            ? 'bg-red-500/10 text-red-500'
                                            : rec.difficulty === 'Medium'
                                              ? 'bg-amber-500/10 text-amber-500'
                                              : 'bg-green-500/10 text-green-500'
                                    }`}
                                >
                                    {rec.difficulty}
                                </span>
                                <span
                                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                                        rec.status === 'unsolved'
                                            ? 'bg-primary/10 text-primary'
                                            : rec.status === 'suboptimal'
                                              ? 'bg-amber-500/10 text-amber-500'
                                              : 'bg-orange-500/10 text-orange-500'
                                    }`}
                                >
                                    {rec.status === 'unsolved'
                                        ? 'New'
                                        : rec.status === 'suboptimal'
                                          ? 'Revisit'
                                          : 'Stale'}
                                </span>
                            </div>
                        </li>
                    ),
                )}
            </ol>
        )}
    </div>
)}
```

- [ ] **Step 4: Verify the structure is correct**

The final JSX order inside the `return` should be:

1. Description paragraph
2. Company selector + refresh button
3. Radar chart div (320px)
4. **Recommendations section (new)**
5. Pattern frequency table (`mt-auto pt-8`)

- [ ] **Step 5: Run the full backend test suite**

```bash
php artisan test --compact
```

Expected: all tests pass. (Frontend changes have no backend tests.)

- [ ] **Step 6: Commit**

```bash
git add resources/js/components/analytics/skill-match.tsx
git commit -m "feat: add recommendations section to skill-match panel; round display scores to nearest 5"
```

---

## Verification

```bash
# Full suite
php artisan test --compact

# Targeted eval + unit
php artisan test --compact tests/Unit/CompanyMatchScorerTest.php tests/Feature/Api/CompanyMatchEvalTest.php
```

Expected: all tests pass. Then start the dev server (`composer run dev`) and open the analytics page — select a company with incomplete coverage to see the recommendations list, and one where you've solved everything freshly to see the empty state.
