# Eval Baseline — CompanyMatch Ranking Algorithm

**Run date:** 2026-05-22
**Algorithm version:** `34606c6`

## Run output

```text
{"tool":"pest","result":"passed","tests":21,"passed":21,"assertions":72,"duration_ms":171}
```

## Summary

| Suite | Tests | Passed | Failed | Todo/Skipped |
|-------|-------|--------|--------|--------------|
| Unit eval file (I1–I8, S1–S6) | 18 | 18 | 0 | 0 |
| Integration (E1–E3) | 3 | 3 | 0 | 0 |
| **Total** | **21** | **21** | **0** | **0** |

## Known flaw confirmations

| ID | Flaw | Confirmed |
|----|------|-----------|
| I8 | Coverage inflates above 100 on duplicate logs | fixed by deduplicating latest log per problem |
| S1 | Recency is binary — timestamp ignored | ✓ both users get recency=100 |
| S2 | Difficulty not weighted — Easy == Hard | ✓ both composites are 100 |
| S3 | Suboptimal-only produces composite=75, mastery=0 | ✓ baseline value recorded |
| S4 | Level label ignores user performance | ✓ novice and expert both get `intermediate` |
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
