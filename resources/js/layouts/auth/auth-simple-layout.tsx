import { Link } from '@inertiajs/react';
import { Zap } from 'lucide-react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background p-6 md:p-10">
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="bg-dot-grid absolute inset-0 opacity-20 dark:opacity-30" />
                <div className="absolute -left-64 -top-64 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px]" />
                <div className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
            </div>

            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-6">
                        <Link href={home()} className="flex flex-col items-center gap-4 transition-transform hover:scale-105 active:scale-95">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_0_40px_oklch(0.85_0.18_165_/_0.4)]">
                                <Zap className="h-8 w-8" strokeWidth={2.5} />
                            </div>
                            <div className="text-center">
                                <p className="font-heading text-2xl font-black leading-none tracking-[-0.06em] uppercase">
                                    GRIND<span className="text-primary">BUDDY</span>
                                </p>
                                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.4em] text-muted-foreground">
                                    Spaced repetition for LeetCode
                                </p>
                            </div>
                        </Link>

                        <div className="space-y-1 text-center">
                            <h1 className="text-xl font-semibold">{title}</h1>
                            <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card/80 p-8 shadow-2xl backdrop-blur-xl">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
