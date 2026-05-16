<script lang="ts">
	import type { Pattern, ProblemWithLogs } from '$lib/types';
	import { logsStore } from '$lib/stores/logsStore';
	import RadarChart from '$lib/components/common/RadarChart.svelte';
	import PatternFrequencyTable from './PatternFrequencyTable.svelte';

	// Get all available patterns (for labels) - sorted alphabetically
	const allAvailablePatterns = $derived.by(() => {
		const patternSet = new Set<Pattern>();
		logsStore.problems.forEach((problem) => {
			problem.patterns.forEach((pattern: Pattern) => {
				patternSet.add(pattern);
			});
		});
		return Array.from(patternSet).sort();
	});

	// Calculate mastery per pattern (including 0% for unattempted patterns)
	// Mastery is calculated as percentage of all available problems for that pattern
	// All attempts count toward mastery, regardless of status
	const patternMastery = $derived.by(() => {
		// First, count total available problems per pattern
		const totalAvailable = new Map<Pattern, number>();
		logsStore.problems.forEach((problem) => {
			problem.patterns.forEach((pattern: Pattern) => {
				totalAvailable.set(pattern, (totalAvailable.get(pattern) || 0) + 1);
			});
		});

		// Then, count how many have been attempted (have any logs)
		const attemptedCount = new Map<Pattern, number>();
		logsStore.problemsWithLogs.forEach((problem: ProblemWithLogs) => {
			if (problem.logs.length > 0) {
				problem.patterns.forEach((pattern: Pattern) => {
					attemptedCount.set(pattern, (attemptedCount.get(pattern) || 0) + 1);
				});
			}
		});

		// Calculate percentage for ALL patterns (including 0% for unattempted)
		const mastery = {} as Record<Pattern, number>;
		totalAvailable.forEach((total, pattern) => {
			const attempted = attemptedCount.get(pattern) || 0;
			const percentage = total > 0 ? Math.round((attempted / total) * 100) : 0;
			mastery[pattern] = percentage;
		});

		return mastery;
	});

	// Prepare data for PatternFrequencyTable
	// Show all patterns with available problems, not just attempted ones
	const masteryTableData = $derived.by(() => {
		const patterns: Record<string, number> = {};
		const patternCounts: Record<string, number> = {};
		let totalProblems = 0;

		// Count total available problems per pattern
		const totalAvailable = new Map<Pattern, number>();
		logsStore.problems.forEach((problem) => {
			problem.patterns.forEach((pattern: Pattern) => {
				totalAvailable.set(pattern, (totalAvailable.get(pattern) || 0) + 1);
			});
		});

		// Count attempted problems per pattern
		const attemptedCount = new Map<Pattern, number>();
		logsStore.problemsWithLogs.forEach((problem: ProblemWithLogs) => {
			if (problem.logs.length > 0) {
				problem.patterns.forEach((pattern: Pattern) => {
					attemptedCount.set(pattern, (attemptedCount.get(pattern) || 0) + 1);
				});
			}
		});

		// Calculate percentages and counts for ALL patterns (including 0% mastery)
		totalAvailable.forEach((total, pattern) => {
			const attempted = attemptedCount.get(pattern) || 0;
			const percentage = total > 0 ? Math.round((attempted / total) * 100) : 0;
			patterns[pattern] = percentage;
			patternCounts[pattern] = attempted;
			totalProblems += total;
		});

		return { patterns, patternCounts, totalProblems };
	});

	// Calculate total questions answered by user
	const totalQuestionsAnswered = $derived.by(() => {
		return logsStore.problemsWithLogs.filter((problem) => problem.logs.length > 0).length;
	});

	const chartData = $derived.by(() => {
		// Use all available patterns as labels
		const labels = allAvailablePatterns;
		// Map data for all patterns (0% for unattempted patterns)
		const data = labels.map((pattern) => patternMastery[pattern] || 0);

		return {
			labels,
			primary: {
				label: 'Pattern Mastery %',
				data,
				color: 'rgb(59, 130, 246)' // blue-500
			}
		};
	});
</script>

<div class="flex flex-col h-full">
	<div class="h-72">
		{#if chartData.labels.length > 0}
			<RadarChart 
				labels={chartData.labels} 
				primaryData={chartData.primary}
				totalQuestionsAnswered={totalQuestionsAnswered}
			/>
		{:else}
			<div class="flex h-full w-full items-center justify-center text-muted-foreground">
				No data available yet. Start solving problems!
			</div>
		{/if}
	</div>

	{#if masteryTableData.patterns && Object.keys(masteryTableData.patterns).length > 0}
		<div class="mt-auto pt-8">
			<PatternFrequencyTable
				patterns={masteryTableData.patterns}
				patternCounts={masteryTableData.patternCounts}
				totalProblems={masteryTableData.totalProblems}
				companyName="Your Mastery"
				description="Detailed breakdown of your mastery percentage for each pattern. Shows what percentage of available problems you've attempted in each pattern."
			/>
		</div>
	{/if}
</div>
