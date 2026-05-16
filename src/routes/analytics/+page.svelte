<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import PatternMasteryChart from '$lib/components/analytics/PatternMasteryChart.svelte';
	import ActivityHeatmap from '$lib/components/analytics/ActivityHeatmap.svelte';
	import StatusBreakdown from '$lib/components/analytics/StatusBreakdown.svelte';
	import SkillMatch from '$lib/components/analytics/SkillMatch.svelte';
	import { logsStore } from '$lib/stores/logsStore';
	import { browser } from '$app/environment';
	import { Activity, Target, BarChart3 } from '@lucide/svelte';

	// Reactive: true once the store has data (no artificial delay needed with $effect.pre)
	const isDataLoaded = $derived(browser && logsStore.problems.length > 0);
</script>

<div class="mx-auto max-w-7xl px-8 py-16 space-y-16">
	<!-- Institutional Header -->
	<header class="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border pb-12">
		<div class="space-y-4">
			<div class="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
				<Activity class="h-3 w-3" />
				Progress
			</div>
			<h1 class="text-h2 text-foreground italic leading-none">Analytics</h1>
			<p class="text-muted-foreground text-xl font-medium tracking-tight">How your LeetCode retention and pattern coverage are trending over time.</p>
		</div>
	</header>

	{#if !isDataLoaded}
		<div class="flex h-96 items-center justify-center">
			<div class="flex flex-col items-center gap-4">
				<Activity class="h-10 w-10 text-primary animate-pulse" />
				<span class="text-xs font-black text-muted-foreground uppercase tracking-[0.4em]">Loading your data...</span>
			</div>
		</div>
	{:else}
		<!-- Analytics Bento Grid -->
		<div class="grid grid-cols-1 md:grid-cols-12 gap-8 auto-rows-min">

			<!-- Skill Match - Primary Focus -->
			<div class="md:col-span-8 rounded-[3rem] bg-card border border-border p-12 transition-all hover:bg-muted/50 relative overflow-hidden group">
				<div class="absolute inset-0 shimmer-green opacity-0 group-hover:opacity-100 transition-opacity"></div>
				<div class="relative z-10 space-y-12">
					<div class="flex items-center justify-between border-b border-border pb-8">
						<div class="space-y-2">
							<div class="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Interview readiness</div>
							<h2 class="text-4xl font-black text-foreground tracking-tightest uppercase italic leading-none">Skill match</h2>
						</div>
						<div class="h-12 w-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
							<Target class="h-6 w-6" />
						</div>
					</div>
					<div class="min-h-[400px]">
						<SkillMatch />
					</div>
				</div>
			</div>

			<!-- Pattern Mastery Radar -->
			<div class="md:col-span-4 rounded-[3rem] bg-card border border-border p-10 flex flex-col justify-between group">
				<div class="space-y-8">
					<div class="space-y-2">
						<div class="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Pattern coverage</div>
						<h2 class="text-3xl font-black text-foreground tracking-tightest uppercase italic leading-none">Pattern map</h2>
					</div>
					<div class="min-h-[300px] flex items-center justify-center">
						<PatternMasteryChart />
					</div>
				</div>
				<p class="text-xs font-medium text-muted-foreground opacity-60 pt-8 border-t border-border">Problems attempted per pattern category, as a percentage of your total attempts.</p>
			</div>

			<!-- Activity Heatmap -->
			<div class="md:col-span-12 rounded-[3rem] bg-card border border-border p-12 group overflow-hidden">
				<div class="flex items-center justify-between mb-12">
					<div class="space-y-2">
						<div class="text-[10px] font-black text-brand-cyan uppercase tracking-[0.4em]">Practice activity</div>
						<h2 class="text-4xl font-black text-foreground tracking-tightest uppercase italic leading-none">Grind history</h2>
					</div>
					<div class="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
						<span class="flex items-center gap-1.5"><div class="h-2 w-2 rounded-sm bg-white/10"></div> Low</span>
						<div class="h-px w-8 bg-muted"></div>
						<span class="flex items-center gap-1.5"><div class="h-2 w-2 rounded-sm bg-primary shadow-[0_0_8px_oklch(var(--primary)/0.6)]"></div> High</span>
					</div>
				</div>
				<div class="overflow-x-auto pb-4">
					<ActivityHeatmap />
				</div>
			</div>

			<!-- Status Breakdown -->
			<div class="md:col-span-12 rounded-[3rem] bg-card border border-border p-12 lg:grid lg:grid-cols-2 gap-20 items-center">
				<div class="space-y-10">
					<div class="space-y-4">
						<div class="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
							<BarChart3 class="h-3.5 w-3.5" />
							Solve quality
						</div>
						<h2 class="text-5xl font-black text-foreground tracking-tightest uppercase italic leading-none">How well are you solving?</h2>
						<p class="text-xl text-muted-foreground font-medium leading-snug">
							A breakdown of how cleanly you've solved each problem — clean, optimal, or needed help.
						</p>
					</div>

					<div class="grid grid-cols-2 gap-8 pt-6">
						<div class="space-y-1">
							<span class="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Clean solves</span>
							<div class="text-3xl font-black text-primary tabular tracking-tightest">94.2%</div>
						</div>
						<div class="space-y-1">
							<span class="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Consistency</span>
							<div class="text-3xl font-black text-brand-cyan tabular tracking-tightest">A+</div>
						</div>
					</div>
				</div>
				<div class="mt-12 lg:mt-0 min-h-[300px]">
					<StatusBreakdown />
				</div>
			</div>

		</div>
	{/if}
</div>
