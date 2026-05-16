<script lang="ts">
	import { browser } from '$app/environment';
	import ChartJS, { type Chart, type ChartConfiguration } from 'chart.js/auto';
	import { logsStore } from '$lib/stores/logsStore';
	import type { Status, Log } from '$lib/types';

	let canvasEl: HTMLCanvasElement | null = null;
	let chart: Chart | null = null;

	const statusCounts = $derived.by(() => {
		const counts: Record<Status, number> = {
			Optimal: 0,
			Suboptimal: 0,
			Hints: 0,
			Solution: 0,
			Failed: 0
		};

		logsStore.logs.forEach((log: Log) => {
			counts[log.status]++;
		});

		return counts;
	});

	const chartConfig = $derived.by(() => {
		const data = {
			labels: ['Optimal', 'Suboptimal', 'Hints', 'Solution', 'Failed'],
			datasets: [
				{
					data: [
						statusCounts.Optimal,
						statusCounts.Suboptimal,
						statusCounts.Hints,
						statusCounts.Solution,
						statusCounts.Failed
					],
					backgroundColor: [
						'rgb(16, 185, 129)', // emerald-600
						'rgb(245, 158, 11)', // amber-500
						'rgb(59, 130, 246)', // blue-500
						'rgb(168, 85, 247)', // purple-500
						'rgb(225, 29, 72)' // rose-600
					]
				}
			]
		};

		const options: ChartConfiguration['options'] = {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					position: 'bottom'
				}
			}
		};

		return { type: 'doughnut', data, options } satisfies ChartConfiguration;
	});

	$effect(() => {
		if (!browser || !canvasEl) return;

		if (chart) {
			chart.destroy();
			chart = null;
		}

		const configCopy = JSON.parse(JSON.stringify(chartConfig));
		chart = new ChartJS(canvasEl, configCopy);

		return () => {
			chart?.destroy();
			chart = null;
		};
	});
</script>

<div class="h-64">
	<canvas bind:this={canvasEl} class="h-full w-full"></canvas>
</div>

