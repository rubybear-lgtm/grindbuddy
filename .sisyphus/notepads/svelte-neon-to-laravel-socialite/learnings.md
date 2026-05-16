- Routes are mostly protected by src/routes/+layout.server.ts, but API endpoints bypass that and must enforce auth explicitly.
- /api/companies and /api/companies/[slug] are public; /api/companies/[slug]/match checks locals.user directly.
- Layout bootstraps problems/logs into stores for authenticated pages; auth pages skip that data fetch.
- Laravel target uses PHP 8 attribute-style model fillable/hidden definitions; OAuth identity schema added as password-null users plus provider/provider_user_id social account matching, with provider email required and avatar URL optional.

## Task 3: Fortify Email/Password Surface Removal

- Fortify registers `POST /login`, `POST /logout` UNCONDITIONALLY in `vendor/laravel/fortify/routes/routes.php`; the `Features::*` array only gates registration/reset/verification/2FA routes.
- Setting `fortify.views = false` removes `GET /login`, `GET /forgot-password`, `GET /reset-password/{token}`, `GET /email/verify`, `GET /two-factor-challenge`, `GET /user/confirm-password` but does NOT remove `POST /login`.
- Routes in `routes/web.php` are loaded by `AppRouteServiceProvider::loadRoutesUsing` AFTER Fortify's `boot()`, so `Route::get('/login', ...)` and `Route::match(['post'], '/login', ...)` in `web.php` overwrite Fortify's registrations (RouteCollection keys by `method + domain + uri`).
- Keep a named `login` route registered (even returning `abort(404)`) so Laravel's `auth` middleware can resolve `route('login')` for guest redirects; otherwise `RouteNotFoundException` is thrown for any protected route.
- After disabling features, `FortifyServiceProvider::configureViews()` becomes dead code; also `Fortify::createUsersUsing()` and `Fortify::resetUserPasswordsUsing()` become no-ops because their controllers are unrouted.
- `php artisan test --filter=EmailPasswordDisabled` is the verification gate; legacy Auth tests (`AuthenticationTest`, `RegistrationTest`, etc.) intentionally break and must be rewritten in later tasks for OAuth coverage.

## Task 4: Socialite Provider Auth

- `laravel/socialite` v5.27 includes `Socialite::fake($driver, $user)`, and fake callbacks can return a simple object exposing `getId()`, `getName()`, `getNickname()`, `getEmail()`, and `getAvatar()`; redirect tests should use real configured drivers because the fake provider redirects to `https://socialite.fake/{driver}/authorize`.
- Stateful Socialite redirects are network-free and can be asserted by setting dummy provider config values, then checking 302 `Location` hosts for `accounts.google.com` and `github.com`.
- Keep both route `whereIn('provider', config('services.socialite.providers'))` constraints and controller whitelist checks so unknown providers 404 before any Socialite driver lookup.

## Task 4: Catalog & Log Schema Port (TDD)

- Drizzle text-array `text('patterns').array()` maps to Laravel `$table->json('patterns')` with `'patterns' => 'array'` model cast. SQLite test driver stores it as JSON-encoded text and round-trips cleanly.
- Composite-key text PKs in Drizzle require disabling Eloquent auto-increment on each model: `public $incrementing = false; protected $keyType = 'string';`. Forgetting this causes Eloquent to try to assign integer IDs.
- Migrations created via `php artisan make:migration` in a single command share the same timestamp. When FK ordering matters (e.g., `company_problems` depends on `problems` + `companies`), rename to consecutive timestamps to enforce alphabetical/lexicographic run order.
- `$table->foreignId('user_id')->constrained()->cascadeOnDelete()` infers the `users` table from the column name. For text-FK columns (`company_id` -> `companies.id`), use explicit `$table->string('company_id'); $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();`.
- For BelongsToMany pivots with extra columns (`frequency`, `timeframe`) and pivot-level lifecycle, extend `Illuminate\Database\Eloquent\Relations\Pivot` and reference it via `->using(CompanyProblem::class)->withPivot([...])`.
- `App\Models\Log` shadows `Illuminate\Support\Facades\Log` if both are imported. Use the fully-qualified facade `\Log::info(...)` in code that needs both, or alias the model on import.
- Laravel SQLite test config (phpunit.xml `DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`) honors foreign keys + cascades automatically under RefreshDatabase, so cascade-delete tests verify identical to Postgres behavior in production.
- Pest test conventions in this project: top-level `use App\Models\...;` imports at file head; `it('describes...', fn () => ...)` per case; `expect($model->relation)->toHaveCount(n)` for relationship assertions.
- Intelephense LSP can report transient "Undefined type" errors for sibling models created in the same session before its index refreshes; verify via `composer dump-autoload` + `class_exists()` or by actually running the tests (which load classes via Composer PSR-4).

