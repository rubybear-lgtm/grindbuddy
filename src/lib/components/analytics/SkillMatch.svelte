<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import { Label } from '$lib/components/ui/label';
	import RadarChart from '$lib/components/common/RadarChart.svelte';
	import PatternFrequencyTable from './PatternFrequencyTable.svelte';
	import type { Pattern } from '$lib/types';
	import { RefreshCw } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import type { SkillMatchPayload } from '$lib/utils/skillMatch.v2';

	let companies = $state<{ name: string; slug: string }[]>([]);
	let selectedCompanySlug = $state('google');
	let isRefreshing = $state(false);
	let matchData = $state<SkillMatchPayload | null>(null);

	async function loadCompanies() {
		const res = await fetch('/api/companies');
		companies = await res.json();
	}

	async function loadMatchData(slug: string) {
		isRefreshing = true;
		try {
			const res = await fetch(`/api/companies/${slug}/match`);
			if (res.ok) {
				matchData = await res.json();
			}
		} finally {
			isRefreshing = false;
		}
	}

	onMount(() => {
		loadCompanies();
		loadMatchData(selectedCompanySlug);
	});

	$effect(() => {
		if (selectedCompanySlug) {
			loadMatchData(selectedCompanySlug);
		}
	});

	const CORE_PATTERNS: Pattern[] = [
		'Arrays & Hashing',
		'Two Pointers',
		'Sliding Window',
		'Stack',
		'Binary Search',
		'Linked List',
		'Trees',
		'Backtracking',
		'Graphs',
		'1-D Dynamic Programming'
	];

	const chartData = $derived.by(() => {
		if (!matchData) {
			return { labels: [], primary: { label: 'You', data: [], color: '' }, comparison: { label: '', data: [], color: '' } };
		}

		const patterns = matchData.company.patternFrequencies;
		const patternCounts = matchData.company.patternCounts;

		const patternsWithData = CORE_PATTERNS.filter((pattern) => {
			const userValue = matchData?.patterns[pattern]?.composite ?? 0;
			const companyValue = patterns[pattern] ?? 0;
			return userValue > 0 || companyValue > 0;
		});

		const userDataPoints = patternsWithData.map((pattern) => matchData?.patterns[pattern]?.composite ?? 0);
		const companyDataPoints = patternsWithData.map((pattern) => patterns[pattern] ?? 0);
		const companyCounts = patternsWithData.map((pattern) => patternCounts[pattern] ?? 0);
		const userCounts = patternsWithData.map((pattern) => matchData?.patterns[pattern]?.userCount ?? 0);

		return {
			labels: patternsWithData,
			primary: {
				label: 'You',
				data: userDataPoints,
				counts: userCounts,
				color: 'hsl(217, 91%, 60%)'
			},
			comparison: {
				label: matchData.company.name,
				data: companyDataPoints,
				counts: companyCounts,
				color: matchData.company.color || '#6366f1'
			}
		};
	});
</script>

<div class="flex flex-col h-full">
	<p class="mb-4 text-sm text-muted-foreground">
		Compare your skill profile against our estimated requirements for top tech companies.
	</p>
	{#if matchData && matchData.company.totalProblems}
		<p class="mb-4 text-xs text-muted-foreground">
			Pattern frequency shows what percentage of {matchData.company.name}'s interview questions test each pattern.
			Values are calculated from {matchData.company.totalProblems} actual interview questions.
		</p>
	{/if}

	<div class="mb-6 flex items-center gap-4">
		<div class="grid w-full max-w-sm items-center gap-1.5">
			<Label for="company-select">Target Company</Label>
			<div class="flex items-center gap-2">
				<select
					id="company-select"
					bind:value={selectedCompanySlug}
					class="flex h-10 w-[240px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				>
					{#each companies as company (company.slug)}
						<option value={company.slug}>{company.name}</option>
					{/each}
				</select>
				<button
					class="p-2 rounded-md border border-input hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
					onclick={() => loadMatchData(selectedCompanySlug)}
					disabled={isRefreshing}
					aria-label="Refresh analysis"
				>
					<RefreshCw class="h-4 w-4 {isRefreshing ? 'animate-spin' : ''}" />
				</button>
			</div>
		</div>
	</div>

	<div class="h-[320px] w-full">
		{#if isRefreshing}
			<div class="flex h-full items-center justify-center text-muted-foreground">
				Loading company data...
			</div>
		{:else if chartData.labels.length > 0}
			<RadarChart
				labels={chartData.labels}
				primaryData={chartData.primary}
				comparisonData={chartData.comparison}
				totalQuestionsAnswered={matchData?.user.totalAttempted ?? 0}
			/>
		{:else if !matchData}
			<div class="flex h-full items-center justify-center text-muted-foreground">
				Select a company to see the comparison.
			</div>
		{:else}
			<div class="flex h-full items-center justify-center text-muted-foreground">
				No data available for this company.
			</div>
		{/if}
	</div>

	{#if matchData && Object.keys(matchData.company.patternFrequencies).length > 0}
		<div class="mt-auto pt-8">
			<PatternFrequencyTable
				patterns={matchData.company.patternFrequencies}
				patternCounts={matchData.company.patternCounts}
				totalProblems={matchData.company.totalProblems}
				companyName={matchData.company.name}
			/>
		</div>
	{/if}
</div>
