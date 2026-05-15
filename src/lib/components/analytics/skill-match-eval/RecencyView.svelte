<script lang="ts">
	import RadarChart from '$lib/components/common/RadarChart.svelte';
	import type { SkillMatchPayload } from '$lib/utils/skillMatch.v2';

	interface Props {
		matchData: SkillMatchPayload;
	}

	let { matchData }: Props = $props();

	let timeWindowDays = $state(90);

	const patternsWithData = $derived(
		Object.keys(matchData.patterns).filter(
			(p) => matchData.patterns[p].companyCount > 0 || matchData.patterns[p].userCount > 0
		)
	);

	const chartData = $derived.by(() => {
		const recencyDataPoints = patternsWithData.map((p) => matchData.patterns[p].recency);
		const companyDataPoints = patternsWithData.map((p) => matchData.company.patternFrequencies[p] ?? 0);
		const companyCounts = patternsWithData.map((p) => matchData.company.patternCounts[p] ?? 0);
		const userCounts = patternsWithData.map((p) => matchData.patterns[p].userCount);

		return {
			labels: patternsWithData,
			primary: {
				label: 'Recency Weighted',
				data: recencyDataPoints,
				counts: userCounts,
				color: 'hsl(217, 91%, 60%)'
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
	<h3 class="mb-2 text-lg font-semibold">Recency-Weighted View</h3>
	<p class="mb-4 text-sm text-muted-foreground">
		Recent problems count more heavily. Focuses on current skill level, not historical data.
	</p>

	<div class="mb-4">
		<label for="time-window" class="block text-xs font-medium mb-1">Time Window (days)</label>
		<select
			id="time-window"
			bind:value={timeWindowDays}
			class="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
		>
			<option value={30}>30 days</option>
			<option value={60}>60 days</option>
			<option value={90}>90 days</option>
			<option value={180}>180 days</option>
		</select>
	</div>

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

	<div class="mt-4 text-xs text-muted-foreground">
		<p>
			Showing problems from the last {timeWindowDays} days. Older problems are weighted less.
		</p>
	</div>
</div>
