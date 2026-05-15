<script lang="ts">
	import RadarChart from '$lib/components/common/RadarChart.svelte';
	import type { SkillMatchPayload } from '$lib/utils/skillMatch.v2';

	interface Props {
		matchData: SkillMatchPayload;
	}

	let { matchData }: Props = $props();

	type ViewMode = 'gap' | 'mastery' | 'recency' | 'hybrid';
	let viewMode = $state<ViewMode>('hybrid');

	let gapWeight = $state(40);
	let masteryWeight = $state(30);
	let recencyWeight = $state(30);

	const patternsWithData = $derived(
		Object.keys(matchData.patterns).filter(
			(p) => matchData.patterns[p].companyCount > 0 || matchData.patterns[p].userCount > 0
		)
	);

	const hybridScores = $derived.by(() => {
		const scores: Record<string, number> = {};
		const totalWeight = gapWeight + masteryWeight + recencyWeight;

		for (const pattern of patternsWithData) {
			const g = matchData.patterns[pattern].gap;
			const m = matchData.patterns[pattern].mastery;
			const r = matchData.patterns[pattern].recency;
			const gapNormalized = 100 - g;
			scores[pattern] =
				(gapNormalized * gapWeight + m * masteryWeight + r * recencyWeight) / totalWeight;
		}

		return scores;
	});

	const chartData = $derived.by(() => {
		const companyDataPoints = patternsWithData.map((p) => matchData.company.patternFrequencies[p] ?? 0);
		const companyCounts = patternsWithData.map((p) => matchData.company.patternCounts[p] ?? 0);

		let dataPoints: number[] = [];
		let label = '';
		let color = '';

		if (viewMode === 'gap') {
			dataPoints = patternsWithData.map((p) => matchData.patterns[p].gap);
			label = 'Gap Score';
			color = 'hsl(0, 84%, 60%)';
		} else if (viewMode === 'mastery') {
			dataPoints = patternsWithData.map((p) => matchData.patterns[p].mastery);
			label = 'Mastery';
			color = 'hsl(142, 76%, 36%)';
		} else if (viewMode === 'recency') {
			dataPoints = patternsWithData.map((p) => matchData.patterns[p].recency);
			label = 'Recency Weighted';
			color = 'hsl(217, 91%, 60%)';
		} else {
			dataPoints = patternsWithData.map((p) => hybridScores[p]);
			label = 'Hybrid Score';
			color = 'hsl(262, 83%, 58%)';
		}

		return {
			labels: patternsWithData,
			primary: {
				label,
				data: dataPoints,
				counts: dataPoints,
				color
			},
			comparison: {
				label: matchData.company.name,
				data: companyDataPoints,
				counts: companyCounts,
				color: matchData.company.color
			}
		};
	});

	function normalizeWeights() {
		const total = gapWeight + masteryWeight + recencyWeight;
		if (total !== 100) {
			const factor = 100 / total;
			gapWeight = Math.round(gapWeight * factor);
			masteryWeight = Math.round(masteryWeight * factor);
			recencyWeight = 100 - gapWeight - masteryWeight;
		}
	}
</script>

<div class="flex flex-col h-full">
	<h3 class="mb-2 text-lg font-semibold">Hybrid View</h3>
	<p class="mb-4 text-sm text-muted-foreground">
		Combines multiple approaches. Select a view mode or customize weights for hybrid scoring.
	</p>

	<div class="mb-4 space-y-3">
		<div>
			<label for="view-mode" class="block text-xs font-medium mb-1">View Mode</label>
			<select
				id="view-mode"
				bind:value={viewMode}
				class="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
			>
				<option value="hybrid">Hybrid (Combined)</option>
				<option value="gap">Gap Analysis</option>
				<option value="mastery">Mastery</option>
				<option value="recency">Recency Weighted</option>
			</select>
		</div>

		{#if viewMode === 'hybrid'}
			<div class="space-y-2">
				<div>
					<label for="gap-weight" class="block text-xs font-medium mb-1">
						Gap Weight: {gapWeight}%
					</label>
					<input
						id="gap-weight"
						type="range"
						min="0"
						max="100"
						bind:value={gapWeight}
						oninput={normalizeWeights}
						class="w-full"
					/>
				</div>
				<div>
					<label for="mastery-weight" class="block text-xs font-medium mb-1">
						Mastery Weight: {masteryWeight}%
					</label>
					<input
						id="mastery-weight"
						type="range"
						min="0"
						max="100"
						bind:value={masteryWeight}
						oninput={normalizeWeights}
						class="w-full"
					/>
				</div>
				<div>
					<label for="recency-weight" class="block text-xs font-medium mb-1">
						Recency Weight: {recencyWeight}%
					</label>
					<input
						id="recency-weight"
						type="range"
						min="0"
						max="100"
						bind:value={recencyWeight}
						oninput={normalizeWeights}
						class="w-full"
					/>
				</div>
			</div>
		{/if}
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
</div>
