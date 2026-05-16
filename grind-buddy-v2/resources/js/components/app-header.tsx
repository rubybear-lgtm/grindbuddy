import { Link, usePage, router } from '@inertiajs/react';
import { LayoutDashboard, BarChart2, BookOpen, Plus, LogOut } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModeToggle } from '@/components/mode-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, NavItem } from '@/types';

type Props = {
    breadcrumbs?: BreadcrumbItem[];
};

const navItems: NavItem[] = [
    { title: 'Dashboard', href: dashboard(), icon: LayoutDashboard },
    { title: 'Analytics', href: '/analytics', icon: BarChart2 },
    { title: 'Logbook', href: '/logbook', icon: BookOpen },
];

export function AppHeader({ breadcrumbs: _breadcrumbs = [] }: Props) {
    const page = usePage();
    const { auth } = page.props;
    const getInitials = useInitials();

    const handleLogout = (e: React.MouseEvent) => {
        e.preventDefault();
        router.post('/logout');
    };

    return (
        <>
            {/* Desktop Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-40 h-20 bg-background/60 backdrop-blur-xl border-b border-border hidden md:block">
                <div className="mx-auto max-w-7xl px-8">
                    <div className="flex h-20 items-center justify-between">
                        {/* Logo and nav links */}
                        <div className="flex items-center gap-12">
                            <Link href="/" className="group flex items-center gap-4 font-heading text-2xl font-black tracking-tightest transition-all hover:opacity-90">
                                <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_20px_oklch(var(--primary)/0.4)]">
                                    <Plus aria-hidden="true" className="h-6 w-6 fill-current" />
                                </div>
                                <span className="tracking-tightest text-foreground">GRIND<span className="text-primary">BUDDY</span></span>
                            </Link>
                            <div className="hidden md:flex items-center gap-10">
                                {navItems.map((item) => {
                                    const isActive = page.url === item.href;

                                    return (
                                        <Link
                                            key={item.title}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-2 py-2 text-[10px] font-black uppercase tracking-[0.25em] transition-all",
                                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {item.icon && <item.icon className="h-4 w-4" />}
                                            {item.title}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right side: User avatar and Log Problem button */}
                        {auth.user ? (
                            <div className="flex items-center gap-8">
                                <ModeToggle />
                                <Button className="!rounded-md px-6 py-2.5 !text-[10px] !font-black tracking-[0.2em] bg-primary text-primary-foreground shadow-[0_0_20px_oklch(var(--primary)/0.3)] border-none">
                                    Log problem
                                </Button>
                                <div className="flex items-center gap-4 px-3 py-1.5 text-sm">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted border border-border text-foreground font-black shadow-inner p-0">
                                                <Avatar className="size-8 overflow-hidden rounded-lg">
                                                    <AvatarImage src={auth.user?.avatar} alt={auth.user?.name} />
                                                    <AvatarFallback className="rounded-lg bg-transparent text-foreground">
                                                        {getInitials(auth.user?.name ?? '')}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-56" align="end">
                                            <UserMenuContent user={auth.user} />
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <span className="hidden lg:inline text-[10px] font-black text-muted-foreground uppercase tracking-widest">{auth.user.name}</span>
                                    <Button onClick={handleLogout} variant="ghost" className="!px-2 !text-[9px] !font-black tracking-widest border border-border hover:bg-muted text-muted-foreground hover:text-primary transition-all">Log out</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-6">
                                <ModeToggle />
                                <Link href="/login" className="text-xs font-black text-foreground hover:text-primary transition-all tracking-[0.1em]">
                                    Log in
                                </Link>
                                <Button onClick={() => router.visit('/register')} className="!rounded-md px-8 py-3 !text-[10px] !font-black tracking-[0.2em] shadow-[0_0_30px_oklch(var(--primary)/0.3)] border-none">
                                    Sign up free
                                </Button>
                            </div>
                        )}
                    </div>
                    {_breadcrumbs.length > 0 && (
                        <div className="border-t border-border/60 py-2">
                            <Breadcrumbs breadcrumbs={_breadcrumbs} />
                        </div>
                    )}
                </div>
            </nav>

            {/* Mobile Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-background border-t border-border md:hidden overflow-visible">
                <div className="flex h-full items-center justify-around px-2">
                    {navItems.map((item) => {
                        const isActive = page.url === item.href;

                        return (
                            <Link
                                key={item.title}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 min-h-[44px] min-w-[44px] px-4 py-2 text-xs font-medium transition-colors",
                                    isActive ? "text-primary" : "text-muted-foreground"
                                )}
                            >
                                {item.icon && <item.icon className="h-6 w-6" />}
                                {item.title}
                            </Link>
                        );
                    })}
                    {auth.user && (
                        <button
                            onClick={handleLogout}
                            className="flex flex-col items-center justify-center gap-1 min-h-[44px] min-w-[44px] px-4 py-2 text-xs font-medium text-muted-foreground transition-colors"
                        >
                            <LogOut className="h-6 w-6" />
                            Logout
                        </button>
                    )}
                </div>
            </nav>

            {/* Floating Action Button for Mobile */}
            <button
                className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary md:hidden"
                aria-label="Log Problem"
            >
                <Plus className="h-6 w-6" />
            </button>
        </>
    );
}
