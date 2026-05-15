import type { Difficulty, Pattern } from '$lib/types';

export interface DifficultyProfile {
	easy: number;
	medium: number;
	hard: number;
}

export interface MatchInputs {
	userWeightedSolves: number;
	userOptimalSolves: number;
	userProfile: DifficultyProfile;
	companyRequired: number;
	companyProfile: DifficultyProfile;
	recentProblems: Array<{ timestamp: Date; qualityWeight: number }>;
	timeWindowDays?: number;
}

export interface MatchResult {
	coverage: number;
	alignment: number;
	composite: number;
	mastery: number;
	gap: number;
	recency: number;
	level: 'none' | 'beginner' | 'intermediate' | 'advanced' | 'master';
	breakdown: {
		userWeighted: number;
		userOptimal: number;
		companyRequired: number;
	};
}

export interface SkillMatchPayload {
	company: {
		slug: string;
		name: string;
		color: string;
		totalProblems: number;
		patternFrequencies: Record<string, number>;
		patternCounts: Record<string, number>;
		patternDifficulty: Record<string, { Easy: number; Medium: number; Hard: number }>;
	};
	user: {
		totalAttempted: number;
	};
	patterns: Record<
		string,
		{
			companyCount: number;
			companyDifficulty: DifficultyProfile;
			userCount: number;
			userWeighted: number;
			userOptimal: number;
			userDifficulty: DifficultyProfile;
			coverage: number;
			alignment: number;
			composite: number;
			mastery: number;
			gap: number;
			recency: number;
			level: MatchResult['level'];
		}
	>;
	recommendations: Recommendation[];
}

export interface Recommendation {
	pattern: Pattern;
	priority: 'high' | 'medium' | 'low';
	message: string;
	gap: number;
}

export function getQualityWeight(status: string): number {
	switch (status) {
		case 'Optimal':
			return 1.0;
		case 'Suboptimal':
			return 0.7;
		case 'Hints':
			return 0.5;
		case 'Solution':
			return 0.3;
		case 'Failed':
			return 0.1;
		default:
			return 0.5;
	}
}

const DEFAULT_PRIOR = { alpha: 2, beta: 2 };

export function calculateBayesianCoverage(
	successes: number,
	trials: number,
	prior = DEFAULT_PRIOR
): number {
	if (trials <= 0) return 0;
	return Math.min(1, (prior.alpha + successes) / (prior.alpha + prior.beta + trials));
}

export function calculateCosineAlignment(
	userProfile: DifficultyProfile,
	companyProfile: DifficultyProfile
): number {
	const u = [userProfile.easy, userProfile.medium, userProfile.hard];
	const c = [companyProfile.easy, companyProfile.medium, companyProfile.hard];

	const dot = u[0] * c[0] + u[1] * c[1] + u[2] * c[2];
	const uMag = Math.sqrt(u[0] ** 2 + u[1] ** 2 + u[2] ** 2);
	const cMag = Math.sqrt(c[0] ** 2 + c[1] ** 2 + c[2] ** 2);

	if (uMag === 0 || cMag === 0) return 0.5;
	return Math.min(1, dot / (uMag * cMag));
}

export function calculateRecencyWeightedScore(
	problems: Array<{ timestamp: Date; qualityWeight: number }>,
	companyRequired: number,
	timeWindowDays = 90
): number {
	if (companyRequired <= 0) return 0;

	const now = Date.now();
	const msPerDay = 24 * 60 * 60 * 1000;

	let weighted = 0;
	for (const p of problems) {
		const ageMs = now - new Date(p.timestamp).getTime();
		const daysOld = ageMs / msPerDay;
		const weight = Math.pow(2, -daysOld / timeWindowDays);
		weighted += p.qualityWeight * weight;
	}

	return Math.min(100, (weighted / companyRequired) * 100);
}

function getMasteryLevel(
	optimalCount: number,
	companyRequired: number
): MatchResult['level'] {
	if (optimalCount === 0) return 'none';
	if (optimalCount < 3) return 'beginner';
	if (optimalCount < companyRequired * 0.5) return 'intermediate';
	if (optimalCount < companyRequired) return 'advanced';
	return 'master';
}

