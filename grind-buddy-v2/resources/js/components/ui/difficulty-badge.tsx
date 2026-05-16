import { Badge } from '@/components/ui/badge';
import { getDifficultyColor, type Difficulty } from '@/lib/statusUtils';
import { cn } from '@/lib/utils';

interface Props {
    difficulty: Difficulty;
    className?: string;
}

export function DifficultyBadge({ difficulty, className }: Props) {
    return (
        <Badge variant="outline" className={cn(getDifficultyColor(difficulty), className)}>
            {difficulty}
        </Badge>
    );
}
