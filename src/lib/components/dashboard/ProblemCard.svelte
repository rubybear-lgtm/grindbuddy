<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import DifficultyBadge from '$lib/components/ui/DifficultyBadge.svelte';
	import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
	import { ExternalLink } from '@lucide/svelte';
	import type { ProblemWithLogs } from '$lib/types';
	import { openLogModal, openDetailsModal } from '$lib/stores/logsStore';

	let { problem }: { problem: ProblemWithLogs } = $props();

	function formatRelativeTime(date: Date | string) {
		const now = new Date();
		const logDate = new Date(date);
		const diffInHours = Math.floor((now.getTime() - logDate.getTime()) / (1000 * 60 * 60));

		if (diffInHours < 1) return 'Just now';
		if (diffInHours < 24) return `${diffInHours}h ago`;
		const diffInDays = Math.floor(diffInHours / 24);
		return `${diffInDays}d ago`;
	}

	const isNew = $derived(!problem.lastLog);
</script>

<div
	class="group relative flex flex-col overflow-hidden rounded-3xl bg-card border border-border p-8 transition-colors hover:border-primary/30 cursor-pointer
		{isNew ? 'border-l-2 border-l-primary/40' : ''}"
	onclick={() => openDetailsModal(problem)}
	role="button"
	tabindex="0"
	onkeydown={(e) => e.key === 'Enter' && openDetailsModal(problem)}
>
	<div class="flex flex-col h-full gap-5">
		<!-- Header -->
		<div class="flex items-start justify-between gap-3">
			<span class="text-[10px] font-mono text-primary/50 font-bold uppercase tracking-widest mt-0.5">
				#{problem.number}
			</span>
			<DifficultyBadge difficulty={problem.difficulty} />
		</div>

		<h3 class="text-xl font-black text-foreground tracking-tight leading-tight uppercase group-hover:text-primary transition-colors">
			{problem.title}
		</h3>

		<!-- Patterns -->
		{#if problem.patterns.length > 0}
			<div class="flex flex-wrap gap-1.5">
				{#each problem.patterns.slice(0, 3) as pattern (pattern)}
					<span class="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
						{pattern}
					</span>
				{/each}
				{#if problem.patterns.length > 3}
					<span class="text-[11px] text-muted-foreground/40">+{problem.patterns.length - 3}</span>
				{/if}
			</div>
		{/if}

		<!-- Footer -->
		<div class="mt-auto pt-5 border-t border-border flex items-center justify-between gap-3">
			<div class="flex items-center gap-2 min-w-0">
				{#if problem.lastLog}
					<StatusBadge status={problem.lastLog.status} />
					<span class="text-[10px] font-mono text-muted-foreground uppercase tracking-widest tabular truncate">
						{formatRelativeTime(problem.lastLog.timestamp)}
					</span>
				{:else}
					<span class="text-[10px] font-mono text-primary/40 uppercase tracking-widest">New</span>
				{/if}
			</div>

			<div class="flex items-center gap-2 shrink-0">
				<a
					href={problem.leetcodeUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="text-muted-foreground/50 hover:text-primary transition-colors"
					onclick={(e) => e.stopPropagation()}
					aria-label="Open on LeetCode"
				>
					<ExternalLink class="h-4 w-4" />
				</a>
				<Button
					variant="ghost"
					size="sm"
					onclick={(e) => { e.stopPropagation(); openLogModal(problem); }}
					class="!rounded-md h-8 !px-4 !text-[10px] !font-black tracking-widest border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
				>
					Log
				</Button>
			</div>
		</div>
	</div>
</div>
