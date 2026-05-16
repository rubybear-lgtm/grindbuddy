<script lang="ts">
	import ProblemCard from '$lib/components/dashboard/ProblemCard.svelte';
	import ZeroState from '$lib/components/dashboard/ZeroState.svelte';
	import { logsStore } from '$lib/stores/logsStore';
	import { Play, Sparkles, Trophy, Zap, Clock, Brain, Activity, ShieldCheck, Cpu, ArrowUpRight } from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import { openSearchModal, openLogModal } from '$lib/stores/logsStore';

	// Mock mastery stats for institutional feel
	const masteryStats = {
		streak: 12,
		mastered: 45,
		today: logsStore.reviewQueue.length,
		recallStability: 84
	};
</script>

<div class="mx-auto max-w-7xl px-8 py-16 space-y-12">
	<!-- High-Contrast Header -->
	<header class="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-border pb-12">
		<div class="space-y-4">
			<div class="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
				<Activity class="h-3 w-3" />
				Daily review
			</div>
			<h1 class="text-h2 text-foreground">Dashboard</h1>
			<p class="text-muted-foreground text-xl font-medium tracking-tight">Your spaced repetition queue for today.</p>
		</div>

		<div class="flex gap-6">
			<div class="glass-panel px-8 py-4 rounded-2xl flex flex-col gap-1 min-w-[160px]">
				<span class="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Retention</span>
				<div class="text-3xl font-black text-foreground tabular tracking-tightest">{masteryStats.recallStability}%</div>
			</div>
			<div class="glass-panel px-8 py-4 rounded-2xl flex flex-col gap-1 min-w-[160px]">
				<span class="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Streak</span>
				<div class="text-3xl font-black text-foreground tabular tracking-tightest">{masteryStats.streak} days</div>
			</div>
		</div>
	</header>

	<!-- Bento Grid Dashboard -->
	<div class="grid grid-cols-1 md:grid-cols-12 gap-8">
		<!-- Primary Session Control -->
		<div class="md:col-span-8 group relative overflow-hidden rounded-[3rem] bg-card border border-border p-16 transition-all hover:bg-muted/50">
			<div class="absolute inset-0 shimmer-green opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
			<div class="relative z-10 flex flex-col h-full">
				<div class="space-y-8 max-w-lg">
					<div class="space-y-4">
						<h2 class="text-6xl font-black text-foreground tracking-tightest uppercase italic leading-none">Ready to <br/><span class="text-primary">review?</span></h2>
						<p class="text-2xl text-muted-foreground font-medium leading-tight">
							You have <span class="text-foreground font-bold">{masteryStats.today} problems</span> due for review today.
						</p>
					</div>

					<div class="flex flex-wrap gap-6 pt-4">
						<Button size="lg" onclick={() => logsStore.reviewQueue.length > 0 && openLogModal(logsStore.reviewQueue[0])} class="!rounded-md h-18 px-12 bg-primary text-primary-foreground text-xl !font-black tracking-widest shadow-[0_0_50px_oklch(var(--primary)/0.3)] hover:scale-105 transition-all disabled:opacity-40" disabled={logsStore.reviewQueue.length === 0}>
							<Play class="mr-3 h-6 w-6 fill-current" />
							Start review
						</Button>
						<Button variant="ghost" onclick={openSearchModal} class="!rounded-md h-18 px-10 text-lg !font-black border border-border hover:bg-muted text-foreground tracking-widest">
							Log a problem
						</Button>
					</div>
				</div>
			</div>
			<!-- Decorative Background Icon -->
			<Zap class="absolute -right-20 -bottom-20 h-96 w-96 text-primary/5 -rotate-12 pointer-events-none" />
		</div>

		<!-- Secondary Stats Stack -->
		<div class="md:col-span-4 grid grid-rows-2 gap-8">
			<!-- Patterns Mastered -->
			<div class="rounded-[2.5rem] bg-card border border-border p-10 flex flex-col justify-between group">
				<div class="space-y-4">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
						<Brain class="h-7 w-7 fill-current" />
					</div>
					<p class="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Patterns mastered</p>
					<div class="text-5xl font-black text-foreground tabular tracking-tightest">{masteryStats.mastered}</div>
				</div>
				<p class="text-xs font-medium text-muted-foreground opacity-60">Problems you've solved cleanly and reviewed enough to retain.</p>
			</div>

			<!-- Time Estimation -->
			<div class="rounded-[2.5rem] bg-card border border-border p-10 flex flex-col justify-between group">
				<div class="space-y-4">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-cyan/10 text-brand-cyan group-hover:scale-110 transition-transform">
						<Clock class="h-7 w-7" />
					</div>
					<p class="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Est. time today</p>
					<div class="text-5xl font-black text-foreground tabular tracking-tightest">{masteryStats.today * 12}<span class="text-xl text-muted-foreground ml-1">min</span></div>
				</div>
				<p class="text-xs font-medium text-muted-foreground opacity-60">Based on your average time per problem.</p>
			</div>
		</div>

		<!-- Priority Stream -->
		<div class="md:col-span-12 space-y-8 pt-12">
			<div class="flex items-center justify-between border-b border-border pb-6">
				<h3 class="text-2xl font-black text-foreground tracking-tightest uppercase italic">Due for review</h3>
				<span class="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">Most overdue first</span>
			</div>

			{#if logsStore.reviewQueue.length === 0}
				<ZeroState />
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{#each logsStore.reviewQueue.slice(0, 6) as problem (problem.id)}
						<ProblemCard {problem} />
					{/each}
				</div>
				
				{#if logsStore.reviewQueue.length > 6}
					<div class="pt-12 text-center">
						<Button variant="ghost" class="text-sm font-black tracking-widest text-primary hover:bg-primary/5 uppercase">
							Show all {logsStore.reviewQueue.length} problems
						</Button>
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>
