import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import type { AppLayoutProps } from '@/types';

export default function AppHeaderLayout({
    children,
    breadcrumbs,
}: AppLayoutProps) {
    return (
        <AppShell variant="header">
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300 relative font-sans">
                <div className="fixed inset-0 bg-noise pointer-events-none z-0"></div>
                <div className="relative z-10 flex flex-col min-h-screen">
                    <AppHeader breadcrumbs={breadcrumbs} />
                    <div className="pt-0 pb-16 md:pt-20 md:pb-0 flex-1 flex flex-col">
                        <AppContent variant="header">{children}</AppContent>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