export function calculateSkillMatch(inputs: MatchInputs): MatchResult {
	const {
		userWeightedSolves,
		userOptimalSolves,
		userProfile,
		companyRequired,
		companyProfile,
		recentProblems,
		timeWindowDays = 90
	} = inputs;

	if (companyRequired <= 0) {
		return {
			coverage: 0,
			alignment: 0,
			composite: 0,
			mastery: 0,
			gap: 0,
			recency: 0,
			level: 'none',
			breakdown: { userWeighted: 0, userOptimal: 0, companyRequired: 0 }
		};
	}

	const coverage = calculateBayesianCoverage(userWeightedSolves, companyRequired) * 100;
	const alignment = calculateCosineAlignment(userProfile, companyProfile);
	const composite = coverage * (0.5 + 0.5 * alignment);

	const mastery = calculateBayesianCoverage(userOptimalSolves, companyRequired) * 100;
	const gap = Math.max(0, companyRequired - userWeightedSolves) / companyRequired * 100;
	const recency = calculateRecencyWeightedScore(
		recentProblems,
		companyRequired,
		timeWindowDays
	);

	return {
		coverage: Math.round(coverage),
		alignment: Math.round(alignment * 100) / 100,
		composite: Math.round(composite),
		mastery: Math.round(mastery),
		gap: Math.round(gap),
		recency: Math.round(recency),
		level: getMasteryLevel(userOptimalSolves, companyRequired),
		breakdown: {
			userWeighted: userWeightedSolves,
			userOptimal: userOptimalSolves,
			companyRequired
		}
	};
}

export function getRecommendations(
	gaps: Record<string, { gap: number }>,
	companyProfile?: Record<string, DifficultyProfile>
): Recommendation[] {
	const recommendations: Recommendation[] = [];

	for (const [pattern, result] of Object.entries(gaps)) {
		if (result.gap <= 0) continue;

		const priority: Recommendation['priority'] =
			result.gap >= 70 ? 'high' : result.gap >= 40 ? 'medium' : 'low';

		let message = `Focus on ${pattern}`;
		const profile = companyProfile?.[pattern];
		if (profile) {
			const total = profile.easy + profile.medium + profile.hard;
			if (total > 0) {
				const hardPct = (profile.hard / total) * 100;
				if (hardPct > 50) {
					message += ' — prioritize Hard problems';
				} else if (profile.medium > profile.easy) {
					message += ' — focus on Medium problems';
				}
			}
		}

		recommendations.push({
			pattern: pattern as Pattern,
			priority,
			message,
			gap: result.gap
		});
	}

	const priorityOrder = { high: 3, medium: 2, low: 1 };
	return recommendations
		.sort((a, b) => {
			if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
				return priorityOrder[b.priority] - priorityOrder[a.priority];
			}
			return b.gap - a.gap;
		})
		.slice(0, 5);
}

export interface LogEntry {
	problemId: string;
	status: string;
	timestamp: Date;
	difficulty: Difficulty;
	patterns: Pattern[];
}

export interface CompanyProblemEntry {
	problemId: string;
	patterns: Pattern[];
	difficulty: Difficulty;
	frequency: number;
}

export function aggregateUserLogs(logs: LogEntry[]): {
	byPattern: Record<
		Pattern,
		{
			total: number;
			weighted: number;
			optimal: number;
			difficulty: DifficultyProfile;
			recentProblems: Array<{ timestamp: Date; qualityWeight: number }>;
		}
	>;
	totalAttempted: number;
} {
	const byProblem = new Map<
		string,
		{ status: string; timestamp: Date; difficulty: Difficulty; patterns: Pattern[] }
	>();

	for (const log of logs) {
		const existing = byProblem.get(log.problemId);
		if (!existing || new Date(log.timestamp) > new Date(existing.timestamp)) {
			byProblem.set(log.problemId, {
				status: log.status,
				timestamp: log.timestamp,
				difficulty: log.difficulty,
				patterns: log.patterns
			});
		}
	}

	const byPattern: ReturnType<typeof aggregateUserLogs>['byPattern'] = {} as ReturnType<
		typeof aggregateUserLogs
	>['byPattern'];

	for (const [, problem] of byProblem) {
		const qualityWeight = getQualityWeight(problem.status);
		const seenPatterns = new Set<Pattern>();

		for (const pattern of problem.patterns) {
			if (seenPatterns.has(pattern)) continue;
			seenPatterns.add(pattern);

			if (!byPattern[pattern]) {
				byPattern[pattern] = {
					total: 0,
					weighted: 0,
					optimal: 0,
					difficulty: { easy: 0, medium: 0, hard: 0 },
					recentProblems: []
				};
			}

			byPattern[pattern].total += 1;
			byPattern[pattern].weighted += qualityWeight;
			if (problem.status === 'Optimal') {
				byPattern[pattern].optimal += 1;
			}

			const d = problem.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard';
			byPattern[pattern].difficulty[d] += qualityWeight;

			byPattern[pattern].recentProblems.push({
				timestamp: problem.timestamp,
				qualityWeight
			});
		}
	}

	return { byPattern, totalAttempted: byProblem.size };
}

