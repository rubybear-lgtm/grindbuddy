# Recommendations Feature Design

**Date:** 2026-05-24
**Goal:** Surface a ranked list of problems the user should practice next for a target company.

---

## Context

The CompanyMatch skill-match panel shows a radar chart and pattern frequency table but gives users no actionable direction. The recommendations feature answers: "given my gaps against this company, which specific problems should I practice today?"

---

## Architecture

### Layer 1 — Scorer method

**File:** `app/Services/CompanyMatchScorer.php`

New public method:

```php
public function recommendProblems(
    array $problems,
    Collection $userLogs,
    array $patternMetrics,
    array $patternPercentages,
    string $companyName = '',
    int $limit = 5
): array
```

Pure function — no DB dependency. Takes the same inputs already available in the controller after `computePatternMetrics` runs. Returns an array of recommendation objects sorted by priority descending.

### Layer 2 — Controller

**File:** `app/Http/Controllers/Api/CompanyMatchController.php`

Call `recommendProblems` after `computePatternMetrics` and replace the existing `'recommendations' => []` placeholder with the result.

### Layer 3 — Frontend

**File:** `resources/js/components/analytics/skill-match.tsx`

Render a "Recommended Practice" section below the radar chart. Reads `matchData.recommendations`.

---

## Scoring Algorithm

For each company problem, compute a priority score:

```
priority = gap × (emphasis / 100) × difficultyWeight × recencyMultiplier
```

**Inputs:**

| Variable | Source | Description |
|---|---|---|
| `gap` | `patternMetrics[pattern]['gap']` | 0–100. How far the user is from full readiness in this pattern. |
| `emphasis` | `patternPercentages[pattern]` | 0–100. Share of company's interview questions in this pattern. |
| `difficultyWeight` | Problem difficulty | Hard=3, Medium=2, Easy=1 |
| `recencyMultiplier` | Per-problem log status | See below |

**Recency multiplier:**
- Unsolved problems: `1.0`
- Solved problems: `1.0 + (1.0 - recency / 100)` where `recency` is the pattern's recency score
  - Fresh solve (recency=100): multiplier=1.0 — no boost
  - Stale solve (recency=0): multiplier=2.0 — doubles priority

**Candidate eligibility:** A problem is included if any of:
- No log exists for this problem (status: `unsolved`)
- Most recent log is `Suboptimal` (status: `suboptimal`)
- Most recent log is `Optimal` but pattern `recency < 50` (status: `stale`)

Problems with an `Optimal` log and pattern `recency >= 50` are excluded.

**Tie-breaking:** Sort by priority descending; ties broken by difficulty descending (Hard > Medium > Easy).

**Limit:** Top 5 by default.

**Per-problem deduplication:** Use most-recent log per problem (same logic as `computePatternMetrics`): `sortByDesc('timestamp') → unique('problem_id')`.

---

## Recommendation Object Shape

```php
[
    'problemId'   => string,          // Problem ID
    'title'       => string,          // Problem title
    'difficulty'  => string,          // 'Easy' | 'Medium' | 'Hard'
    'pattern'     => string,          // Primary pattern (first in problem->patterns)
    'status'      => string,          // 'unsolved' | 'suboptimal' | 'stale'
    'reason'      => string,          // e.g. "High-gap pattern — 30% of Google interviews"
    'leetcodeUrl' => string|null,
    'neetcodeUrl' => string|null,
    'priority'    => float,           // Raw score (not shown in UI, used for ordering)
]
```

**Reason string format:** `"{gap descriptor} — {emphasis}% of {company} interviews"`
- Gap descriptor: `gap >= 60` → "High-gap pattern"; `gap >= 30` → "Partial gap"; else → "Refresh needed"

---

## Frontend

**File:** `resources/js/components/analytics/skill-match.tsx`

Add a "Recommended Practice" section below the radar chart, above the pattern frequency table.

**Each row:**
- Problem title as a link (`leetcodeUrl`, opens new tab)
- Difficulty badge: `Easy` (green), `Medium` (amber), `Hard` (red)
- Pattern tag in muted text
- One-line reason in muted text
- Status chip: `New` (green), `Revisit` (amber), `Stale` (orange)

**Empty state:** "Nothing urgent — you're covering this company well."

**Loading state:** Reuses existing `isRefreshing` flag — section shows skeleton or nothing while loading.

---

## Testing

### Unit (`tests/Unit/CompanyMatchScorerTest.php`)

| Case | Expected |
|---|---|
| All problems solved Optimally with fresh recency | `recommendations = []` |
| Unsolved problems only | Sorted by `gap × emphasis × difficulty`, limit respected |
| Stale Optimal vs fresh Suboptimal | Stale Optimal gets recency multiplier; order determined by final score |
| Suboptimal problem | Appears with `status = 'suboptimal'` |
| Limit=2 with 5 candidates | Only top 2 returned |
| Problem with no pattern in patternMetrics | Skipped (gap and emphasis are 0 — priority is 0) |

### Integration (`tests/Feature/Api/CompanyMatchEvalTest.php`)

- `recommendations` key present in all E1/E2/E3 responses
- E1 (full expert, fresh): `recommendations` is empty
- E2 (zero coverage): `recommendations` has 5 items (or all problems if fewer than 5), all `status = 'unsolved'`
- Each recommendation has required keys: `title`, `difficulty`, `pattern`, `status`, `reason`, `priority`

---

## Files to Create or Modify

| Action | File |
|---|---|
| Modify | `app/Services/CompanyMatchScorer.php` — add `recommendProblems` method |
| Modify | `app/Http/Controllers/Api/CompanyMatchController.php` — call scorer, replace `[]` placeholder |
| Modify | `resources/js/components/analytics/skill-match.tsx` — render recommendations section |
| Modify | `tests/Unit/CompanyMatchScorerTest.php` — add recommendation unit tests |
| Modify | `tests/Feature/Api/CompanyMatchEvalTest.php` — add recommendation integration assertions |
