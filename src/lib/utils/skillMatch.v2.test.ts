import { describe, it, expect } from 'vitest';
import {
	calculateBayesianCoverage,
	calculateCosineAlignment,
	calculateRecencyWeightedScore,
	calculateSkillMatch,
	getQualityWeight,
	getRecommendations,
	aggregateUserLogs,
	aggregateCompanyProblems,
	buildSkillMatchPayload,
	type MatchInputs
} from './skillMatch.v2';

describe('getQualityWeight', () => {
	it('returns full credit for Optimal', () => {
		expect(getQualityWeight('Optimal')).toBe(1.0);
	});
	it('returns 0.7 for Suboptimal', () => {
		expect(getQualityWeight('Suboptimal')).toBe(0.7);
	});
	it('returns 0.5 for Hints', () => {
		expect(getQualityWeight('Hints')).toBe(0.5);
	});
	it('returns 0.3 for Solution', () => {
		expect(getQualityWeight('Solution')).toBe(0.3);
	});
	it('returns 0.1 for Failed', () => {
		expect(getQualityWeight('Failed')).toBe(0.1);
	});
	it('returns 0.5 for unknown status', () => {
		expect(getQualityWeight('Unknown')).toBe(0.5);
	});
});

describe('calculateBayesianCoverage', () => {
	const prior = { alpha: 2, beta: 2 };

	it('returns 0 when trials is 0', () => {
		expect(calculateBayesianCoverage(0, 0, prior)).toBe(0);
	});

	it('returns 0 when trials is negative', () => {
		expect(calculateBayesianCoverage(0, -1, prior)).toBe(0);
	});

	it('never returns 0 for k=0, n>0 (prior pulls it up)', () => {
		expect(calculateBayesianCoverage(0, 3, prior)).toBeCloseTo(2 / 7, 4);
		expect(calculateBayesianCoverage(0, 10, prior)).toBeCloseTo(2 / 14, 4);
	});

	it('never returns 1 for k=n (prior pulls it down)', () => {
		expect(calculateBayesianCoverage(3, 3, prior)).toBeCloseTo(5 / 7, 4);
		expect(calculateBayesianCoverage(10, 10, prior)).toBeCloseTo(12 / 14, 4);
	});

	it('approaches 1 as sample size grows', () => {
		expect(calculateBayesianCoverage(50, 50, prior)).toBeCloseTo(52 / 54, 4);
		expect(calculateBayesianCoverage(100, 100, prior)).toBeCloseTo(102 / 104, 4);
	});

	it('approaches 1 for large samples', () => {
		expect(calculateBayesianCoverage(1000, 1000, prior)).toBeCloseTo(1, 2);
	});
});

describe('calculateCosineAlignment', () => {
	it('returns 1 for identical vectors', () => {
		expect(calculateCosineAlignment(
			{ easy: 1, medium: 2, hard: 3 },
			{ easy: 1, medium: 2, hard: 3 }
		)).toBe(1);
	});

	it('returns 0 for orthogonal vectors', () => {
		expect(calculateCosineAlignment(
			{ easy: 1, medium: 0, hard: 0 },
			{ easy: 0, medium: 1, hard: 0 }
		)).toBe(0);
	});

	it('returns 0.5 when user vector is zero', () => {
		expect(calculateCosineAlignment(
			{ easy: 0, medium: 0, hard: 0 },
			{ easy: 1, medium: 2, hard: 3 }
		)).toBe(0.5);
	});

	it('returns 0.5 when company vector is zero', () => {
		expect(calculateCosineAlignment(
			{ easy: 1, medium: 2, hard: 3 },
			{ easy: 0, medium: 0, hard: 0 }
		)).toBe(0.5);
	});

	it('returns correct value for proportional vectors', () => {
		expect(calculateCosineAlignment(
			{ easy: 2, medium: 4, hard: 6 },
			{ easy: 1, medium: 2, hard: 3 }
		)).toBe(1);
	});
});

