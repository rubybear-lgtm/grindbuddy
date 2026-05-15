<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import GapAnalysisView from '$lib/components/analytics/skill-match-eval/GapAnalysisView.svelte';
	import MasteryView from '$lib/components/analytics/skill-match-eval/MasteryView.svelte';
	import RecencyView from '$lib/components/analytics/skill-match-eval/RecencyView.svelte';
	import DifficultySpecificView from '$lib/components/analytics/skill-match-eval/DifficultySpecificView.svelte';
	import HybridView from '$lib/components/analytics/skill-match-eval/HybridView.svelte';
	import { Label } from '$lib/components/ui/label';
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
</script>

<div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
	<div class="mb-6">
		<h1 class="mb-2 text-h1">Skill Match Evaluation</h1>
		<p class="text-sm text-muted-foreground">
			Compare different Skill Match approaches side-by-side. This is a temporary evaluation page.
		</p>
	</div>

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

	{#if isRefreshing}
		<div class="flex h-96 items-center justify-center text-muted-foreground">
			Loading company data...
		</div>
	{:else if matchData}
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<Card class="p-6 flex flex-col min-h-[600px]">
				<GapAnalysisView {matchData} />
			</Card>

			<Card class="p-6 flex flex-col min-h-[600px]">
				<MasteryView {matchData} />
			</Card>

			<Card class="p-6 flex flex-col min-h-[600px]">
				<RecencyView {matchData} />
			</Card>

			<Card class="p-6 flex flex-col min-h-[600px] lg:col-span-2">
				<DifficultySpecificView {matchData} />
			</Card>

			<Card class="p-6 flex flex-col min-h-[600px] lg:col-span-2">
				<HybridView {matchData} />
			</Card>
		</div>
	{:else}
		<div class="flex h-96 items-center justify-center text-muted-foreground">
			Select a company to see the comparison.
		</div>
	{/if}
</div>
