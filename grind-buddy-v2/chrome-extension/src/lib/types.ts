export type ProblemSource = 'leetcode' | 'neetcode';
export type ToastSize = 'small' | 'medium' | 'large';

export interface PageContext {
    source: ProblemSource;
    url: string;
    title: string;
    number: number | null;
    slug: string | null;
}

export interface LastLogSummary {
    status: string;
    timestamp: string;
}

export interface ProblemMatch {
    id: string;
    number: number;
    title: string;
    difficulty: string;
    patterns: string[];
    leetcodeUrl: string | null;
    neetcodeUrl: string | null;
    lastLog: LastLogSummary | null;
}

export interface MatchResponse {
    match: ProblemMatch | null;
    matchType: string | null;
}

export interface SubmitLogPayload {
    problemId: string;
    status: string;
    notes: string | null;
}
