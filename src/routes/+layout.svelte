<script lang="ts">
	import { page } from '$app/state';
	import '../routes/layout.css';
	import { ModeWatcher } from 'mode-watcher';
	import DesktopNav from '$lib/components/nav/DesktopNav.svelte';
	import MobileNav from '$lib/components/nav/MobileNav.svelte';
	import ProblemSearchModal from '$lib/components/modals/ProblemSearchModal.svelte';
	import LogDetailsModal from '$lib/components/modals/LogDetailsModal.svelte';
	import { logsStore, closeSearchModal, closeLogModal, closeDetailsModal, initializeStores } from '$lib/stores/logsStore';
	import ProblemDetailsModal from '$lib/components/modals/ProblemDetailsModal.svelte';
	import ModeToggle from '$lib/components/ModeToggle.svelte';

	let { data, children } = $props();

	// Initialize stores before DOM updates so child components render with data
	$effect.pre(() => {
		if (data.problems && data.logs) {
			initializeStores({
				problems: data.problems as any,
				logs: data.logs as any
			});
		}
	});

	const isAuthRoute = $derived(
		page.url.pathname.startsWith('/login') || page.url.pathname.startsWith('/register')
	);
	
	const isHome = $derived(page.url.pathname === '/');
</script>

<ModeWatcher defaultMode="light" />

<div
	class="min-h-screen bg-background text-foreground transition-colors duration-300 relative font-sans"
>
	<div class="fixed inset-0 bg-noise pointer-events-none z-0"></div>
	
	<div class="relative z-10">
		{#if !isAuthRoute && !isHome}
			<DesktopNav user={data.user} />
			<MobileNav user={data.user} />
		{/if}

		{#if isAuthRoute}
			<div class="fixed top-4 right-4 z-50">
				<ModeToggle />
			</div>
		{/if}

		<main class={isAuthRoute ? 'py-12' : isHome ? '' : 'pt-24 pb-16 md:pb-0'}>
			{@render children()}
		</main>
	</div>
</div>

{#if !isAuthRoute && !isHome}
	<ProblemSearchModal open={logsStore.isSearchModalOpen} onClose={closeSearchModal} />
	<LogDetailsModal open={logsStore.isLogModalOpen} onClose={closeLogModal} />
	<ProblemDetailsModal open={logsStore.isDetailsModalOpen} onClose={closeDetailsModal} problem={logsStore.selectedDetailsProblem} />
{/if}