export function aggregateCompanyProblems(problems: CompanyProblemEntry[]): {
	byPattern: Record<
		Pattern,
		{
			count: number;
			difficulty: DifficultyProfile;
		}
	>;
	totalProblems: number;
} {
	const byPattern: ReturnType<typeof aggregateCompanyProblems>['byPattern'] = {} as ReturnType<
		typeof aggregateCompanyProblems
	>['byPattern'];

	for (const problem of problems) {
		const seenPatterns = new Set<Pattern>();
		for (const pattern of problem.patterns) {
			if (seenPatterns.has(pattern)) continue;
			seenPatterns.add(pattern);

			if (!byPattern[pattern]) {
				byPattern[pattern] = {
					count: 0,
					difficulty: { easy: 0, medium: 0, hard: 0 }
				};
			}

			byPattern[pattern].count += 1;
			const d = problem.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard';
			byPattern[pattern].difficulty[d] += 1;
		}
	}

	return { byPattern, totalProblems: problems.length };
}

export function buildSkillMatchPayload(
	company: {
		slug: string;
		name: string;
		color: string | null;
	},
	companyProblems: CompanyProblemEntry[],
	userLogs: LogEntry[]
): SkillMatchPayload {
	const { byPattern: companyByPattern, totalProblems } =
		aggregateCompanyProblems(companyProblems);
	const { byPattern: userByPattern, totalAttempted } = aggregateUserLogs(userLogs);

	const patterns: SkillMatchPayload['patterns'] = {};
	const allPatterns = new Set([
		...Object.keys(companyByPattern),
		...Object.keys(userByPattern)
	]);

	for (const pattern of allPatterns) {
		const companyData = companyByPattern[pattern as Pattern] || {
			count: 0,
			difficulty: { easy: 0, medium: 0, hard: 0 }
		};
		const userData = userByPattern[pattern as Pattern] || {
			total: 0,
			weighted: 0,
			optimal: 0,
			difficulty: { easy: 0, medium: 0, hard: 0 },
			recentProblems: []
		};

		const result = calculateSkillMatch({
			userWeightedSolves: userData.weighted,
			userOptimalSolves: userData.optimal,
			userProfile: userData.difficulty,
			companyRequired: companyData.count,
			companyProfile: companyData.difficulty,
			recentProblems: userData.recentProblems
		});

		patterns[pattern] = {
			companyCount: companyData.count,
			companyDifficulty: companyData.difficulty,
			userCount: userData.total,
			userWeighted: userData.weighted,
			userOptimal: userData.optimal,
			userDifficulty: userData.difficulty,
			...result
		};
	}

	const frequencies: Record<string, number> = {};
	for (const [pattern, data] of Object.entries(companyByPattern)) {
		frequencies[pattern] =
			totalProblems > 0 ? Math.round((data.count / totalProblems) * 100) : 0;
	}

	const patternDifficulty: Record<string, { Easy: number; Medium: number; Hard: number }> =
		{};
	for (const [pattern, data] of Object.entries(companyByPattern)) {
		patternDifficulty[pattern] = {
			Easy: data.difficulty.easy,
			Medium: data.difficulty.medium,
			Hard: data.difficulty.hard
		};
	}

	return {
		company: {
			slug: company.slug,
			name: company.name,
			color: company.color ?? '#6366f1',
			totalProblems,
			patternFrequencies: frequencies,
			patternCounts: Object.fromEntries(
				Object.entries(companyByPattern).map(([k, v]) => [k, v.count])
			),
			patternDifficulty
		},
		user: { totalAttempted },
		patterns,
		recommendations: getRecommendations(
			patterns,
			Object.fromEntries(
				Object.entries(companyByPattern).map(([k, v]) => [k, v.difficulty])
			)
		)
	};
}