describe('calculateRecencyWeightedScore', () => {
	const now = new Date();

	it('returns 0 when companyRequired is 0', () => {
		expect(calculateRecencyWeightedScore([], 0)).toBe(0);
	});

	it('returns 0 when companyRequired is negative', () => {
		expect(calculateRecencyWeightedScore([], -1)).toBe(0);
	});

	it('gives full weight to problems solved today', () => {
		const problems = [{ timestamp: now, qualityWeight: 1.0 }];
		expect(calculateRecencyWeightedScore(problems, 1, 90)).toBeCloseTo(100, 0);
	});

	it('gives half weight to problems at half-life', () => {
		const halfLife = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
		const problems = [{ timestamp: halfLife, qualityWeight: 1.0 }];
		expect(calculateRecencyWeightedScore(problems, 1, 90)).toBeCloseTo(50, 0);
	});

	it('caps at 100', () => {
		const problems = [
			{ timestamp: now, qualityWeight: 1.0 },
			{ timestamp: now, qualityWeight: 1.0 }
		];
		expect(calculateRecencyWeightedScore(problems, 1, 90)).toBe(100);
	});
});

describe('calculateSkillMatch — synthetic personas', () => {
	const baseInputs: MatchInputs = {
		userWeightedSolves: 0,
		userOptimalSolves: 0,
		userProfile: { easy: 0, medium: 0, hard: 0 },
		companyRequired: 10,
		companyProfile: { easy: 3, medium: 4, hard: 3 },
		recentProblems: []
	};

	it('perfect user scores near 100', () => {
		const result = calculateSkillMatch({
			...baseInputs,
			userWeightedSolves: 10,
			userOptimalSolves: 10,
			userProfile: { easy: 3, medium: 4, hard: 3 }
		});
		expect(result.composite).toBeGreaterThan(80);
		expect(result.composite).toBeLessThanOrEqual(100);
		expect(result.level).toBe('master');
	});

	it('failed user scores low', () => {
		const result = calculateSkillMatch({
			...baseInputs,
			userWeightedSolves: 10,
			userOptimalSolves: 0,
			userProfile: { easy: 3, medium: 4, hard: 3 }
		});
		expect(result.coverage).toBeGreaterThan(50);
		expect(result.coverage).toBeLessThan(90);
		expect(result.mastery).toBeLessThan(20);
		expect(result.level).toBe('none');
	});

	it('difficulty-mismatched user scores lower than aligned user', () => {
		const aligned = calculateSkillMatch({
			...baseInputs,
			userWeightedSolves: 5,
			userOptimalSolves: 5,
			userProfile: { easy: 1.5, medium: 2, hard: 1.5 }
		});
		const mismatched = calculateSkillMatch({
			...baseInputs,
			userWeightedSolves: 5,
			userOptimalSolves: 5,
			userProfile: { easy: 5, medium: 0, hard: 0 }
		});
		expect(aligned.composite).toBeGreaterThan(mismatched.composite);
	});

	it('small-company perfect user can score near 100', () => {
		const result = calculateSkillMatch({
			...baseInputs,
			companyRequired: 3,
			companyProfile: { easy: 1, medium: 1, hard: 1 },
			userWeightedSolves: 3,
			userOptimalSolves: 3,
			userProfile: { easy: 1, medium: 1, hard: 1 }
		});
		expect(result.composite).toBeGreaterThan(70);
		expect(result.level).toBe('master');
	});

	it('beginner (2 solves) gets a fair score', () => {
		const result = calculateSkillMatch({
			...baseInputs,
			userWeightedSolves: 2,
			userOptimalSolves: 2,
			userProfile: { easy: 1, medium: 1, hard: 0 }
		});
		expect(result.coverage).toBeGreaterThan(15);
		expect(result.coverage).toBeLessThan(40);
		expect(result.level).toBe('beginner');
	});

	it('user with 0 solves gets 0 coverage but not negative', () => {
		const result = calculateSkillMatch(baseInputs);
		expect(result.coverage).toBeGreaterThanOrEqual(0);
		expect(result.coverage).toBeLessThan(30);
		expect(result.gap).toBe(100);
		expect(result.level).toBe('none');
	});

	it('gap is 0 when user exceeds requirement', () => {
		const result = calculateSkillMatch({
			...baseInputs,
			userWeightedSolves: 15,
			userOptimalSolves: 15
		});
		expect(result.gap).toBe(0);
	});

	it('gap is proportional to missing problems', () => {
		const half = calculateSkillMatch({
			...baseInputs,
			userWeightedSolves: 5,
			userOptimalSolves: 5
		});
		expect(half.gap).toBe(50);
	});
});

