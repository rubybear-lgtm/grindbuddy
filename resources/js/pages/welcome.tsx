import { Head, Link, usePage } from '@inertiajs/react';
import {
    Activity,
    ArrowRight,
    ArrowUpRight,
    BarChart3,
    Brain,
    Clock,
    Cpu,
    Database,
    Globe,
    Lock,
    Network,
    ShieldCheck,
    Terminal,
    Trophy,
    Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { RadarChart } from '@/components/common/radar-chart';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { dashboard, login } from '@/routes';

const features = [
    {
        icon: Brain,
        title: 'Spaced Repetition',
        desc: 'SM-2 algorithm schedules each problem at the exact moment you are about to forget it.',
    },
    {
        icon: BarChart3,
        title: 'Pattern Analytics',
        desc: 'See which DSA patterns you own and which ones are quietly dragging you down.',
    },
    {
        icon: Trophy,
        title: 'Company Targeting',
        desc: 'Filter by company. Focus on problems that actually appear in FAANG interviews.',
    },
    {
        icon: Clock,
        title: 'Review Queue',
        desc: 'Every session is optimized. No guessing what to study — your queue tells you.',
    },
    {
        icon: ShieldCheck,
        title: 'Recall Scoring',
        desc: 'Log how clean your solution was. Brutally honest feedback feeds the algorithm.',
    },
    {
        icon: Activity,
        title: 'Progress Tracking',
        desc: 'Retention curves, streaks, heatmaps. Know exactly where you stand.',
    },
];

const problemSets = [
    { label: 'Arrays & Hashing', count: 9, icon: Database },
    { label: 'Two Pointers', count: 5, icon: Network },
    { label: 'Sliding Window', count: 6, icon: Cpu },
    { label: 'Binary Search', count: 7, icon: Terminal },
    { label: 'Trees & Graphs', count: 26, icon: Globe },
    { label: 'Dynamic Programming', count: 21, icon: Lock },
];

export default function Welcome() {
    const { auth } = usePage().props as any;
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setLoaded(true), 50);

        return () => clearTimeout(t);
    }, []);

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-background font-sans selection:bg-primary/20">
            <Head title="Grind Buddy — Spaced repetition for LeetCode" />

            {/* Background decorations */}
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                <div className="bg-dot-grid absolute inset-0 opacity-[0.2] dark:opacity-[0.3]" />
                <div className="absolute -left-64 -top-64 h-[800px] w-[800px] animate-pulse rounded-full bg-primary/10 blur-[150px]" />
                <div className="absolute -right-32 top-1/2 h-[600px] w-[600px] rounded-full bg-[oklch(0.75_0.15_190_/_0.1)] blur-[150px]" />
                <div className="absolute right-0 top-0 hidden h-full w-1/3 border-l border-border/50 bg-muted/5 xl:block">
                    <div className="h-full w-full opacity-20">
                        {Array.from({ length: 10 }, (_, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between border-b border-border/50 px-8 py-12"
                            >
                                <div className="h-2 w-24 rounded-full bg-primary/20" />
                                <div className="font-mono text-[8px] text-muted-foreground">
                                    0{i}_NODE_STABLE
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-2xl transition-all">
                <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <a
                            href="/"
                            className="flex items-center gap-3 transition-transform hover:scale-105 active:scale-95"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_30px_oklch(0.85_0.18_165_/_0.3)]">
                                <Zap className="h-7 w-7 fill-current" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-heading text-2xl font-black leading-none tracking-[-0.06em] uppercase">
                                    GRIND<span className="text-primary">BUDDY</span>
                                </span>
                                <span className="mt-1 text-[8px] font-bold uppercase leading-none tracking-[0.4em] text-muted-foreground">
                                    Spaced repetition for LeetCode
                                </span>
                            </div>
                        </a>

                        <div className="hidden items-center gap-12 md:flex">
                            <div className="flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
                                <a href="#how-it-works" className="transition-colors hover:text-primary">
                                    How it works
                                </a>
                                <a href="#problem-sets" className="transition-colors hover:text-primary">
                                    Problem sets
                                </a>
                            </div>
                            <div className="h-8 w-px bg-border" />
                            <div className="flex items-center gap-6">
                                <ModeToggle />
                                {auth?.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="text-xs font-black uppercase tracking-widest transition-colors hover:text-primary"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <Link
                                        href={login()}
                                        className="text-xs font-black uppercase tracking-widest transition-colors hover:text-primary"
                                    >
                                        Login
                                    </Link>
                                )}
                                <Button
                                    asChild
                                    size="sm"
                                    className="rounded-full px-8 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/25"
                                >
                                    <Link href={auth?.user ? dashboard() : login()}>
                                        Get started
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main>
                {/* Hero */}
                <header className="relative overflow-hidden pb-20 pt-12 md:pb-32 md:pt-20">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
                            <div
                                className={`space-y-8 transition-all duration-700 lg:col-span-7 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                            >
                                <div className="inline-flex items-center gap-4 rounded-full border border-primary/20 bg-primary/5 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.4em] text-primary backdrop-blur-xl">
                                    <span className="flex h-2 w-2 animate-ping rounded-full bg-primary" />
                                    Spaced repetition for technical interviews
                                </div>

                                <div className="space-y-5">
                                    <h1 className="text-h1 text-balance leading-[0.85]">
                                        The Intelligent
                                        <br />
                                        <span className="relative inline-block italic text-primary">
                                            Memory Engine
                                            <span className="absolute -bottom-4 left-0 h-2 w-full -skew-x-12 bg-primary/20" />
                                        </span>
                                        <br />
                                        for Engineers.
                                    </h1>

                                    <p className="max-w-2xl text-xl font-medium leading-tight tracking-tight text-muted-foreground md:text-3xl">
                                        Stop forgetting what you've solved. Grind Buddy tracks your
                                        retention and tells you{' '}
                                        <span className="font-bold text-foreground">
                                            exactly what to review today.
                                        </span>
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-4">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="h-16 rounded-md px-12 text-lg font-black tracking-widest shadow-[0_0_50px_oklch(0.85_0.18_165_/_0.3)] transition-all hover:scale-105"
                                    >
                                        <Link href={auth?.user ? dashboard() : login()}>
                                            <Zap className="mr-3 h-5 w-5 fill-current" />
                                            {auth?.user ? 'Go to dashboard' : 'Start for free'}
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        variant="ghost"
                                        size="lg"
                                        className="h-16 rounded-md border border-border px-10 text-lg font-black tracking-widest hover:bg-muted"
                                    >
                                        <a href="#how-it-works">
                                            See how it works
                                            <ArrowRight className="ml-3 h-5 w-5" />
                                        </a>
                                    </Button>
                                </div>
                            </div>

                            {/* Radar chart card */}
                            <div className="relative lg:col-span-5">
                                <div className="absolute -inset-20 -z-10 animate-pulse rounded-full bg-primary/10 opacity-40 blur-[120px]" />
                                <div className="rounded-[3rem] border border-border bg-card p-8 shadow-2xl md:p-10">
                                    <div className="mb-6 flex items-center justify-between border-b border-border pb-6">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">
                                                Pattern coverage
                                            </p>
                                            <h4 className="font-heading text-2xl font-black uppercase italic tracking-[-0.06em]">
                                                Your skill map
                                            </h4>
                                        </div>
                                        <div className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-primary">
                                            <ArrowUpRight className="h-6 w-6" />
                                        </div>
                                    </div>

                                    <div className="aspect-square w-full">
                                        <RadarChart
                                            labels={[
                                                'Arrays',
                                                'Pointers',
                                                'Sliding',
                                                'Stack',
                                                'Search',
                                                'List',
                                                'Trees',
                                                'Backtrack',
                                                'Graphs',
                                                'DP',
                                            ]}
                                            primaryData={{
                                                label: 'Your Recall',
                                                data: [65, 45, 75, 60, 55, 40, 70, 30, 80, 50],
                                                color: 'oklch(0.85 0.18 165)',
                                            }}
                                            comparisonData={{
                                                label: 'Institutional Avg',
                                                data: [85, 70, 60, 80, 75, 65, 90, 50, 60, 85],
                                                color: 'oklch(0.75 0.15 190)',
                                            }}
                                        />
                                    </div>

                                    <div className="mt-5 flex items-center justify-between rounded-3xl border border-border bg-muted/50 p-5">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-lg shadow-primary/20">
                                                <Zap className="h-6 w-6 fill-current" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                                    Overall retention
                                                </p>
                                                <p className="font-heading text-4xl font-black tabular-nums tracking-[-0.06em]">
                                                    84%
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                                Consistency
                                            </p>
                                            <div className="flex gap-1.5">
                                                {[1, 2, 3, 4, 5].map((i) => (
                                                    <div
                                                        key={i}
                                                        className={`h-4 w-1.5 rounded-full ${
                                                            i <= 4
                                                                ? 'bg-primary shadow-[0_0_15px_oklch(0.85_0.18_165_/_0.6)]'
                                                                : 'bg-border'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* How it works */}
                <section id="how-it-works" className="relative py-20 md:py-32">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-14 space-y-5">
                            <div className="inline-flex items-center gap-3 rounded-md border border-primary/20 bg-primary/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                                <Activity className="h-3 w-3" />
                                How it works
                            </div>
                            <h2 className="text-h2 max-w-2xl">
                                Built for engineers who{' '}
                                <span className="italic text-primary">retain</span>, not just solve.
                            </h2>
                            <p className="max-w-xl text-xl font-medium text-muted-foreground">
                                Every session is computed. No guesswork. No wasted reviews.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {features.map((item) => (
                                <div
                                    key={item.title}
                                    className="group rounded-[2.5rem] border border-border bg-card p-8 transition-all hover:border-primary/30 hover:bg-muted/50"
                                >
                                    <div className="space-y-5">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-all group-hover:scale-110 group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary">
                                            <item.icon className="h-6 w-6" />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-heading text-xl font-black uppercase italic tracking-[-0.06em] text-foreground">
                                                {item.title}
                                            </h4>
                                            <p className="text-lg leading-relaxed text-muted-foreground opacity-70 transition-opacity group-hover:opacity-100">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Problem sets */}
                <section id="problem-sets" className="relative py-20 md:py-32">
                    <div className="absolute inset-0 -z-10 bg-muted/30" />
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-14 space-y-5">
                            <div className="inline-flex items-center gap-3 rounded-md border border-primary/20 bg-primary/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                                <Trophy className="h-3 w-3" />
                                Problem sets
                            </div>
                            <h2 className="text-h2 max-w-2xl">
                                NeetCode 150 —{' '}
                                <span className="italic text-primary">fully catalogued.</span>
                            </h2>
                            <p className="max-w-xl text-xl font-medium text-muted-foreground">
                                Every problem tagged by pattern, difficulty, and company frequency.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {problemSets.map((set) => (
                                <div
                                    key={set.label}
                                    className="group relative overflow-hidden rounded-[2.5rem] border border-border bg-card p-8 transition-all hover:border-primary/30"
                                >
                                    <div className="shimmer-green pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100" />
                                    <div className="relative z-10 flex items-start justify-between">
                                        <div className="space-y-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                <set.icon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="font-heading text-lg font-black uppercase italic tracking-[-0.06em] text-foreground">
                                                    {set.label}
                                                </p>
                                                <p className="mt-1 text-sm font-medium text-muted-foreground">
                                                    {set.count} problems
                                                </p>
                                            </div>
                                        </div>
                                        <ArrowUpRight className="h-5 w-5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:text-primary" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Browser Extension */}
                <section id="extension" className="relative py-20 md:py-32">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="overflow-hidden rounded-[3rem] border border-border bg-card">
                            <div className="grid grid-cols-1 items-center gap-0 lg:grid-cols-2">
                                {/* Left: copy */}
                                <div className="space-y-8 p-12 md:p-16">
                                    <div className="space-y-5">
                                        <div className="inline-flex items-center gap-3 rounded-md border border-primary/20 bg-primary/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                                            <Cpu className="h-3 w-3" />
                                            Chrome extension
                                        </div>
                                        <h2 className="text-h2 max-w-lg">
                                            Log problems{' '}
                                            <span className="italic text-primary">without leaving</span>{' '}
                                            the page.
                                        </h2>
                                        <p className="max-w-md text-xl font-medium text-muted-foreground">
                                            The Grind Buddy extension detects when you're on a LeetCode or NeetCode problem and surfaces a one-click log — right on the page.
                                        </p>
                                    </div>

                                    <ul className="space-y-4">
                                        {[
                                            { icon: Zap, text: 'Auto-detects the current problem — no searching' },
                                            { icon: Activity, text: 'In-page toast with instant "Log" and "Dismiss"' },
                                            { icon: Brain, text: 'Full popup: status, notes, and app link in one click' },
                                        ].map(({ icon: Icon, text }) => (
                                            <li key={text} className="flex items-center gap-3 text-base font-medium text-muted-foreground">
                                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                    <Icon className="h-4 w-4" />
                                                </span>
                                                {text}
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        asChild
                                        size="lg"
                                        className="h-14 rounded-md px-10 font-black tracking-widest shadow-[0_0_40px_oklch(0.85_0.18_165_/_0.25)] transition-all hover:scale-105"
                                    >
                                        <a href="https://chromewebstore.google.com" target="_blank" rel="noopener noreferrer">
                                            <ArrowUpRight className="mr-2 h-5 w-5" />
                                            Get the extension
                                        </a>
                                    </Button>
                                </div>

                                {/* Right: visual mockup */}
                                <div className="relative flex h-full min-h-[400px] items-center justify-center overflow-hidden border-t border-border bg-muted/30 p-12 lg:border-l lg:border-t-0">
                                    <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-primary/5 blur-[100px]" />
                                    {/* Toast mockup */}
                                    <div className="w-full max-w-[280px] space-y-3">
                                        <div className="rounded-[18px] border border-border bg-card p-4 shadow-2xl">
                                            <p className="mb-1 text-[9px] font-black uppercase tracking-[0.3em] text-primary">Grind Buddy</p>
                                            <p className="text-sm font-bold leading-tight text-foreground">#1 Two Sum</p>
                                            <p className="mt-0.5 text-[11px] text-muted-foreground">LeetCode · Easy · Arrays</p>
                                            <div className="mt-3 flex gap-2">
                                                <button className="flex-1 rounded-xl bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground">
                                                    Log problem
                                                </button>
                                                <button className="flex-1 rounded-xl border border-border px-3 py-1.5 text-[11px] font-bold text-muted-foreground">
                                                    Dismiss
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                                            Appears automatically on problem pages
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="relative py-20 md:py-32">
                    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                        <div className="space-y-8">
                            <div className="space-y-5">
                                <h2 className="text-h2">
                                    Start your{' '}
                                    <span className="italic text-primary">review engine.</span>
                                </h2>
                                <p className="mx-auto max-w-xl text-xl font-medium text-muted-foreground">
                                    Log in with Google or GitHub. No email required. No noise.
                                    Just your queue.
                                </p>
                            </div>
                            <Button
                                asChild
                                size="lg"
                                className="h-16 rounded-md px-16 text-xl font-black tracking-widest shadow-[0_0_60px_oklch(0.85_0.18_165_/_0.4)] transition-all hover:scale-105"
                            >
                                <Link href={auth?.user ? dashboard() : login()}>
                                    <Zap className="mr-3 h-6 w-6 fill-current" />
                                    {auth?.user ? 'Go to dashboard' : "Get started — it's free"}
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-border bg-card py-12 md:py-16">
                <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                    <div className="flex flex-col items-center gap-6">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/30 transition-transform hover:scale-110">
                            <Zap className="h-10 w-10 fill-current" />
                        </div>
                        <div className="space-y-2">
                            <p className="font-heading text-4xl font-black uppercase italic tracking-[-0.06em]">
                                GRIND BUDDY
                            </p>
                            <p className="text-[11px] font-black uppercase tracking-[0.8em] text-muted-foreground/60">
                                Spaced repetition for LeetCode
                            </p>
                        </div>
                    </div>
                    <div className="mt-8 flex flex-col items-center gap-4 border-t border-border/50 pt-8">
                        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.6em] text-muted-foreground/30">
                            &copy; {new Date().getFullYear()} Grind Buddy
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
