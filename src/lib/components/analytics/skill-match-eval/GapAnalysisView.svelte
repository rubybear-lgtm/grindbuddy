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
		const gapDataPoints = patternsWithData.map((p) => matchData.patterns[p].gap);
		const companyDataPoints = patternsWithData.map((p) => matchData.company.patternFrequencies[p] ?? 0);
		const companyCounts = patternsWithData.map((p) => matchData.company.patternCounts[p] ?? 0);
		const userCounts = patternsWithData.map((p) => matchData.patterns[p].userCount);

		return {
			labels: patternsWithData,
			primary: {
				label: 'Gap Score',
				data: gapDataPoints,
				counts: userCounts,
				color: 'hsl(0, 84%, 60%)'
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
	<h3 class="mb-2 text-lg font-semibold">Gap Analysis View</h3>
	<p class="mb-4 text-sm text-muted-foreground">
		Shows what's missing: 0 = ready (no gap), higher = bigger gap. Focus on areas with larger gaps.
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

	{#if matchData.recommendations.length > 0}
		<div class="mt-4">
			<h4 class="mb-2 text-sm font-semibold">Recommendations</h4>
			<ul class="space-y-1">
				{#each matchData.recommendations.slice(0, 3) as rec (rec.pattern)}
					<li
						class="text-xs {rec.priority === 'high'
							? 'text-red-600 dark:text-red-400'
							: rec.priority === 'medium'
								? 'text-amber-600 dark:text-amber-400'
								: 'text-slate-600 dark:text-slate-400'}"
					>
						{rec.message} (Gap: {rec.gap.toFixed(1)})
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
