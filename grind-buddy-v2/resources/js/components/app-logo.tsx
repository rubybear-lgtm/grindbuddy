import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_20px_oklch(0.85_0.18_165_/_0.3)]">
                <AppLogoIcon className="size-4" />
            </div>
            <div className="ml-2 grid flex-1 text-left">
                <span className="font-heading text-sm font-black leading-none tracking-[-0.06em] uppercase">
                    GRIND<span className="text-primary">BUDDY</span>
                </span>
            </div>
        </>
    );
}
