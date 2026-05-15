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

	const easyChart = $derived.by(() => ({
		labels: patternsWithData,
		primary: {
			label: 'Easy Gap',
			data: patternsWithData.map((p) =>
				Math.max(0, matchData.patterns[p].companyDifficulty.easy - matchData.patterns[p].userDifficulty.easy)
			),
			counts: patternsWithData.map((p) => matchData.patterns[p].userDifficulty.easy),
			color: 'hsl(142, 76%, 36%)'
		},
		comparison: {
			label: matchData.company.name,
			data: patternsWithData.map((p) => matchData.patterns[p].companyDifficulty.easy),
			counts: patternsWithData.map((p) => matchData.patterns[p].companyDifficulty.easy),
			color: matchData.company.color
		}
	}));

	const mediumChart = $derived.by(() => ({
		labels: patternsWithData,
		primary: {
			label: 'Medium Gap',
			data: patternsWithData.map((p) =>
				Math.max(0, matchData.patterns[p].companyDifficulty.medium - matchData.patterns[p].userDifficulty.medium)
			),
			counts: patternsWithData.map((p) => matchData.patterns[p].userDifficulty.medium),
			color: 'hsl(45, 93%, 47%)'
		},
		comparison: {
			label: matchData.company.name,
			data: patternsWithData.map((p) => matchData.patterns[p].companyDifficulty.medium),
			counts: patternsWithData.map((p) => matchData.patterns[p].companyDifficulty.medium),
			color: matchData.company.color
		}
	}));

	const hardChart = $derived.by(() => ({
		labels: patternsWithData,
		primary: {
			label: 'Hard Gap',
			data: patternsWithData.map((p) =>
				Math.max(0, matchData.patterns[p].companyDifficulty.hard - matchData.patterns[p].userDifficulty.hard)
			),
			counts: patternsWithData.map((p) => matchData.patterns[p].userDifficulty.hard),
			color: 'hsl(0, 84%, 60%)'
		},
		comparison: {
			label: matchData.company.name,
			data: patternsWithData.map((p) => matchData.patterns[p].companyDifficulty.hard),
			counts: patternsWithData.map((p) => matchData.patterns[p].companyDifficulty.hard),
			color: matchData.company.color
		}
	}));
</script>

<div class="flex flex-col h-full">
	<h3 class="mb-2 text-lg font-semibold">Difficulty-Specific View</h3>
	<p class="mb-4 text-sm text-muted-foreground">
		Shows gaps separately for Easy, Medium, and Hard problems.
	</p>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
		<div>
			<h4 class="mb-2 text-sm font-semibold text-green-600 dark:text-green-400">Easy</h4>
			<div class="h-[240px] w-full">
				{#if easyChart.labels.length > 0}
					<RadarChart
						labels={easyChart.labels}
						primaryData={easyChart.primary}
						comparisonData={easyChart.comparison}
						totalQuestionsAnswered={matchData.user.totalAttempted}
					/>
				{:else}
					<div class="flex h-full items-center justify-center text-xs text-muted-foreground">
						No Easy gaps
					</div>
				{/if}
			</div>
		</div>

		<div>
			<h4 class="mb-2 text-sm font-semibold text-amber-600 dark:text-amber-400">Medium</h4>
			<div class="h-[240px] w-full">
				{#if mediumChart.labels.length > 0}
					<RadarChart
						labels={mediumChart.labels}
						primaryData={mediumChart.primary}
						comparisonData={mediumChart.comparison}
						totalQuestionsAnswered={matchData.user.totalAttempted}
					/>
				{:else}
					<div class="flex h-full items-center justify-center text-xs text-muted-foreground">
						No Medium gaps
					</div>
				{/if}
			</div>
		</div>

		<div>
			<h4 class="mb-2 text-sm font-semibold text-red-600 dark:text-red-400">Hard</h4>
			<div class="h-[240px] w-full">
				{#if hardChart.labels.length > 0}
					<RadarChart
						labels={hardChart.labels}
						primaryData={hardChart.primary}
						comparisonData={hardChart.comparison}
						totalQuestionsAnswered={matchData.user.totalAttempted}
					/>
				{:else}
					<div class="flex h-full items-center justify-center text-xs text-muted-foreground">
						No Hard gaps
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
