# Eval Suite: CompanyMatch Ranking Algorithm

**Date:** 2026-05-22
**Goal:** Expose existing flaws in the user/company comparison ranking algorithm and establish a quantified baseline for future changes.

---

## Context

The ranking algorithm lives in `App\Http\Controllers\Api\CompanyMatchController`. It computes per-pattern metrics comparing a user's log history against a company's interview problem set. The known flaws identified before this eval suite was designed:

- Recency is binary (`100` if any logs exist, `0` otherwise — timestamp is ignored)
- Difficulty is not weighted in any score
- `level` reflects company problem count, not user readiness
- No overall match score (no single readiness %)
- Radar chart plots user `composite` (performance score) against company `patternFrequencies` (interview frequency %) on the same axis — semantically incompatible units

---

## Architecture

### Layer 1 — Unit eval

**File:** `tests/Unit/CompanyMatchScorerTest.php`

The scoring math is extracted from `CompanyMatchController` into `App\Services\CompanyMatchScorer`. The scorer is a pure value object: given company problems + user logs as PHP arrays, it returns metrics. No DB dependency.

`CompanyMatchController` becomes a thin adapter: load data from DB, hand arrays to `CompanyMatchScorer`, return the result.

### Layer 2 — Integration eval

**File:** `tests/Feature/Api/CompanyMatchEvalTest.php`

Factory-seeded scenarios hitting the real `/api/companies/{slug}/match` endpoint as an authenticated user. Validates query correctness, pivot loading, and end-to-end response shape.

### Baseline output

**File:** `docs/superpowers/specs/eval-baseline.md`

Committed snapshot of the first eval run: which invariants pass, which flaw scenarios are confirmed, and exact numeric outputs per scenario.

---

## Scorer interface

```php
// App\Services\CompanyMatchScorer

public function computePatternMetrics(array $problems, Collection $userLogs): array
public function summarizeCompanyPatterns(array $problems): array
public function resolveLevel(int $companyCount): string
```

`$problems` is an array of `Problem` model instances. `$userLogs` is an Eloquent collection of `Log` instances with their `problem` relation loaded.

---

## Invariants (I1–I8)

Universal properties that must always hold. Each is a parameterized unit test asserting a numeric output for a given synthetic input.

| ID | Invariant | Input | Expected |
|----|-----------|-------|----------|
| I1 | Zero baseline | Company has 4 problems in a pattern; user has 0 logs | coverage=0, alignment=0, composite=0, mastery=0, recency=0 |
| I2 | Full coverage ceiling | Company has 4 problems in a pattern; user solved all 4 Optimally | coverage=100, alignment=100, mastery=100 |
| I3 | Composite bounds | Any input | composite always in [0, 100] |
| I4 | Gap correctness | Any input | gap = max(0, 100 − composite) |
| I5 | Monotonicity | User A solved 2/4 problems; User B solved 3/4 (same quality) | composite(B) > composite(A) |
| I6 | Quality ordering | User A solved 2 Optimal; User B solved 2 Suboptimal; User C solved 0 | composite(A) > composite(B) > composite(C) |
| I7 | Composite formula | Any input with known coverage and alignment | composite = round((coverage + alignment) / 2) |
| I8 | Coverage cap | `companyCount=1`; user has 2 logs for the same problem (repeated attempts) | coverage ≤ 100 — repeated logs for one problem must not inflate coverage past the company problem count |

---

## Flaw-Exposure Scenarios (S1–S6)

Characterization tests asserting the **current** algorithm behavior. Failing or counterintuitive results are the baseline evidence of flaws.

### S1 — Recency blindness

**Setup:** Company has 1 problem in a pattern. Two users each have 1 Optimal log for that problem. User A's log timestamp is `now()`. User B's log timestamp is `now()->subYears(2)`.

**Expected current output:** `recency=100` for both; identical `composite` for both.

**Flaw documented:** Recency is binary — the `timestamp` field on `Log` is never read by the scorer.

---

### S2 — Difficulty blindness

**Setup:** Company has 1 Easy problem and 1 Hard problem in separate patterns, 1 problem each. User A solved the Easy Optimally. User B solved the Hard Optimally.

**Expected current output:** Both get `coverage=100`, `alignment=100`, `composite=100`.

**Flaw documented:** Difficulty is not weighted. Easy Optimal == Hard Optimal in every metric.

---

### S3 — Suboptimal-only baseline

**Setup:** Company has 4 problems in a pattern. User solved all 4 with status `Suboptimal`.

**Expected current output:** `coverage=100`, `alignment=50`, `composite=75`, `mastery=0`.

**Purpose:** Documents the partial-credit formula as a known baseline value for regression detection.

---

### S4 — Level reflects company, not user

**Setup:** Company has 2 problems in a pattern (`companyCount=2`). User A solved 0 of them. User B solved both Optimally.

**Expected current output:** Both users get `level='intermediate'`.

**Flaw documented:** `resolveLevel` uses `companyCount` only — user performance has no effect.

---

### S5 — No overall score

**Setup:** Any valid company/user combination with multiple patterns.

**Expected current output:** Response contains no top-level key representing overall readiness (e.g., no `score`, `readiness`, or `overallComposite` field).

**Flaw documented:** There is no single "you are X% ready for this company" rollup.

---

### S6 — Radar unit mismatch (documented via assertion comment)

**Setup:** Company has 10 problems in `Arrays & Hashing` out of 20 total (`patternFrequency=50`). User solved 8 of those 10 Optimally (`composite=80`).

**Expected current output:** `patterns['Arrays & Hashing']['composite']` = 80; `company.patternFrequencies['Arrays & Hashing']` = 50.

**Flaw documented:** The radar chart plots these two values on the same axis as if they are comparable. `composite` measures user performance (0–100% of company problems solved well). `patternFrequency` measures interview emphasis (0–100% of company's questions that test this pattern). They are different quantities.

---

## Integration Scenarios (E1–E3)

HTTP-layer tests using `actingAs($user)->getJson('/api/companies/{slug}/match')`.

### E1 — Full expert

**DB state:** Company with 3 patterns, 2 problems each (6 total). User solved all 6 Optimally.

**Asserts:** `composite=100` on all three patterns; `totalAttempted=6`; pivot query loads frequency/timeframe without error.

### E2 — Zero coverage

**DB state:** Same company as E1. User has no logs.

**Asserts:** All pattern metrics are 0; `totalAttempted=0`; response shape is intact; no division-by-zero or missing keys.

### E3 — Multi-pattern partial

**DB state:** Company with 3 patterns (2 problems each). User solved both problems in pattern A, one problem in pattern B, none in pattern C.

**Asserts:** Pattern A `coverage=100`; pattern B `coverage=50`; pattern C `coverage=0`. All three patterns appear in the `patterns` key.

---

## Baseline quantification

After implementation, run:

```bash
php artisan test --compact tests/Unit/CompanyMatchScorerTest.php tests/Feature/Api/CompanyMatchEvalTest.php
```

Record exact pass/fail counts and the numeric outputs from S1–S6 in `docs/superpowers/specs/eval-baseline.md`. This snapshot is the reference point for any future algorithm change.

---

## Files to create or modify

| Action | File |
|--------|------|
| Create | `app/Services/CompanyMatchScorer.php` |
| Modify | `app/Http/Controllers/Api/CompanyMatchController.php` — delegate to scorer |
| Create | `tests/Unit/CompanyMatchScorerTest.php` |
| Create | `tests/Feature/Api/CompanyMatchEvalTest.php` |
| Create | `docs/superpowers/specs/eval-baseline.md` (after first run) |
