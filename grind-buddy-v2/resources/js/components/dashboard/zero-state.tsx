import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ZeroState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mb-2 text-xl font-black tracking-tight text-foreground uppercase">
                All caught up
            </h2>
            <p className="mb-8 font-medium text-muted-foreground">
                Nothing due today. Log a new problem to keep building.
            </p>
            <Button
                className="!rounded-md border border-white/10 px-6 !text-[10px] !font-black tracking-widest transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
                variant="ghost"
            >
                Log a problem
            </Button>
        </div>
    );
}
