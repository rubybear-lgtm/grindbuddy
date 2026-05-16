import ChartJS from 'chart.js/auto';
import { useEffect, useRef } from 'react';

type DataSet = {
    label: string;
    data: number[];
    color: string;
    counts?: number[];
};

interface Props {
    labels: string[];
    primaryData: DataSet;
    comparisonData?: DataSet | null;
    totalQuestionsAnswered?: number;
}

function toRgba(color: string, alpha: number) {
    if (!color) {
        return `rgba(0,0,0,${alpha})`;
    }

    if (color.startsWith('hsl')) {
        return color.replace('hsl', 'hsla').replace(')', `, ${alpha})`);
    }

    if (color.startsWith('rgb')) {
        return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
    }

    if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);

        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    return color;
}

export function RadarChart({
    labels,
    primaryData,
    comparisonData = null,
    totalQuestionsAnswered = 0,
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<ChartJS | null>(null);

    useEffect(() => {
        if (!canvasRef.current) {
            return;
        }

        const isDarkMode =
            document.documentElement.classList.contains('dark') ||
            window.matchMedia('(prefers-color-scheme: dark)').matches;

        const allValues: number[] = [];
        primaryData.data.forEach((val) => {
            if (val !== null && val !== undefined && !isNaN(val)) {
                allValues.push(val);
            }
        });

        if (comparisonData) {
            comparisonData.data.forEach((val) => {
                if (val !== null && val !== undefined && !isNaN(val)) {
                    allValues.push(val);
                }
            });
        }

        let dynamicMax = 100;

        if (allValues.length > 0) {
            const maxValue = Math.max(...allValues);

            if (maxValue < 90) {
                const paddedMax = maxValue * 1.2;
                const roundedMax = Math.ceil(paddedMax / 5) * 5;
                const minScale =
                    maxValue < 10 ? Math.max(20, maxValue * 2) : 20;
                dynamicMax = Math.max(minScale, Math.min(roundedMax, 100));
            }
        }

        let dynamicStepSize = dynamicMax <= 50 ? 10 : 20;

        if (totalQuestionsAnswered > 0) {
            if (totalQuestionsAnswered <= 10) {
                dynamicStepSize = Math.max(dynamicStepSize, 10);
            } else if (totalQuestionsAnswered <= 25) {
                dynamicStepSize = 5;
            } else if (totalQuestionsAnswered <= 50) {
                dynamicStepSize = 2;
            } else {
                dynamicStepSize = 1;
            }
        }

        const datasets: any[] = [
            {
                label: primaryData.label,
                data: primaryData.data,
                counts: primaryData.counts,
                backgroundColor: toRgba(primaryData.color, 0.4),
                borderColor: primaryData.color,
                fill: true,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 0,
                pointHitRadius: 10,
                order: 2,
            },
        ];

        if (comparisonData) {
            datasets.push({
                label: comparisonData.label,
                data: comparisonData.data,
                counts: comparisonData.counts,
                backgroundColor: toRgba(comparisonData.color, 0.2),
                borderColor: comparisonData.color,
                fill: true,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 0,
                pointHitRadius: 10,
                order: 1,
            });
        }

        const config = {
            type: 'radar' as const,
            data: {
                labels,
                datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top' as const,
                        labels: {
                            color: isDarkMode
                                ? 'rgb(203, 213, 225)'
                                : 'rgb(15, 23, 42)',
                            font: {
                                size: 13,
                                weight: 'bold' as const,
                            },
                        },
                    },
                    tooltip: {
                        callbacks: {
                            label: (context: any) => {
                                const dataset = context.dataset;
                                const dataIndex = context.dataIndex;
                                const rawValue =
                                    context.parsed?.r ??
                                    dataset.data[dataIndex] ??
                                    0;
                                const percentage =
                                    typeof rawValue === 'number'
                                        ? Math.round(rawValue)
                                        : Number(rawValue) || 0;
                                const counts = dataset.counts;

                                if (
                                    counts &&
                                    Array.isArray(counts) &&
                                    counts[dataIndex] !== undefined &&
                                    counts[dataIndex] !== null
                                ) {
                                    return `${dataset.label}: ${percentage}% (${counts[dataIndex]} ${counts[dataIndex] === 1 ? 'question' : 'questions'})`;
                                }

                                return `${dataset.label}: ${percentage}%`;
                            },
                        },
                        backgroundColor: isDarkMode
                            ? 'rgba(15, 23, 42, 0.9)'
                            : 'rgba(255, 255, 255, 0.95)',
                        titleColor: isDarkMode
                            ? 'rgb(241, 245, 249)'
                            : 'rgb(15, 23, 42)',
                        bodyColor: isDarkMode
                            ? 'rgb(226, 232, 240)'
                            : 'rgb(51, 65, 85)',
                        padding: 12,
                        cornerRadius: 8,
                        borderColor: isDarkMode
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'rgba(0, 0, 0, 0.1)',
                        borderWidth: 1,
                    },
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: dynamicMax,
                        ticks: {
                            display: false,
                            backdropColor: 'transparent',
                            stepSize: dynamicStepSize,
                        },
                        angleLines: {
                            color: isDarkMode
                                ? 'rgba(255, 255, 255, 0.15)'
                                : 'rgba(0, 0, 0, 0.2)',
                            lineWidth: 1.5,
                        },
                        grid: {
                            color: isDarkMode
                                ? 'rgba(255, 255, 255, 0.1)'
                                : 'rgba(0, 0, 0, 0.15)',
                            lineWidth: 1.5,
                        },
                        pointLabels: {
                            color: isDarkMode
                                ? 'rgb(226, 232, 240)'
                                : 'rgb(15, 23, 42)',
                            font: {
                                size: 12,
                                family: "'Inter', sans-serif",
                                weight: 'bold' as const,
                            },
                            callback: (label: string) => {
                                return label.length > 20
                                    ? label.substring(0, 20) + '...'
                                    : label;
                            },
                        },
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
    }, [labels, primaryData, comparisonData, totalQuestionsAnswered]);

    return (
        <div className="h-80 w-full">
            <canvas ref={canvasRef} className="h-full w-full"></canvas>
        </div>
    );
}
