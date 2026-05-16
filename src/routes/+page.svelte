<script lang="ts">
	import { ArrowRight, Brain, Zap, Trophy, Activity, ShieldCheck, Database, Globe, Terminal, ArrowUpRight, Cpu, Network, BarChart3, Lock, ZapOff } from '@lucide/svelte';
	import RadarChart from '$lib/components/common/RadarChart.svelte';
	import ModeToggle from '$lib/components/ModeToggle.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { onMount } from 'svelte';

	let loaded = $state(false);
	onMount(() => {
		setTimeout(() => loaded = true, 50);
	});
</script>

<div class="relative min-h-screen bg-background font-sans selection:bg-primary/20 overflow-x-hidden">
	<!-- Background Infrastructure -->
	<div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
		<div class="bg-dot-grid absolute inset-0 opacity-[0.2] dark:opacity-[0.3]"></div>
		
		<!-- Large Geometric Accents -->
		<div class="absolute -left-64 -top-64 h-[800px] w-[800px] rounded-full bg-primary/10 blur-[150px] animate-pulse-slow"></div>
		<div class="absolute -right-32 top-1/2 h-[600px] w-[600px] rounded-full bg-brand-cyan/10 blur-[150px]"></div>
		
		<!-- Decorative Tech Grid (Asymmetric) -->
		<div class="absolute right-0 top-0 h-full w-1/3 border-l border-border/50 bg-muted/5 hidden xl:block">
			<div class="h-full w-full opacity-20">
				{#each Array(10) as _, i}
					<div class="border-b border-border/50 py-12 px-8 flex justify-between items-center">
						<div class="h-2 w-24 bg-primary/20 rounded-full"></div>
						<div class="text-[8px] font-mono text-muted-foreground">0{i}_NODE_STABLE</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Premium Navigation -->
	<nav class="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-2xl transition-all">
		<div class="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-24 items-center justify-between">
				<a href="/" class="flex items-center gap-3 transition-transform hover:scale-105 active:scale-95">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_30px_oklch(var(--primary)/0.3)]">
						<Zap class="h-7 w-7 fill-current" />
					</div>
					<div class="flex flex-col">
						<span class="font-heading text-2xl font-black leading-none tracking-tightest">GRIND<span class="text-primary">BUDDY</span></span>
						<span class="text-[8px] font-bold tracking-[0.4em] text-muted-foreground uppercase leading-none mt-1">Spaced repetition for LeetCode</span>
					</div>
				</a>

				<div class="hidden md:flex items-center gap-12">
					<div class="flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
						<a href="#infrastructure" class="hover:text-primary transition-colors">How it works</a>
						<a href="#curriculum" class="hover:text-primary transition-colors">Problem sets</a>
						<a href="https://github.com" class="hover:text-primary transition-colors">GitHub</a>
					</div>
					<div class="h-8 w-px bg-border"></div>
					<div class="flex items-center gap-6">
						<ModeToggle />
						<a href="/login" class="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors">Login</a>
						<Button
							onclick={() => window.location.href = '/register'}
							size="sm"
							class="px-8 !rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-black tracking-widest text-[10px] uppercase shadow-lg shadow-primary/25"
						>
							Get started
						</Button>
					</div>
				</div>

				<div class="flex items-center gap-4 md:hidden">
					<ModeToggle />
					<Button variant="ghost" size="sm" class="px-2">
						<Terminal class="h-6 w-6" />
					</Button>
				</div>
			</div>
		</div>
	</nav>

	<main>
		<!-- Hero Section: High-Density Command Center -->
		<header class="relative pt-20 pb-40 md:pt-32 md:pb-60 overflow-hidden">
			<div class="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
					
					<!-- Hero Text content -->
					<div class="lg:col-span-7 space-y-12">
						<div class="inline-flex items-center gap-4 rounded-full border border-primary/20 bg-primary/5 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.4em] text-primary backdrop-blur-xl animate-fade-in-up">
							<span class="flex h-2 w-2 rounded-full bg-primary animate-ping"></span>
							Spaced repetition for technical interviews
						</div>

						<div class="space-y-8 animate-fade-in-up">
							<h1 class="text-h1 leading-[0.85] text-balance">
								The Intelligent <br />
								<span class="text-primary italic relative inline-block">
									Memory Engine
									<span class="absolute -bottom-4 left-0 h-2 w-full bg-primary/20 -skew-x-12"></span>
								</span> <br />
								for Engineers.
							</h1>

							<p class="max-w-2xl text-xl text-muted-foreground leading-tight md:text-3xl font-medium tracking-tight">
								Stop forgetting what you've solved. Grind Buddy tracks your memory decay and surfaces the right LeetCode problems at the right time — so patterns
								<span class="text-foreground font-black underline decoration-primary/40 decoration-[6px] underline-offset-[8px]">actually stick</span>
								before your next interview.
							</p>
						</div>

						<div class="flex flex-col items-start gap-6 sm:flex-row animate-fade-in-up">
							<Button
								size="lg"
								onclick={() => window.location.href = '/register'}
								class="h-20 w-full px-12 text-xl font-black uppercase tracking-[0.2em] bg-primary text-primary-foreground rounded-2xl shadow-[0_20px_50px_-10px_oklch(var(--primary)/0.4)] hover:scale-[1.02] active:scale-98 transition-all sm:w-auto"
							>
								Start for free
								<ArrowRight class="ml-4 h-6 w-6" />
							</Button>
							<Button
								variant="ghost"
								size="lg"
								onclick={() => document.getElementById('infrastructure')?.scrollIntoView({ behavior: 'smooth' })}
								class="h-20 w-full border-2 border-border px-12 text-lg font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-muted transition-all sm:w-auto"
							>
								See how it works
							</Button>
						</div>
						
						<!-- Hero Proof Points -->
						<div class="grid grid-cols-3 gap-8 pt-12 border-t border-border/50 animate-fade-in-up">
							<div class="space-y-1">
								<p class="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">Problems indexed</p>
								<p class="text-3xl font-black text-foreground">450+</p>
							</div>
							<div class="space-y-1">
								<p class="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">Pattern categories</p>
								<p class="text-3xl font-black text-foreground">14</p>
							</div>
							<div class="space-y-1">
								<p class="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">Spaced repetition</p>
								<p class="text-3xl font-black text-foreground">Built in</p>
							</div>
						</div>
					</div>

					<!-- Hero Visual Side (Hidden on Mobile) -->
					<div class="lg:col-span-5 hidden lg:block relative">
						<div class="absolute -inset-20 bg-primary/10 blur-[100px] rounded-full opacity-50 animate-pulse"></div>
						
						<!-- Decorative Data Window -->
						<div class="relative bg-card border border-border rounded-[3rem] p-10 shadow-2xl overflow-hidden group">
							<div class="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
							
							<div class="flex items-center justify-between mb-12 border-b border-border pb-8">
								<div class="flex items-center gap-4">
									<div class="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
										<Activity class="h-5 w-5" />
									</div>
									<div>
										<p class="text-[9px] font-black uppercase tracking-[0.5em] text-primary">Today's review</p>
										<p class="text-lg font-black uppercase italic tracking-tighter">Pattern strength</p>
									</div>
								</div>
								<div class="text-right">
									<div class="h-2 w-2 rounded-full bg-primary animate-ping inline-block"></div>
									<span class="text-[9px] font-mono text-muted-foreground ml-2">Live</span>
								</div>
							</div>

							<!-- Visual Representation of a Session -->
							<div class="space-y-6">
								{#each [
									{ label: 'Arrays & Hashing', score: 85, color: 'bg-primary' },
									{ label: 'Graph traversal', score: 42, color: 'bg-orange-500' },
									{ label: 'Dynamic programming', score: 94, color: 'bg-brand-cyan' }
								] as stat}
									<div class="space-y-2">
										<div class="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
											<span>{stat.label}</span>
											<span class="text-foreground">{stat.score}%</span>
										</div>
										<div class="h-1.5 w-full bg-muted rounded-full overflow-hidden">
											<div class="h-full {stat.color} transition-all duration-1000 ease-out" style="width: {loaded ? stat.score : 0}%"></div>
										</div>
									</div>
								{/each}
							</div>
							
							<!-- Interactive Mockup Trigger -->
							<div class="mt-12 p-6 rounded-2xl bg-muted/50 border border-border flex items-center justify-between">
								<div class="flex items-center gap-4">
									<div class="h-12 w-12 rounded-xl bg-background border border-border flex items-center justify-center">
										<Brain class="h-6 w-6 text-primary" />
									</div>
									<p class="text-xs font-bold uppercase tracking-widest">Interview readiness</p>
								</div>
								<div class="text-primary font-black text-xl">Strong</div>
							</div>
						</div>
						
						<!-- Floating Accent elements -->
						<div class="absolute -right-12 -bottom-12 h-32 w-32 bg-background border border-border rounded-3xl p-6 shadow-xl animate-float hidden xl:flex flex-col justify-between">
							<Cpu class="h-8 w-8 text-primary" />
							<div class="text-[10px] font-black uppercase tracking-widest">Due today <br /> <span class="text-foreground text-sm">12</span></div>
						</div>
					</div>
				</div>
			</div>
		</header>

		<!-- Bento Grid Section -->
		<section id="curriculum" class="border-t border-border py-32 md:py-48 bg-muted/5">
			<div class="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-12">
					<div class="max-w-3xl space-y-6">
						<p class="text-[11px] font-black uppercase tracking-[0.5em] text-primary">Curated problem sets</p>
						<h2 class="text-h2 leading-none uppercase tracking-tightest">The lists that <br /><span class="text-primary italic">actually matter.</span></h2>
						<p class="text-xl text-muted-foreground md:text-2xl font-medium leading-relaxed">
							Practice the problems that consistently show up in interviews at top companies — with spaced repetition doing the scheduling for you.
						</p>
					</div>
					<div class="hidden lg:block pb-4">
						<Button variant="ghost" class="border border-border rounded-full px-8 py-4 font-black tracking-widest text-[10px] uppercase">
							Browse All Sets
						</Button>
					</div>
				</div>

				<div class="grid grid-cols-1 gap-8 md:grid-cols-12">
					<!-- Main Feature: Blind 75 -->
					<a href="/register" class="group relative flex flex-col justify-between overflow-hidden rounded-[2.5rem] border border-border bg-card p-10 md:p-16 transition-all hover:border-primary/50 hover:shadow-2xl md:col-span-8">
						<div class="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
						<div class="relative z-10 space-y-10">
							<div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 shadow-2xl">
								<Trophy class="h-10 w-10" />
							</div>
							<div class="space-y-6">
								<h3 class="text-4xl md:text-6xl font-black uppercase italic tracking-tightest text-foreground">The Blind 75</h3>
								<p class="max-w-md text-lg text-muted-foreground leading-relaxed">
									The essential foundation for technical interviews. 75 high-leverage problems covering 14 core data structures and algorithms.
								</p>
							</div>
						</div>
						<div class="mt-16 flex items-center gap-4 text-xs font-black uppercase tracking-widest text-primary">
							Start with Blind 75
							<ArrowUpRight class="h-5 w-5 transition-transform group-hover:translate-x-2 group-hover:-translate-y-2" />
						</div>
					</a>

					<!-- Stats Vertical -->
					<div class="md:col-span-4 grid grid-cols-1 gap-8">
						<div class="flex flex-col justify-between rounded-[2rem] border border-border bg-card p-10 transition-all hover:border-primary/30">
							<div class="space-y-4">
								<div class="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
									<Cpu class="h-6 w-6" />
								</div>
								<p class="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Problems tracked</p>
								<div class="text-5xl font-black tabular-nums tracking-tightest">450+</div>
							</div>
							<p class="mt-8 text-sm font-medium text-muted-foreground leading-relaxed opacity-70">Scheduling your reviews using the Ebbinghaus forgetting curve.</p>
						</div>

						<div class="flex flex-col justify-between rounded-[2rem] border border-border bg-card p-10 transition-all hover:border-brand-cyan/30">
							<div class="space-y-4">
								<div class="h-10 w-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan">
									<Network class="h-6 w-6" />
								</div>
								<p class="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Companies covered</p>
								<div class="text-5xl font-black tabular-nums tracking-tightest">50+</div>
							</div>
							<p class="mt-8 text-sm font-medium text-muted-foreground leading-relaxed opacity-70">Company-specific problem sets from FAANG, unicorns, and startups.</p>
						</div>
					</div>

					<!-- Secondary Feature: NeetCode 150 -->
					<a href="/register" class="group relative flex flex-col justify-between overflow-hidden rounded-[2.5rem] border border-border bg-card p-10 md:p-16 transition-all hover:border-primary/50 md:col-span-12">
						<div class="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
						<div class="flex flex-col gap-12 md:flex-row md:items-center md:justify-between">
							<div class="space-y-8 flex-1">
								<div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
									<Brain class="h-8 w-8" />
								</div>
								<div class="space-y-4">
									<h3 class="text-4xl md:text-5xl font-black uppercase italic tracking-tightest text-foreground">NeetCode 150</h3>
									<p class="max-w-2xl text-xl text-muted-foreground leading-relaxed font-medium">
										The gold standard for modern Big Tech preparation. A comprehensive deep dive into pattern retrieval and algorithm design.
									</p>
								</div>
							</div>
							<div class="shrink-0">
								<div class="rounded-full border-2 border-primary/20 bg-background px-12 py-5 text-xs font-black tracking-[0.2em] text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary uppercase">
									Start NeetCode 150
								</div>
							</div>
						</div>
					</a>
				</div>
			</div>
		</section>

		<!-- Technical Details Section -->
		<section id="infrastructure" class="py-32 md:py-60 relative overflow-hidden">
			<div class="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="grid items-start gap-24 lg:grid-cols-2 lg:gap-40">
					<div class="space-y-20">
						<div class="space-y-8">
							<div class="inline-flex items-center gap-4 rounded-full border border-primary/20 bg-primary/10 px-8 py-3 text-[11px] font-black uppercase tracking-[0.4em] text-primary">
								<ShieldCheck class="h-5 w-5" />
								How it works
							</div>
							<h2 class="text-h2 leading-none uppercase tracking-tightest">Practice smarter, <br /><span class="text-primary italic">not more.</span></h2>
							<p class="text-2xl text-muted-foreground leading-relaxed font-medium">
								2000+ LeetCode problems is overwhelming. Grind Buddy cuts through the noise — showing you exactly which problems to review each day based on how well you remember them.
							</p>
						</div>

						<div class="space-y-12">
							{#each [
								{ icon: Database, title: "Log every attempt", desc: "Record how you solved it — clean, optimal, or needed a hint. Quality matters for scheduling." },
								{ icon: Globe, title: "Company-specific sets", desc: "Filter by company to focus on the exact patterns that show up in your target interviews." },
								{ icon: Terminal, title: "Daily review queue", desc: "Each day, Grind Buddy tells you exactly which problems to revisit — no guesswork." }
							] as item}
								<div class="group flex gap-8">
									<div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-border bg-card text-muted-foreground transition-all group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
										<item.icon class="h-8 w-8" />
									</div>
									<div class="space-y-2">
										<h4 class="font-heading text-xl font-black uppercase italic tracking-tightest text-foreground">{item.title}</h4>
										<p class="text-lg text-muted-foreground leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">{item.desc}</p>
									</div>
								</div>
							{/each}
						</div>
					</div>

					<!-- Visual Mockup -->
					<div class="relative sticky top-32">
						<div class="absolute -inset-20 -z-10 bg-primary/10 blur-[120px] rounded-full opacity-40 animate-pulse"></div>
						<div class="rounded-[3rem] border border-border bg-card p-10 shadow-2xl md:p-16">
							<div class="mb-12 flex items-center justify-between border-b border-border pb-10">
								<div class="space-y-2">
									<p class="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Pattern coverage</p>
									<h4 class="text-3xl font-black uppercase italic tracking-tightest">Your skill map</h4>
								</div>
								<div class="h-12 w-12 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors cursor-pointer">
									<ArrowUpRight class="h-6 w-6" />
								</div>
							</div>
							
							<div class="aspect-square w-full">
								<RadarChart 
									labels={['Arrays', 'Pointers', 'Sliding', 'Stack', 'Search', 'List', 'Trees', 'Backtrack', 'Graphs', 'DP']}
									primaryData={{
										label: 'Your Recall',
										data: [65, 45, 75, 60, 55, 40, 70, 30, 80, 50],
										color: 'oklch(0.85 0.18 165)'
									}}
									comparisonData={{
										label: 'Institutional Avg',
										data: [85, 70, 60, 80, 75, 65, 90, 50, 60, 85],
										color: 'oklch(0.75 0.15 190)'
									}}
								/>
							</div>

							<div class="mt-12 flex items-center justify-between rounded-3xl bg-muted/50 p-8 border border-border">
								<div class="flex items-center gap-6">
									<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-lg shadow-primary/20">
										<Zap class="h-6 w-6 fill-current" />
									</div>
									<div>
										<p class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Overall retention</p>
										<p class="text-4xl font-black tabular-nums tracking-tightest">84%</p>
									</div>
								</div>
								<div class="text-right">
									<p class="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Consistency</p>
									<div class="flex gap-1.5">
										{#each [1,2,3,4,5] as i}
											<div class={`h-4 w-1.5 rounded-full ${i <= 4 ? 'bg-primary shadow-[0_0_15px_oklch(var(--primary)/0.6)]' : 'bg-border'}`}></div>
										{/each}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	</main>

	<!-- High-Impact Footer -->
	<footer class="border-t border-border bg-card py-32 md:py-48">
		<div class="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-20">
			<div class="flex flex-col items-center gap-10">
				<div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/30 transition-transform hover:scale-110">
					<Zap class="h-10 w-10 fill-current" />
				</div>
				<div class="space-y-4">
					<p class="text-4xl font-black uppercase italic tracking-tightest">GRIND BUDDY</p>
					<p class="text-[11px] font-black uppercase tracking-[0.8em] text-muted-foreground/60">Spaced repetition for LeetCode</p>
				</div>
			</div>
			
			<div class="flex flex-col items-center gap-12 pt-12 border-t border-border/50">
				<div class="flex flex-wrap justify-center gap-x-16 gap-y-8 text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground">
					<a href="/privacy" class="hover:text-primary transition-all">Privacy</a>
					<a href="/terms" class="hover:text-primary transition-all">Terms</a>
					<a href="https://github.com" class="hover:text-primary transition-all">GitHub</a>
				</div>
				<p class="text-[10px] font-mono text-muted-foreground/30 uppercase tracking-[0.6em] font-bold">
					&copy; {new Date().getFullYear()} Grind Buddy
				</p>
			</div>
		</div>
	</footer>
</div>

<style>
	:global(html) {
		scroll-behavior: smooth;
	}
	
	.tracking-tightest {
		letter-spacing: -0.06em;
	}

	.animate-float {
		animation: float 6s ease-in-out infinite;
	}

	@keyframes float {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-20px); }
	}

	.animate-pulse-slow {
		animation: pulse-slow 8s ease-in-out infinite;
	}

	@keyframes pulse-slow {
		0%, 100% { opacity: 0.1; transform: scale(1); }
		50% { opacity: 0.2; transform: scale(1.1); }
	}
</style>
