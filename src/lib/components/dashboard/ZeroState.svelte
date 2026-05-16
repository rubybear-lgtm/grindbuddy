<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { CheckCircle2 } from '@lucide/svelte';
	import { openSearchModal } from '$lib/stores/logsStore';
</script>

<div class="flex flex-col items-center justify-center py-20 text-center">
	<div class="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
		<CheckCircle2 class="h-8 w-8 text-primary" />
	</div>
	<h2 class="mb-2 text-xl font-black text-foreground uppercase tracking-tight">
		All caught up
	</h2>
	<p class="mb-8 text-muted-foreground font-medium">
		Nothing due today. Log a new problem to keep building.
	</p>
	<Button
		onclick={openSearchModal}
		class="!rounded-md px-6 !text-[10px] !font-black tracking-widest border border-white/10 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
		variant="ghost"
	>
		Log a problem
	</Button>
</div>
