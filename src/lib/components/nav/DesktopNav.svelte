<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/ui/Button.svelte';
	import { LayoutDashboard, BarChart2, BookOpen, Plus, User } from '@lucide/svelte';
	import { openSearchModal } from '$lib/stores/logsStore';
	import { signOut } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import ModeToggle from '$lib/components/ModeToggle.svelte';

	type UserType = App.Locals['user'];

	let { user }: { user: UserType | null } = $props();

	const navItems = [
		{ path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
		{ path: '/analytics', label: 'Analytics', icon: BarChart2 },
		{ path: '/logbook', label: 'Logbook', icon: BookOpen }
	];

	async function handleLogout() {
		await signOut();
		await goto('/login');
	}
</script>

<nav
	class="fixed top-0 left-0 right-0 z-40 h-20 bg-background/60 backdrop-blur-xl border-b border-border"
>
	<div class="mx-auto max-w-7xl px-8">
		<div class="flex h-20 items-center justify-between">
			<!-- Logo and nav links -->
			<div class="flex items-center gap-12">
				<a href="/" class="group flex items-center gap-4 font-heading text-2xl font-black tracking-tightest transition-all hover:opacity-90">
					<div class="relative flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_20px_oklch(var(--primary)/0.4)]">
						<Plus aria-hidden="true" class="h-6 w-6 fill-current" />
					</div>
					<span class="tracking-tightest text-foreground">GRIND<span class="text-primary">BUDDY</span></span>
				</a>
				<div class="hidden md:flex items-center gap-10">
					{#each navItems as item (item.path)}
						<a
							href={item.path}
							class="flex items-center gap-2 py-2 text-[10px] font-black uppercase tracking-[0.25em] transition-all {page
								.url.pathname === item.path
								? 'text-primary'
								: 'text-muted-foreground hover:text-foreground'}"
						>
							<item.icon class="h-4 w-4" />
							{item.label}
						</a>
					{/each}
				</div>
			</div>

			<!-- Right side: User avatar and Log Problem button -->
			{#if user}
				<div class="flex items-center gap-8">
					<ModeToggle />
					<Button onclick={openSearchModal} class="!rounded-md px-6 py-2.5 !text-[10px] !font-black tracking-[0.2em] bg-primary text-primary-foreground shadow-[0_0_20px_oklch(var(--primary)/0.3)] border-none">
						Log problem
					</Button>
					<div class="flex items-center gap-4 px-3 py-1.5 text-sm">
						<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-muted border border-border text-foreground font-black shadow-inner">
							{#if user?.name}{user.name.slice(0, 1)}{:else}<User class="h-4 w-4" />{/if}
						</div>
						<span class="hidden lg:inline text-[10px] font-black text-muted-foreground uppercase tracking-widest">{user.name}</span>
						<Button onclick={handleLogout} variant="ghost" class="!px-2 !text-[9px] !font-black tracking-widest border border-border hover:bg-muted text-muted-foreground hover:text-primary transition-all">Log out</Button>
					</div>
				</div>
			{:else}
				<div class="flex items-center gap-6">
					<ModeToggle />
					<a
						href="/login"
						class="text-xs font-black text-foreground hover:text-primary transition-all tracking-[0.1em]"
					>
						Log in
					</a>
					<Button
						onclick={() => window.location.href = '/register'}
						class="!rounded-md px-8 py-3 !text-[10px] !font-black tracking-[0.2em] shadow-[0_0_30px_oklch(var(--primary)/0.3)] border-none"
					>
						Sign up free
					</Button>
				</div>
			{/if}
		</div>
	</div>
</nav>