## Task: Idempotent Catalog Import Command

- `grind:import-catalog` imports only `problems`, `companies`, and `company_problems` from a JSON snapshot path argument; tests keep source `logs`, `users`, `sessions`, `accounts`, and verification fixtures in the JSON to prove they are ignored.
- `company_problems` has no database uniqueness constraint on `(company_id, problem_id)`, so command-level `updateOrCreate` on that pair is required for idempotency.
- Strict orphan detection should happen before the transaction so failed imports leave all catalog tables untouched; `--skip-orphans` imports valid joins and reports skipped orphan rows.
- Laravel’s default `sessions` table exists after migrations, so Neon/Auth non-import tests should assert row counts stay zero rather than asserting the table is absent.

## Auth UI and App Shell
- Replaced Fortify auth pages with a simple OAuth-only login page using `login.tsx`.
- Updated `welcome.tsx` to match the source SvelteKit landing page UX, removing register links.
- Removed Fortify-specific user menu items (Security, 2FA) from `settings/layout.tsx` and deleted the corresponding components.
- Added `data-testid` attributes to `app-header.tsx` and `login.tsx` for QA parity.
- Updated `routes/web.php` to render the Inertia `auth/login` page instead of returning 404.
- Verified the UI using Playwright screenshots.

## Task 9: Port Dashboard, Catalog, Analytics, and Fresh-Log User Flows to Inertia React
- Successfully ported the Svelte pages to Inertia React.
- Used `chart.js` directly with `useRef` and `useEffect` to implement the charts without adding new React-specific chart dependencies.
- Skipped Fortify-specific tests that were failing due to the removal of email/password routes in favor of Socialite.
- Maintained UI parity with the original Svelte components while adapting to React patterns.

## Task 9: Dashboard, Logbook, Analytics Pages

- DashboardController now provides `problems`, `companies`, AND `logs` (user's own logs via `request()->user()->logs()->with('problem')->get()`)
- LogbookController provides `problems` and `logs` (user's own logs only)
- AnalyticsController provides `companies`, `problems`, and `logs` (user's own logs only)
- Fresh users with zero logs get empty arrays — all UI components handle empty states gracefully
- Inertia React pages use `useMemo` for client-side derived data (filtering, joining problems with logs)
- Wayfinder route imports (`@/routes`) are used for named route generation in page layout breadcrumbs
- Sidebar navigation updated with Dashboard, Logbook, Analytics items using lucide-react icons
- Chart.js used directly via `useRef`/`useEffect` for analytics charts (PatternMasteryChart, ActivityHeatmap, StatusBreakdown, SkillMatch)
- The `reviewQueue` on dashboard is computed client-side from logs data — for fresh users it's empty, showing ZeroState
- All three new pages (dashboard, logbook, analytics) have Pest feature tests verifying auth gates, Inertia props, and empty-state behavior
- 29 tests are intentionally skipped (legacy Fortify email/password tests that are no longer applicable)

## Task 1: Dashboard and Skill Match Eval
- Replaced hardcoded `masteryStats` and `reviewQueue` in `dashboard.tsx` with dynamic calculations using `useMemo`.
- Added `/analytics/skill-match-eval` route to `routes/web.php`.
- Added `skillMatchEval` method to `AnalyticsController.php` to return the Inertia page with `companies` prop.
- Created `skill-match-eval.tsx` page using the existing `SkillMatch` component.
- Added tests for the new route in `AnalyticsPageTest.php`.
- Fixed `DashboardController.php` to use `timestamp` instead of `created_at` and `updated_at` for logs, as the `Log` model has `$timestamps = false` and uses `timestamp` field.

## UI Parity Fixes
- Ported Svelte app's `layout.css` to Laravel's `app.css`, keeping the `@source` directives for Laravel views.
- Changed default layout in `app-layout.tsx` to `app-header-layout`.
- Rewrote `app-header.tsx` to include both the desktop top navigation and the mobile bottom navigation, matching the Svelte app's `DesktopNav` and `MobileNav`.
- Updated `app-header-layout.tsx` to include the `.bg-noise` background and `.min-h-screen` structure, and added appropriate padding (`pt-0 pb-16 md:pt-20 md:pb-0`) to account for the fixed headers/footers.
- Created a `mode-toggle.tsx` component to match the Svelte app's theme toggler.
