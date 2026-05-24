import { Head } from '@inertiajs/react';
import { SkillMatch } from '@/components/analytics/skill-match';
import { dashboard } from '@/routes';

interface Props {
    companies: any[];
}

export default function SkillMatchEval({ companies }: Props) {
    return (
        <>
            <Head title="Skill Match Evaluation" />
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="mb-2 text-h1">Skill Match Evaluation</h1>
                    <p className="text-sm text-muted-foreground">
                        Compare different Skill Match approaches side-by-side. This is a temporary evaluation page.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col min-h-[600px] lg:col-span-2">
                        <SkillMatch companies={companies} />
                    </div>
                </div>
            </div>
        </>
    );
}

SkillMatchEval.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Analytics',
            href: '/analytics',
        },
        {
            title: 'Skill Match Eval',
            href: '/analytics/skill-match-eval',
        },
    ],
};
