import ChartJS from 'chart.js/auto';
import { useEffect, useRef, useMemo } from 'react';

interface Props {
    logs: any[];
}

export function StatusBreakdown({ logs }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<ChartJS | null>(null);

    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = {
            Optimal: 0,
            Suboptimal: 0,
            Hints: 0,
            Solution: 0,
            Failed: 0,
        };

        logs.forEach((log) => {
            if (counts[log.status] !== undefined) {
                counts[log.status]++;
            }
        });

        return counts;
    }, [logs]);

    useEffect(() => {
        if (!canvasRef.current) {
            return;
        }

        const data = {
            labels: ['Optimal', 'Suboptimal', 'Hints', 'Solution', 'Failed'],
            datasets: [
                {
                    data: [
                        statusCounts.Optimal,
                        statusCounts.Suboptimal,
                        statusCounts.Hints,
                        statusCounts.Solution,
                        statusCounts.Failed,
                    ],
                    backgroundColor: [
                        'rgb(16, 185, 129)',
                        'rgb(245, 158, 11)',
                        'rgb(59, 130, 246)',
                        'rgb(168, 85, 247)',
                        'rgb(225, 29, 72)',
                    ],
                },
            ],
        };

        const config = {
            type: 'doughnut' as const,
            data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom' as const,
                    },
                },
            },
        };

        if (chartRef.current) {
            chartRef.current.destroy();
        }

        chartRef.current = new ChartJS(canvasRef.current, config);

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, [statusCounts]);

    return (
        <div className="h-64">
            <canvas ref={canvasRef} className="h-full w-full"></canvas>
        </div>
    );
}
