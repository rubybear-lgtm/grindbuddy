# Task 1: Source/Target Route Parity Table

## Source SvelteKit Routes → Target Laravel Equivalents

| Source Route | Method | Auth | Target Laravel Equivalent | Status |
|---|---|---|---|---|
| `/` | GET | Public | `welcome.tsx` → port to landing page | Migrate (preserve landing UX) |
| `/` POST `createLog` | POST | Protected | New `LogController@store` (post-cutover logs only) | Migrate |
| `/` POST `deleteLog` | POST | Protected | New `LogController@destroy` | Migrate |
| `/` POST `updateLog` | POST | Protected | New `LogController@update` | Migrate |
| `/dashboard` | GET | Protected | `dashboard.tsx` → port with catalog + empty logs | Migrate |
| `/logbook` | GET | Protected | New `Logbook` Inertia page | Migrate |
| `/analytics` | GET | Protected | New `Analytics` Inertia page (SSR stub) | Migrate |
| `/analytics/skill-match-eval` | GET | Protected | New `SkillMatchEval` Inertia page | Migrate |
| `/login` | GET/POST | Public | `auth/login.tsx` → replace with OAuth-only page | Auth-replaced |
| `/register` | GET/POST | Public | `auth/register.tsx` → remove entirely | Auth-removed |
| `/logout` | POST | Protected | Existing `POST logout` route → keep | Already exists |
| `/api/companies` | GET | Public | New `CompanyController@index` API | Migrate |
| `/api/companies/{slug}` | GET | Public | New `CompanyController@show` API | Migrate |
| `/api/companies/{slug}/match` | GET | Protected | New `CompanyMatchController` API | Migrate |
| `/api/health` | GET | Public | New `HealthController` or route closure | Migrate |
| `/api/auth/[...path]` | GET/POST | Public | **Removed** — replaced by Socialite OAuth | Auth-replaced |
| `/favicon.ico` | GET | Public | Static asset (already in `public/`) | Already exists |

## Data Shape Parity

### Company List: `GET /api/companies`
- Response: `{ id: string, name: string, slug: string, color: string | null }[]`
- Ordered by name ASC

### Company Detail: `GET /api/companies/{slug}`
- Response: `{ id, name, slug, color, patterns: string[], patternCounts: Record<string,number>, patternDifficulty: Record<string,string>, totalProblems: number }`
- 404: `{ error: 'Company not found' }`

### Company Skill Match: `GET /api/companies/{slug}/match`
- Response: `SkillMatchPayload { company: {...}, user: { totalAttempted }, patterns: Record<string,PatternScore>, recommendations: Recommendation[] }`
- Protected: requires `locals.user`

### Health: `GET /api/health`
- Response: `'OK'` or debug JSON when `?debug=1`
- Debug gated to non-production

### Log CRUD (root page form actions)
- `createLog`: `{ success: true, log: { id, problemId, status, timeComplexity, spaceComplexity, notes, timestamp } }`
- `deleteLog`: no payload
- `updateLog`: no payload
- All require `locals.user`

## Rendered Catalog Fields (UI)

| Page | Problem Fields | Company Fields | Log Fields |
|---|---|---|---|
| Dashboard | number, title, difficulty, patterns, leetcodeUrl | — | lastLog.status, lastLog.timestamp |
| Logbook | title, number, patterns, difficulty | — | lastLog.status, timeComplexity, timestamp |
| Analytics | (aggregates only) | — | timestamps, statuses |
| Skill Match Eval | — | slug, name, color, totalProblems | — |

## Inertia React Stack Confirmed

Target stack: `@inertiajs/react` v3, React 19, TailwindCSS v4, Radix UI, Wayfinder
No Svelte/Vue/other framework dependencies in `grind-buddy-v2/package.json`.
