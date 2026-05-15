<script lang="ts">
	import RadarChart from '$lib/components/common/RadarChart.svelte';
	import type { SkillMatchPayload } from '$lib/utils/skillMatch.v2';

	interface Props {
		matchData: SkillMatchPayload;
	}

	let { matchData }: Props = $props();

	const patternsWithData = $derived(
		Object.keys(matchData.patterns).filter(
			(p) => matchData.patterns[p].companyCount > 0 || matchData.patterns[p].userCount > 0
		)
	);

	const chartData = $derived.by(() => {
		const masteryDataPoints = patternsWithData.map((p) => matchData.patterns[p].mastery);
		const companyDataPoints = patternsWithData.map((p) => matchData.company.patternFrequencies[p] ?? 0);
		const companyCounts = patternsWithData.map((p) => matchData.company.patternCounts[p] ?? 0);
		const optimalCounts = patternsWithData.map((p) => matchData.patterns[p].userOptimal);

		return {
			labels: patternsWithData,
			primary: {
				label: 'Mastery (Optimal Only)',
				data: masteryDataPoints,
				counts: optimalCounts,
				color: 'hsl(142, 76%, 36%)'
			},
			comparison: {
				label: matchData.company.name,
				data: companyDataPoints,
				counts: companyCounts,
				color: matchData.company.color
			}
		};
	});
</script>

<div class="flex flex-col h-full">
	<h3 class="mb-2 text-lg font-semibold">Mastery View</h3>
	<p class="mb-4 text-sm text-muted-foreground">
		Only counts problems solved optimally. Requires 3+ optimal solutions for mastery. More stringent than coverage.
	</p>

	<div class="h-[320px] w-full">
		{#if chartData.labels.length > 0}
			<RadarChart
				labels={chartData.labels}
				primaryData={chartData.primary}
				comparisonData={chartData.comparison}
				totalQuestionsAnswered={matchData.user.totalAttempted}
			/>
		{:else}
			<div class="flex h-full items-center justify-center text-muted-foreground">
				No data available.
			</div>
		{/if}
	</div>

	<div class="mt-4">
		<h4 class="mb-2 text-sm font-semibold">Mastery Levels</h4>
		<div class="space-y-1 text-xs">
			{#each patternsWithData.filter((p) => matchData.patterns[p].userOptimal > 0) as pattern (pattern)}
				{@const m = matchData.patterns[pattern]}
				<div class="flex items-center justify-between">
					<span>{pattern}:</span>
					<span
						class="font-medium {m.level === 'master'
							? 'text-green-600 dark:text-green-400'
							: m.level === 'advanced'
								? 'text-blue-600 dark:text-blue-400'
								: m.level === 'intermediate'
									? 'text-amber-600 dark:text-amber-400'
									: 'text-slate-600 dark:text-slate-400'}"
					>
						{m.level} ({m.userOptimal}/{m.companyCount})
					</span>
				</div>
			{/each}
		</div>
	</div>
</div>
