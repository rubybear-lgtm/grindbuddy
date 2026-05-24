import { Head, usePage } from '@inertiajs/react';
import { Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { devLogin } from '@/routes';
import oauth from '@/routes/oauth';

export default function Login() {
    const { isLocal } = usePage().props;

    return (
        <>
            <Head title="Log in" />
            <div className="mt-4 flex flex-col space-y-4">
                <Button
                    asChild
                    variant="outline"
                    className="w-full"
                    data-testid="oauth-login-google"
                >
                    <a href={oauth.redirect('google').url}>
                        Continue with Google
                    </a>
                </Button>
                <Button
                    asChild
                    variant="outline"
                    className="w-full"
                    data-testid="oauth-login-github"
                >
                    <a href={oauth.redirect('github').url}>
                        Continue with GitHub
                    </a>
                </Button>

                {isLocal && (
                    <>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase">
                                <span className="bg-card px-2 font-bold tracking-widest text-muted-foreground">
                                    Local dev
                                </span>
                            </div>
                        </div>
                        <Button
                            asChild
                            variant="ghost"
                            className="w-full border border-dashed border-primary/40 font-black text-[11px] uppercase tracking-widest text-primary hover:bg-primary/5"
                            data-testid="dev-login"
                        >
                            <a href={devLogin().url}>
                                <Terminal className="mr-2 h-4 w-4" />
                                Dev login — skip OAuth
                            </a>
                        </Button>
                    </>
                )}
            </div>
        </>
    );
}

Login.layout = {
    title: 'Log in to your account',
    description: 'Continue with an OAuth provider',
};
