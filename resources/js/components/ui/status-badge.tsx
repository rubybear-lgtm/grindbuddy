import { Badge } from '@/components/ui/badge';
import { getStatusColor, type Status } from '@/lib/statusUtils';
import { Zap, CheckCircle, HelpCircle, Eye, AlertTriangle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    status: Status;
    showIcon?: boolean;
    className?: string;
}

const iconMap = {
    Optimal: Zap,
    Suboptimal: CheckCircle,
    Hints: HelpCircle,
    Solution: Eye,
    Failed: AlertTriangle,
};

export function StatusBadge({ status, showIcon = false, className }: Props) {
    const IconComponent = iconMap[status] || Circle;

    return (
        <Badge variant="outline" className={cn(getStatusColor(status), className)}>
            {showIcon && <IconComponent className="mr-1 h-3 w-3" />}
            {status}
        </Badge>
    );
}
