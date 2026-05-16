import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Props {
    searchQuery: string;
    selectedPattern: string;
    selectedStatus: string;
    selectedDifficulty: string;
    selectedDateRange: string;
    selectedTimeComplexity: string;
    onSearchChange: (value: string) => void;
    onPatternChange: (value: string) => void;
    onStatusChange: (value: string) => void;
    onDifficultyChange: (value: string) => void;
    onDateRangeChange: (value: string) => void;
    onTimeComplexityChange: (value: string) => void;
    onClear: () => void;
    allPatterns: string[];
}

const allStatuses = ['Optimal', 'Suboptimal', 'Hints', 'Solution', 'Failed'];
const allDifficulties = ['Easy', 'Medium', 'Hard'];

export function FilterToolbar({
    searchQuery,
    selectedPattern,
    selectedStatus,
    selectedDifficulty,
    selectedDateRange,
    selectedTimeComplexity,
    onSearchChange,
    onPatternChange,
    onStatusChange,
    onDifficultyChange,
    onDateRangeChange,
    onTimeComplexityChange,
    onClear,
    allPatterns,
}: Props) {
    const hasActiveFilters =
        searchQuery.trim() !== '' ||
        selectedPattern !== '' ||
        selectedStatus !== '' ||
        selectedDifficulty !== '' ||
        selectedDateRange !== '' ||
        selectedTimeComplexity !== '';

    return (
        <div className="sticky top-16 z-30 border-b border-slate-200 bg-white py-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="space-y-4">
                    <div className="flex w-full">
                        <Input
                            value={searchQuery}
                            placeholder="Search logs..."
                            className="w-full"
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Select
                            value={selectedPattern}
                            onValueChange={onPatternChange}
                        >
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="All Patterns" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Patterns
                                </SelectItem>
                                {allPatterns.map((p) => (
                                    <SelectItem key={p} value={p}>
                                        {p}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={selectedStatus}
                            onValueChange={onStatusChange}
                        >
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Statuses
                                </SelectItem>
                                {allStatuses.map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {s}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={selectedDifficulty}
                            onValueChange={onDifficultyChange}
                        >
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="All Difficulties" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Difficulties
                                </SelectItem>
                                {allDifficulties.map((d) => (
                                    <SelectItem key={d} value={d}>
                                        {d}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={selectedDateRange}
                            onValueChange={onDateRangeChange}
                        >
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="All Time" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Time</SelectItem>
                                <SelectItem value="7d">Last 7 Days</SelectItem>
                                <SelectItem value="30d">
                                    Last 30 Days
                                </SelectItem>
                                <SelectItem value="this_month">
                                    This Month
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={selectedTimeComplexity}
                            onValueChange={onTimeComplexityChange}
                        >
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="All Complexities" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Complexities
                                </SelectItem>
                                <SelectItem value="O(1)">O(1)</SelectItem>
                                <SelectItem value="O(log n)">
                                    O(log n)
                                </SelectItem>
                                <SelectItem value="O(n)">O(n)</SelectItem>
                                <SelectItem value="O(n log n)">
                                    O(n log n)
                                </SelectItem>
                                <SelectItem value="O(n²)">O(n²)</SelectItem>
                                <SelectItem value="O(2^n)">O(2^n)</SelectItem>
                            </SelectContent>
                        </Select>

                        {hasActiveFilters && (
                            <Button
                                variant="secondary"
                                onClick={onClear}
                                size="sm"
                                className="ml-auto sm:ml-0"
                            >
                                Clear all
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
