import type { Status, Difficulty } from '$lib/types';

export function getStatusColor(status: Status): string {
	switch (status) {
		case 'Optimal':
			return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20';
		case 'Suboptimal':
			return 'bg-amber-500/15 text-amber-400 border border-amber-500/20';
		case 'Hints':
			return 'bg-blue-500/15 text-blue-400 border border-blue-500/20';
		case 'Solution':
			return 'bg-purple-500/15 text-purple-400 border border-purple-500/20';
		case 'Failed':
			return 'bg-rose-500/15 text-rose-400 border border-rose-500/20';
		default:
			return 'bg-white/5 text-muted-foreground border border-white/10';
	}
}

export function getDifficultyColor(difficulty: Difficulty): string {
	switch (difficulty) {
		case 'Easy':
			return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20';
		case 'Medium':
			return 'bg-amber-500/15 text-amber-400 border border-amber-500/20';
		case 'Hard':
			return 'bg-rose-500/15 text-rose-400 border border-rose-500/20';
		default:
			return 'bg-white/5 text-muted-foreground border border-white/10';
	}
}

export function getStatusIcon(status: Status): string {
	switch (status) {
		case 'Optimal':
			return 'Zap';
		case 'Suboptimal':
			return 'CheckCircle';
		case 'Hints':
			return 'HelpCircle';
		case 'Solution':
			return 'Eye';
		case 'Failed':
			return 'AlertTriangle';
		default:
			return 'Circle';
	}
}

