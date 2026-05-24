<?php

namespace App\Services;

use App\Models\Problem;
use App\Models\User;
use Illuminate\Support\Str;

class ProblemMatchResolver
{
    /**
     * @param  array{
     *     source: string,
     *     url: string,
     *     title?: ?string,
     *     number?: int|string|null,
     *     slug?: ?string
     * }  $payload
     * @return array{match: array<string, mixed>|null, matchType: string|null}
     */
    public function resolve(array $payload, ?User $user = null): array
    {
        $source = $payload['source'];
        $url = $this->normalizeUrl($payload['url']);
        $title = $this->normalizeTitle($payload['title'] ?? null);
        $slug = $this->normalizeSlug($payload['slug'] ?? null);
        $number = isset($payload['number']) && $payload['number'] !== '' ? (int) $payload['number'] : null;

        $problem = null;
        $matchType = null;

        if ($source === 'leetcode') {
            [$problem, $matchType] = $this->resolveForSource('leetcode_url', $url, $slug, $number, $title);
        } elseif ($source === 'neetcode') {
            [$problem, $matchType] = $this->resolveForSource('neetcode_url', $url, $slug, $number, $title);
        }

        if (! $problem) {
            return [
                'match' => null,
                'matchType' => null,
            ];
        }

        return [
            'match' => [
                'id' => $problem->id,
                'number' => $problem->number,
                'title' => $problem->title,
                'difficulty' => $problem->difficulty,
                'patterns' => $problem->patterns,
                'leetcodeUrl' => $problem->leetcode_url,
                'neetcodeUrl' => $problem->neetcode_url,
                'lastLog' => $user ? $this->resolveLastLog($user, $problem) : null,
            ],
            'matchType' => $matchType,
        ];
    }

    /**
     * @return array{0: Problem|null, 1: string|null}
     */
    private function resolveForSource(string $column, string $url, ?string $slug, ?int $number, ?string $title): array
    {
        $problem = Problem::query()
            ->get()
            ->first(fn (Problem $candidate): bool => $this->normalizeUrl((string) $candidate->{$column}) === $url);

        if ($problem) {
            return [$problem, 'url'];
        }

        if ($slug !== null) {
            $problem = Problem::query()
                ->get()
                ->first(function (Problem $candidate) use ($column, $slug): bool {
                    return $this->normalizeSlug($this->extractSlugFromUrl($candidate->{$column})) === $slug;
                });

            if ($problem) {
                return [$problem, 'slug'];
            }
        }

        if ($number !== null && $title !== null) {
            $problem = Problem::query()
                ->where('number', $number)
                ->get()
                ->first(fn (Problem $candidate): bool => $this->normalizeTitle($candidate->title) === $title);

            if ($problem) {
                return [$problem, 'number_title'];
            }
        }

        return [null, null];
    }

    /**
     * @return array{status: string, timestamp: string}|null
     */
    private function resolveLastLog(User $user, Problem $problem): ?array
    {
        $lastLog = $user->logs()
            ->where('problem_id', $problem->id)
            ->latest('timestamp')
            ->first();

        if (! $lastLog) {
            return null;
        }

        return [
            'status' => $lastLog->status,
            'timestamp' => $lastLog->timestamp?->toJSON() ?? '',
        ];
    }

    private function normalizeUrl(string $url): string
    {
        $normalized = trim($url);
        $parsed = parse_url($normalized);

        if (! is_array($parsed)) {
            return rtrim($normalized, '/');
        }

        $scheme = $parsed['scheme'] ?? '';
        $host = $parsed['host'] ?? '';
        $path = $parsed['path'] ?? '';
        $query = isset($parsed['query']) ? '?'.$parsed['query'] : '';

        return rtrim($scheme.'://'.$host.$path.$query, '/');
    }

    private function normalizeTitle(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $normalized = trim($value);
        $normalized = preg_replace('/^\s*#?\d+[\s.\-:]+/u', '', $normalized) ?? $normalized;
        $normalized = preg_replace('/\s*[-|]\s*(LeetCode|NeetCode).*$/i', '', $normalized) ?? $normalized;

        $normalized = Str::of($normalized)
            ->lower()
            ->replaceMatches('/[^\pL\pN]+/u', ' ')
            ->squish()
            ->toString();

        return $normalized === '' ? null : $normalized;
    }

    private function normalizeSlug(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $normalized = Str::of($value)
            ->lower()
            ->replaceMatches('/[^\pL\pN]+/u', '-')
            ->trim('-')
            ->toString();

        return $normalized === '' ? null : $normalized;
    }

    private function extractSlugFromUrl(?string $url): ?string
    {
        if (! $url) {
            return null;
        }

        $path = parse_url($url, PHP_URL_PATH);
        if (! is_string($path) || $path === '') {
            return null;
        }

        $segments = array_values(array_filter(explode('/', trim($path, '/'))));
        $problemIndex = array_search('problems', $segments, true);

        if ($problemIndex === false) {
            return null;
        }

        return $segments[$problemIndex + 1] ?? null;
    }
}
