import { Head, usePage } from '@inertiajs/react';
import { Github, Terminal } from 'lucide-react';
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
                    className="w-full hover:bg-muted/50 cursor-pointer flex items-center justify-center gap-2"
                    data-testid="oauth-login-google"
                >
                    <a href={oauth.redirect('google').url}>
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                fill="#EA4335"
                            />
                        </svg>
                        Continue with Google
                    </a>
                </Button>
                <Button
                    asChild
                    variant="outline"
                    className="w-full hover:bg-muted/50 cursor-pointer flex items-center justify-center gap-2"
                    data-testid="oauth-login-github"
                >
                    <a href={oauth.redirect('github').url}>
                        <Github className="h-4 w-4" />
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