describe('getRecommendations', () => {
	it('returns empty array when no gaps', () => {
		const gaps = {
			'Arrays & Hashing': { gap: 0 } as any
		};
		expect(getRecommendations(gaps)).toEqual([]);
	});

	it('sorts by priority then gap', () => {
		const gaps = {
			'Arrays & Hashing': { gap: 80 } as any,
			'Trees': { gap: 90 } as any,
			'Graphs': { gap: 30 } as any
		};
		const recs = getRecommendations(gaps);
		expect(recs[0].pattern).toBe('Trees');
		expect(recs[1].pattern).toBe('Arrays & Hashing');
		expect(recs[2].pattern).toBe('Graphs');
	});

	it('limits to 5 recommendations', () => {
		const gaps: Record<string, any> = {};
		for (let i = 0; i < 10; i++) {
			gaps[`Pattern${i}`] = { gap: 50 + i };
		}
		expect(getRecommendations(gaps).length).toBe(5);
	});
});

describe('aggregateUserLogs', () => {
	it('uses most recent log per problem', () => {
		const logs = [
			{
				problemId: 'p1',
				status: 'Failed',
				timestamp: new Date('2024-01-01'),
				difficulty: 'Easy' as const,
				patterns: ['Arrays & Hashing' as const]
			},
			{
				problemId: 'p1',
				status: 'Optimal',
				timestamp: new Date('2024-02-01'),
				difficulty: 'Easy' as const,
				patterns: ['Arrays & Hashing' as const]
			}
		];
		const result = aggregateUserLogs(logs);
		expect(result.byPattern['Arrays & Hashing'].total).toBe(1);
		expect(result.byPattern['Arrays & Hashing'].optimal).toBe(1);
	});

	it('counts a problem once per pattern', () => {
		const logs = [
			{
				problemId: 'p1',
				status: 'Optimal',
				timestamp: new Date(),
				difficulty: 'Easy' as const,
				patterns: ['Arrays & Hashing' as const, 'Two Pointers' as const]
			}
		];
		const result = aggregateUserLogs(logs);
		expect(result.byPattern['Arrays & Hashing'].total).toBe(1);
		expect(result.byPattern['Two Pointers'].total).toBe(1);
		expect(result.totalAttempted).toBe(1);
	});
});

describe('aggregateCompanyProblems', () => {
	it('counts problems by pattern and difficulty', () => {
		const problems = [
			{
				problemId: 'p1',
				patterns: ['Arrays & Hashing' as const],
				difficulty: 'Easy' as const,
				frequency: 1
			},
			{
				problemId: 'p2',
				patterns: ['Arrays & Hashing' as const],
				difficulty: 'Medium' as const,
				frequency: 1
			}
		];
		const result = aggregateCompanyProblems(problems);
		expect(result.byPattern['Arrays & Hashing'].count).toBe(2);
		expect(result.byPattern['Arrays & Hashing'].difficulty.easy).toBe(1);
		expect(result.byPattern['Arrays & Hashing'].difficulty.medium).toBe(1);
		expect(result.totalProblems).toBe(2);
	});
});

describe('buildSkillMatchPayload', () => {
	it('returns correct structure', () => {
		const payload = buildSkillMatchPayload(
			{ slug: 'google', name: 'Google', color: '#ea4335' },
			[
				{
					problemId: 'p1',
					patterns: ['Arrays & Hashing'],
					difficulty: 'Easy',
					frequency: 1
				},
				{
					problemId: 'p2',
					patterns: ['Arrays & Hashing'],
					difficulty: 'Medium',
					frequency: 1
				}
			],
			[
				{
					problemId: 'p1',
					status: 'Optimal',
					timestamp: new Date(),
					difficulty: 'Easy',
					patterns: ['Arrays & Hashing']
				}
			]
		);

		expect(payload.company.slug).toBe('google');
		expect(payload.user.totalAttempted).toBe(1);
		expect(payload.patterns['Arrays & Hashing'].userOptimal).toBe(1);
		expect(payload.patterns['Arrays & Hashing'].companyCount).toBe(2);
		expect(payload.recommendations.length).toBeGreaterThan(0);
	});
});
