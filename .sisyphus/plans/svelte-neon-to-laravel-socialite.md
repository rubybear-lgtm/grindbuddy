# Svelte + Neon Auth to Laravel Socialite Migration

## TL;DR
> **Summary**: Migrate the root SvelteKit + Neon Auth app into the existing `grind-buddy-v2/` Laravel/Inertia React app with a new database, fresh OAuth-only users, Google/GitHub Socialite auth, close UI parity, and direct cutover after verification.
> **Deliverables**:
> - OAuth-only Laravel auth using Socialite for Google and GitHub.
> - Fortify email/password/reset/verification/2FA surfaces removed or unreachable.
> - Laravel migrations/models/services for catalog data and fresh user accounts.
> - Idempotent catalog import for public/reference data only; no user log migration.
> - Inertia React pages preserving the Svelte app's current UX closely.
> - TDD coverage, parity verification, and direct cutover smoke checks.
> **Effort**: Large
> **Parallel**: YES - 4 implementation waves + final verification wave
> **Critical Path**: Task 1 → Task 2 → Task 4 → Task 6 → Task 9 → Task 12 → Final Verification

## Context

### Original Request
Plan the migration from Svelte and Neon Auth to Laravel and Socialite auth, with Google and GitHub only and no email auth. Tooling available includes Neon MCP, Svelte MCP, and Laravel/Boost MCP inside `grind-buddy-v2`.

### Interview Summary
- Scope: full application migration, not auth-only.
- Source: repository root SvelteKit app.
- Target: `grind-buddy-v2/` Laravel/Inertia app.
- Database: create a new target database.
- Auth: fresh user base; Google/GitHub Socialite only.
- Excluded: existing Neon Auth users, active sessions, email/password login, registration, password reset, email verification, magic links, 2FA, and user-owned logs.
- Data: migrate public/reference catalog data only (`problems`, `companies`, `company_problems`); do not migrate `logs`.
- UI: preserve existing Svelte UI/UX closely in Laravel/Inertia React.
- Cutover: direct cutover once test and parity gates pass.
- Testing: TDD.

### Metis Review (gaps addressed)
- Defaulted provider linking to provider-account identity only: returning users are matched by `(provider, provider_user_id)`, not email alone.
- Defaulted same-email cross-provider behavior to **block automatic linking** and require a future explicit linking feature outside this migration.
- Defaulted missing/null provider email behavior to **reject sign-in with a clear OAuth-only error**.
- Defaulted signup gate to open Google/GitHub signup; no allowlist, invite, or admin approval.
- Defaulted provider profile refresh to update name/avatar/email on each successful login while retaining the stable provider ID.
- Defaulted catalog IDs to preserve source IDs for URL and relation stability.
- Defaulted catalog snapshot to be taken at the direct-cutover freeze.
- Defaulted no browser test framework dependency; use Pest/PHPUnit for TDD and agent-executed Playwright/manual QA for UI parity.
- Guardrail: do not use `stateless()` for browser OAuth.
- Guardrail: do not introduce a new frontend framework; `grind-buddy-v2` uses Inertia React.

## Work Objectives

### Core Objective
Replace the root SvelteKit app with a Laravel/Inertia React implementation in `grind-buddy-v2/`, using a new database, OAuth-only fresh users, and catalog-only data migration.

### Deliverables
- Laravel Socialite dependency and config for Google/GitHub.
- OAuth controller/routes/tests with strict provider whitelist.
- User/social account schema for fresh users.
- Removal/disablement of Fortify email/password UX/routes/features.
- Laravel catalog schema, models, factories, seed/import command, and idempotency tests.
- Ported route/page/API behavior with close UI parity.
- Direct cutover checklist and smoke verification.

### Definition of Done (verifiable conditions with commands)
- From `grind-buddy-v2/`: `composer run test` passes.
- From `grind-buddy-v2/`: `composer run ci:check` passes.
- From `grind-buddy-v2/`: `npm run types:check` passes.
- From `grind-buddy-v2/`: `npm run build` passes.
- OAuth tests prove Google/GitHub new user, returning user, provider whitelist rejection, null email rejection, session regeneration, and logout.
- Catalog import can run twice without duplicate rows.
- Target catalog row counts match the source snapshot for `problems`, `companies`, and `company_problems`.
- Target contains zero imported `logs` rows.
- Email/password/register/reset/verification/2FA routes are absent or return 404/redirect-away according to the plan's route table.
- Direct cutover smoke script exits 0 before switching traffic.

### Must Have
- TDD: write/update tests before implementation in each task.
- Use Laravel/Boost docs/tools inside `grind-buddy-v2` before implementing Laravel/Inertia/Socialite details.
- Use Laravel conventions: Artisan generators, Pest feature tests, migrations, Eloquent models, Inertia render responses, Wayfinder route helpers.
- Preserve source catalog IDs.
- Reject unknown providers before `Socialite::driver()`.
- Reject null provider email.
- Regenerate session after successful OAuth login.
- Keep OAuth browser flow stateful; no Socialite `stateless()`.

### Must NOT Have
- No email/password login.
- No public registration form.
- No password reset.
- No email verification flow.
- No magic links.
- No 2FA requirement or setup flow.
- No migration of Neon Auth users, sessions, accounts, verification rows, or source cookies.
- No migration of `logs` or other user-generated content.
- New post-cutover users may create new Laravel-owned logs if the current app's logging flow is part of the route parity table.
- No automatic cross-provider account linking by email alone.
- No new frontend framework beyond Inertia React.
- No opportunistic UI redesign or feature additions.
- No generic provider abstraction layer for only two providers.

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- Test decision: TDD with Pest/PHPUnit in `grind-buddy-v2`, plus TypeScript/build checks.
- QA policy: Every task has agent-executed scenarios.
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy

### Parallel Execution Waves
> Target: 5-8 tasks per wave. This migration has fewer high-coupling tasks; parallelism is limited by auth/schema foundations.

Wave 1: Task 1 foundation inventory, Task 2 auth decisions/schema/tests, Task 3 Fortify removal tests.
Wave 2: Task 4 Socialite implementation, Task 5 catalog schema/models, Task 6 catalog import command.
Wave 3: Task 7 route/API parity, Task 8 UI shell/auth pages, Task 9 dashboard/catalog/log-free UX.
Wave 4: Task 10 CI/build hardening, Task 11 environment/deployment config, Task 12 direct cutover smoke/runbook.

### Dependency Matrix (full, all tasks)
- Task 1 blocks Tasks 2-12.
- Task 2 blocks Task 4.
- Task 3 blocks Tasks 4 and 8.
- Task 4 blocks Tasks 8, 10, 11, 12.
- Task 5 blocks Tasks 6, 7, 9.
- Task 6 blocks Tasks 7, 9, 12.
- Task 7 blocks Tasks 9, 12.
- Task 8 blocks Task 12.
- Task 9 blocks Task 12.
- Tasks 10 and 11 block Task 12.

### Agent Dispatch Summary (wave → task count → categories)
- Wave 1 → 3 tasks → deep, unspecified-high.
- Wave 2 → 3 tasks → deep, quick, unspecified-high.
- Wave 3 → 3 tasks → visual-engineering, unspecified-high.
- Wave 4 → 3 tasks → unspecified-high, writing.

## TODOs
> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [x] 1. Freeze Source/Target Inventory and Route Parity Table

  **What to do**: In `grind-buddy-v2/`, use Laravel Boost/docs tools and read-only inspection to create an implementation inventory inside the plan executor's working notes: source routes, source rendered pages/components, source API response shapes, source catalog fields actually displayed, target Laravel routes/pages/tests, and exact route parity table. Confirm Inertia React is the target stack from `grind-buddy-v2/package.json`. Do not create product docs; keep inventory in task evidence and code comments only where necessary.
  **Must NOT do**: Do not edit source Svelte app. Do not add new features. Do not decide to migrate logs.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: broad architectural inventory across two app trees.
  - Skills: [] - No UI or framework-specific implementation yet.
  - Omitted: [`vercel-react-best-practices`] - not yet writing React code.

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: Tasks 2-12 | Blocked By: none

  **References**:
  - Pattern: `src/routes/+layout.server.ts:5-21` - current public/protected route gating and redirect behavior.
  - Pattern: `src/routes/+layout.server.ts:30-58` - current shared authenticated data loading.
  - Pattern: `src/lib/server/db/schema.ts:101-124` - catalog tables to migrate.
  - Pattern: `src/lib/server/db/schema.ts:126-135` - logs table explicitly excluded.
  - API/Type: `grind-buddy-v2/package.json:31-68` - Inertia React target stack.

  **Acceptance Criteria**:
  - [ ] Evidence file lists every source route/API endpoint and its target Laravel route/page/API equivalent.
  - [ ] Evidence file explicitly marks `logs` as excluded from data migration.
  - [ ] Evidence file confirms no new frontend framework is introduced.

  **QA Scenarios**:
  ```
  Scenario: Route inventory completeness
    Tool: Bash
    Steps: From repo root, enumerate source `src/routes` and target `grind-buddy-v2/routes`; compare against evidence table.
    Expected: Every source route has status: migrated, intentionally removed, or auth-replaced.
    Evidence: .sisyphus/evidence/task-1-route-inventory.md

  Scenario: Exclusion guardrail
    Tool: Bash
    Steps: Search target migration plan/evidence for `logs` import tasks.
    Expected: `logs` is only mentioned as excluded, archived, or non-migrated; no import implementation is requested.
    Evidence: .sisyphus/evidence/task-1-logs-exclusion.txt
  ```

  **Commit**: YES | Message: `chore(migration): inventory source and target parity` | Files: evidence/notes only if repository convention allows, otherwise no commit

- [x] 2. Design OAuth-Only Identity Schema with TDD

  **What to do**: In `grind-buddy-v2/`, write failing Pest tests for OAuth-only users and social accounts, then create/update migrations/models/factories. Keep `users` for Laravel session auth; make password nullable or remove password dependency according to Laravel compatibility, but no password login. Add `social_accounts` with unique `(provider, provider_user_id)`, linked `user_id`, provider email, avatar URL, and timestamps. Returning users match by provider/provider ID only. Same-email different-provider login is blocked until explicit account linking exists. Null email is rejected.
  **Must NOT do**: Do not match returning users by email alone. Do not migrate Neon Auth IDs. Do not store provider tokens unless a specific feature requires them.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: identity schema affects every auth boundary.
  - Skills: [] - Laravel Boost docs/tools are available in target environment.
  - Omitted: [`web-design-guidelines`] - backend/schema task.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: Task 4 | Blocked By: Task 1

  **References**:
  - Pattern: `grind-buddy-v2/database/migrations/0001_01_01_000000_create_users_table.php:14-22` - default users table to revise for OAuth-only users.
  - Pattern: `src/lib/server/db/schema.ts:8-19` - legacy auth user shape, not migrated.
  - External: `https://laravel.com/docs/13.x/socialite` - Socialite user identity fields and testing support.

  **Acceptance Criteria**:
  - [ ] Pest tests fail before schema implementation and pass after.
  - [ ] Database enforces unique provider/provider ID.
  - [ ] `logs` and legacy auth tables are not part of target migrations/imports.
  - [ ] Factories can create users and social accounts for tests.

  **QA Scenarios**:
  ```
  Scenario: Unique provider identity
    Tool: Bash
    Steps: Run `php artisan test --compact --filter=SocialAccount` from `grind-buddy-v2`.
    Expected: Duplicate `(provider, provider_user_id)` is rejected; same email with different provider does not auto-link.
    Evidence: .sisyphus/evidence/task-2-social-account-tests.txt

  Scenario: Null email rejection
    Tool: Bash
    Steps: Run `php artisan test --compact --filter=null_email` from `grind-buddy-v2`.
    Expected: OAuth user with null email is rejected with defined error path and no user row.
    Evidence: .sisyphus/evidence/task-2-null-email.txt
  ```

  **Commit**: YES | Message: `feat(auth): define oauth-only identity schema` | Files: `grind-buddy-v2/database/migrations/*`, `grind-buddy-v2/app/Models/*`, `grind-buddy-v2/database/factories/*`, `grind-buddy-v2/tests/*`

- [x] 3. Remove Fortify Email/Password Surface with TDD

  **What to do**: Write failing feature tests proving email/password login, registration, reset, email verification, and 2FA routes/pages are absent or unreachable. Disable Fortify features and remove/replace Inertia auth pages/routes so only OAuth entry points remain. Keep Laravel session middleware and logout behavior.
  **Must NOT do**: Do not delete tests without replacing them with OAuth-only assertions. Do not leave hidden register/reset routes active.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: requires coordinated route/config/test cleanup.
  - Skills: [] - Laravel conventions dominate.
  - Omitted: [`clarify`] - copy changes are minimal and prescribed.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: Tasks 4, 8 | Blocked By: Task 1

  **References**:
  - Pattern: `grind-buddy-v2/config/fortify.php:146-155` - registration/reset/email verification/2FA features to disable.
  - Pattern: `grind-buddy-v2/database/migrations/0001_01_01_000000_create_users_table.php:24-28` - password reset tokens table must not be needed for target auth.
  - Pattern: `grind-buddy-v2/resources/js/pages/auth/login.tsx` - email/password login page to replace.

  **Acceptance Criteria**:
  - [ ] Tests prove `/login`, `/register`, password reset, email verification, and 2FA setup are not available as email/password flows.
  - [ ] Existing Laravel auth tests are updated to OAuth-only behavior.
  - [ ] Logout remains available for authenticated OAuth users.

  **QA Scenarios**:
  ```
  Scenario: Email auth routes unreachable
    Tool: Bash
    Steps: Run `php artisan test --compact --filter=EmailPasswordAuthDisabled` from `grind-buddy-v2`.
    Expected: Register/reset/verification/2FA routes return 404 or redirect-away exactly as tests specify.
    Evidence: .sisyphus/evidence/task-3-email-auth-disabled.txt

  Scenario: Logout remains functional
    Tool: Bash
    Steps: Run `php artisan test --compact --filter=logout` from `grind-buddy-v2`.
    Expected: Authenticated user is logged out; session invalidated.
    Evidence: .sisyphus/evidence/task-3-logout.txt
  ```

  **Commit**: YES | Message: `refactor(auth): remove email password auth surface` | Files: `grind-buddy-v2/config/fortify.php`, `grind-buddy-v2/routes/*`, `grind-buddy-v2/resources/js/pages/auth/*`, `grind-buddy-v2/tests/*`

- [x] 4. Implement Socialite Google/GitHub Auth with TDD

  **What to do**: Add `laravel/socialite` dependency with explicit approval in the task notes, configure `config/services.php` and env examples for Google/GitHub, add whitelisted provider redirect/callback routes, implement controller logic, and write tests first using `Socialite::fake()`. Use stateful sessions, provider whitelist, null email rejection, returning-user lookup by provider ID, session regeneration, and post-login redirect to dashboard.
  **Must NOT do**: Do not use `stateless()`. Do not call `Socialite::driver()` before validating provider is `google` or `github`. Do not perform live OAuth in CI.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: security-critical OAuth flow.
  - Skills: [] - Requires Laravel/Boost docs in target app.
  - Omitted: [`overdrive`] - avoid unnecessary auth abstraction or novelty.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: Tasks 8, 10, 11, 12 | Blocked By: Tasks 2, 3

  **References**:
  - External: `https://laravel.com/docs/13.x/socialite` - redirect/callback, provider config, `Socialite::fake()`.
  - External: `https://laravel.com/docs/13.x/authentication` - manual login and session auth.
  - External: `https://laravel.com/docs/13.x/session` - session regeneration and cookie behavior.
  - Pattern: `grind-buddy-v2/composer.json:11-18` - Socialite currently absent from required dependencies.

  **Acceptance Criteria**:
  - [ ] `composer require laravel/socialite` or equivalent dependency update is present.
  - [ ] Google and GitHub env vars exist in `.env.example` only as placeholders.
  - [ ] Pest tests cover new user, returning user, unknown provider, null email, session regeneration, and logout.
  - [ ] `php artisan route:list --path=auth` shows only Google/GitHub Socialite routes plus allowed logout path.

  **QA Scenarios**:
  ```
  Scenario: OAuth redirect and callback tests
    Tool: Bash
    Steps: Run `php artisan test --compact --filter=SocialiteAuthentication` from `grind-buddy-v2`.
    Expected: Google/GitHub redirect and callback tests pass using `Socialite::fake()`; no live provider call occurs.
    Evidence: .sisyphus/evidence/task-4-socialite-tests.txt

  Scenario: Provider whitelist rejection
    Tool: Bash
    Steps: Run `php artisan test --compact --filter=provider_whitelist` and `php artisan route:list --path=auth` from `grind-buddy-v2`.
    Expected: `/auth/twitter` or equivalent unknown provider is rejected before Socialite driver resolution.
    Evidence: .sisyphus/evidence/task-4-provider-whitelist.txt
  ```

  **Commit**: YES | Message: `feat(auth): add google github socialite login` | Files: `grind-buddy-v2/composer.json`, `grind-buddy-v2/composer.lock`, `grind-buddy-v2/config/services.php`, `grind-buddy-v2/routes/*`, `grind-buddy-v2/app/Http/Controllers/*`, `grind-buddy-v2/tests/*`, `grind-buddy-v2/.env.example`

- [x] 5. Port Catalog and New-User Log Schema to Laravel Migrations and Models with TDD

  **What to do**: Write tests/factories first for `Problem`, `Company`, `CompanyProblem`, and a Laravel-owned `Log` model for new post-cutover users. Add migrations preserving source IDs and fields for catalog data. Add `logs` only as an empty target table for fresh user activity; the import task must not import legacy source logs.
  **Must NOT do**: Do not migrate Drizzle `neon_auth` schema. Do not normalize away fields required by current UI without route inventory evidence.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Laravel schema/model work with compatibility requirements.
  - Skills: [] - Backend task.
  - Omitted: [`frontend-ui-ux`] - no UI work.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: Tasks 6, 7, 9 | Blocked By: Task 1

  **References**:
  - Pattern: `src/lib/server/db/schema.ts:101-109` - `problems` fields.
  - Pattern: `src/lib/server/db/schema.ts:111-116` - `companies` fields.
  - Pattern: `src/lib/server/db/schema.ts:118-124` - `company_problems` fields.

  **Acceptance Criteria**:
  - [ ] Pest model/database tests pass for catalog relations.
  - [ ] Migrations preserve source text IDs for `problems` and `companies`.
  - [ ] Target `logs` table exists only for new Laravel user activity and starts empty after catalog import.
  - [ ] No migration imports or seeds legacy `logs`.

  **QA Scenarios**:
  ```
  Scenario: Catalog relations
    Tool: Bash
    Steps: Run `php artisan test --compact --filter=CatalogModel` from `grind-buddy-v2`.
    Expected: Company-problem relations resolve in both directions and preserve source IDs.
    Evidence: .sisyphus/evidence/task-5-catalog-models.txt

  Scenario: No legacy user data schema import
    Tool: Bash
    Steps: Run migrations in test database and inspect tables via Laravel schema/database tooling.
    Expected: No `neon_auth` schema; no imported legacy auth/session/account tables; `logs` exists only as an empty Laravel-owned table if logging is part of route parity.
    Evidence: .sisyphus/evidence/task-5-no-legacy-auth-schema.txt
  ```

  **Commit**: YES | Message: `feat(catalog): add laravel catalog schema` | Files: `grind-buddy-v2/database/migrations/*`, `grind-buddy-v2/app/Models/*`, `grind-buddy-v2/database/factories/*`, `grind-buddy-v2/tests/*`

- [x] 6. Build Idempotent Public Catalog Import Command with TDD

  **What to do**: Create an Artisan command such as `grind:import-catalog` that imports only `problems`, `companies`, and `company_problems` from the cutover snapshot source into the new Laravel database. Tests must run the command twice and assert row counts are unchanged, IDs are preserved, and zero orphan join rows exist. The command must fail loudly on orphaned source rows unless `--skip-orphans` is explicitly documented and tested.
  **Must NOT do**: Do not import `logs`, Neon Auth users, sessions, accounts, verification rows, password data, or source cookies.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: data migration correctness and repeatability.
  - Skills: [] - Laravel Artisan/testing task.
  - Omitted: [`railway:use-railway`] - infrastructure not yet needed.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: Tasks 7, 9, 12 | Blocked By: Task 5

  **References**:
  - Pattern: `src/lib/server/db/schema.ts:101-124` - source public/reference tables.
  - Pattern: `src/lib/server/db/schema.ts:126-135` - source logs table explicitly excluded.
  - API/Type: `grind-buddy-v2/composer.json:69-73` - test command path.

  **Acceptance Criteria**:
  - [ ] Import command has Pest coverage for idempotency.
  - [ ] Row-count parity tests compare source snapshot fixture to target tables.
  - [ ] Orphan join rows are detected and cause a non-zero failure in strict mode.
  - [ ] Legacy logs count in target remains zero after import.

  **QA Scenarios**:
  ```
  Scenario: Idempotent import
    Tool: Bash
    Steps: Run `php artisan test --compact --filter=ImportCatalogCommand` from `grind-buddy-v2`.
    Expected: Import can run twice with identical row counts and no duplicates.
    Evidence: .sisyphus/evidence/task-6-import-idempotency.txt

  Scenario: Logs are not imported
    Tool: Bash
    Steps: Run import test fixture containing log rows or a source logs table; assert target has no legacy log rows.
    Expected: Target legacy logs count is zero and command reports logs skipped/excluded.
    Evidence: .sisyphus/evidence/task-6-no-logs-import.txt
  ```

  **Commit**: YES | Message: `feat(catalog): add idempotent import command` | Files: `grind-buddy-v2/app/Console/Commands/*`, `grind-buddy-v2/tests/*`, `grind-buddy-v2/database/*`

- [x] 7. Recreate Catalog, Log, and Server Routes with TDD

  **What to do**: Port source API behavior and server-side route data to Laravel controllers/resources. Preserve JSON response shapes needed by current UI for companies, company detail, company match, health, catalog/dashboard data, and new-user log create/update/delete behavior where present in the source app. Write feature tests before each endpoint implementation. Gate authenticated routes with Laravel auth middleware and enforce ownership for new Laravel logs.
  **Must NOT do**: Do not expose user logs from legacy data. Do not leak debug headers in production health responses.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: multiple endpoints and response-shape compatibility.
  - Skills: [] - Laravel API/controller work.
  - Omitted: [`frontend-ui-ux`] - route/API task.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: Tasks 9, 12 | Blocked By: Tasks 5, 6

  **References**:
  - Pattern: `src/routes/api/companies/[slug]/+server.ts` - source company detail API pattern.
  - Pattern: `src/routes/+layout.server.ts:54-58` - current layout data returned to UI.
  - Pattern: `src/routes/+layout.server.ts:18-21` - protected-route redirect behavior.

  **Acceptance Criteria**:
  - [ ] Feature tests prove every route in Task 1 parity table returns expected status and shape.
  - [ ] Log mutation tests prove new users can create/update/delete only their own Laravel-created logs.
  - [ ] Auth-required routes redirect unauthenticated users to OAuth entry/login page.
  - [ ] Health debug data is disabled or non-production gated.

  **QA Scenarios**:
  ```
  Scenario: API shape parity
    Tool: Bash
    Steps: Run `php artisan test --compact --filter=CatalogApi` from `grind-buddy-v2`.
    Expected: Company list/detail/match endpoints match expected fixture response keys and statuses.
    Evidence: .sisyphus/evidence/task-7-api-parity.txt

  Scenario: Auth gate parity
    Tool: Bash
    Steps: Run route feature tests for unauthenticated dashboard/catalog routes.
    Expected: Unauthenticated protected routes redirect to OAuth login surface; public health/auth routes remain reachable.
    Evidence: .sisyphus/evidence/task-7-auth-gates.txt
  ```

  **Commit**: YES | Message: `feat(api): port catalog routes to laravel` | Files: `grind-buddy-v2/routes/*`, `grind-buddy-v2/app/Http/Controllers/*`, `grind-buddy-v2/app/Http/Resources/*`, `grind-buddy-v2/tests/*`

- [x] 8. Rebuild Auth UI and App Shell in Inertia React

  **What to do**: Replace email/password auth screens with OAuth-only Google/GitHub buttons and copy. Port the source layout shell, navigation, modal behavior, authenticated/guest branching, and close visual styling into existing Inertia React/Tailwind/Radix patterns. Use route helpers/Wayfinder where already used. Add test IDs for parity QA.
  **Must NOT do**: Do not introduce Svelte into Laravel. Do not add password fields, register forms, reset links, or visual redesigns.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: close UI parity in React/Inertia.
  - Skills: [`web-design-guidelines`] - accessibility and UI quality checks.
  - Omitted: [`bolder`, `delight`] - preserve current UI, no new personality pass.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: Task 12 | Blocked By: Tasks 3, 4

  **References**:
  - Pattern: `src/routes/+layout.svelte` - source layout shell and auth route detection.
  - Pattern: `src/routes/(auth)/login/+page.svelte` - source login UX to replace with OAuth-only equivalent.
  - API/Type: `grind-buddy-v2/package.json:31-68` - React, Inertia, Radix, Tailwind target stack.

  **Acceptance Criteria**:
  - [ ] OAuth login page contains only Google and GitHub sign-in actions.
  - [ ] No password/register/reset UI remains.
  - [ ] App shell has route-level visual parity checklist from Task 1.
  - [ ] `npm run types:check` passes.

  **QA Scenarios**:
  ```
  Scenario: OAuth-only login UI
    Tool: Playwright
    Steps: Open `/login` or configured auth entry route; inspect buttons and links.
    Expected: Google and GitHub buttons present; no email/password/register/reset controls present.
    Evidence: .sisyphus/evidence/task-8-oauth-login-ui.png

  Scenario: App shell parity
    Tool: Playwright
    Steps: Authenticate via test session, open dashboard, compare required nav/sidebar/modal elements from Task 1 checklist.
    Expected: All required elements present with matching copy and layout roles.
    Evidence: .sisyphus/evidence/task-8-app-shell.png
  ```

  **Commit**: YES | Message: `feat(ui): rebuild oauth shell in inertia` | Files: `grind-buddy-v2/resources/js/*`, `grind-buddy-v2/routes/*`, `grind-buddy-v2/tests/*`

- [x] 9. Port Dashboard, Catalog, Analytics, and Fresh-Log User Flows

  **What to do**: Rebuild the main Svelte pages in Inertia React with close UI parity. Because legacy logs are not migrated, new users start with empty progress/logbook/analytics states, but the current logging interactions must work for new post-cutover data if they exist in the source route inventory. Write tests first for rendered props, empty states, and new-user log interactions.
  **Must NOT do**: Do not import or display legacy logs. Do not add new analytics features or redesign charts.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: page migration and visual parity.
  - Skills: [`web-design-guidelines`] - accessibility and UI quality.
  - Omitted: [`overdrive`] - no ambitious redesign.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: Task 12 | Blocked By: Tasks 5, 6, 7

  **References**:
  - Pattern: `src/routes/+layout.server.ts:27-58` - source problem/log data contract; logs become empty for fresh users.
  - Pattern: `src/lib/server/db/schema.ts:126-135` - legacy log shape, not imported.
  - Pattern: `src/lib/server/db/schema.ts:101-124` - catalog data available to pages.

  **Acceptance Criteria**:
  - [ ] All pages in Task 1 parity table render in Laravel/Inertia.
  - [ ] Fresh OAuth user sees empty progress/logbook/analytics states without errors.
  - [ ] No legacy logs are visible or queryable.
  - [ ] `npm run types:check` and page feature tests pass.

  **QA Scenarios**:
  ```
  Scenario: Fresh user empty states
    Tool: Playwright
    Steps: Authenticate as a new OAuth test user; visit dashboard, logbook, analytics pages.
    Expected: Catalog content renders; log/progress areas show empty-state copy and no crashes.
    Evidence: .sisyphus/evidence/task-9-fresh-user-empty-states.png

  Scenario: Catalog page parity
    Tool: Playwright
    Steps: Visit catalog/company pages using seeded data from import fixture.
    Expected: Problem cards/company pages display preserved titles, slugs, difficulty, patterns, and links.
    Evidence: .sisyphus/evidence/task-9-catalog-parity.png
  ```

  **Commit**: YES | Message: `feat(ui): port main app pages to inertia` | Files: `grind-buddy-v2/resources/js/pages/*`, `grind-buddy-v2/app/Http/Controllers/*`, `grind-buddy-v2/tests/*`

- [x] 10. Harden Test, Type, Build, and CI Gates

  **What to do**: Ensure CI and local scripts run the migration's required gates: Pest/PHPUnit, Pint, TypeScript, ESLint/Prettier checks, and production build. Update existing workflows only as needed. Do not add a browser/e2e dependency; Playwright QA is agent-executed evidence, not a permanent package unless separately approved.
  **Must NOT do**: Do not weaken existing CI. Do not skip failing legacy starter tests; rewrite or remove only when replaced by OAuth-only tests.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: CI/test integration across PHP and JS.
  - Skills: [] - Tooling task.
  - Omitted: [`optimize`] - performance tuning out of scope.

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: Task 12 | Blocked By: Task 4

  **References**:
  - API/Type: `grind-buddy-v2/composer.json:62-73` - existing `ci:check` and `test` scripts.
  - API/Type: `grind-buddy-v2/package.json:5-13` - JS build/lint/type scripts.

  **Acceptance Criteria**:
  - [ ] `composer run test` passes.
  - [ ] `composer run ci:check` passes.
  - [ ] `npm run types:check` passes.
  - [ ] `npm run build` passes.

  **QA Scenarios**:
  ```
  Scenario: Full local gate
    Tool: Bash
    Steps: From `grind-buddy-v2`, run `composer run ci:check` and `npm run build`.
    Expected: Both commands exit 0.
    Evidence: .sisyphus/evidence/task-10-ci-build.txt

  Scenario: No weakened CI
    Tool: Bash
    Steps: Inspect `.github/workflows` and composer/npm scripts after changes.
    Expected: Test/lint/type/build gates are equal or stricter than before.
    Evidence: .sisyphus/evidence/task-10-ci-diff.txt
  ```

  **Commit**: YES | Message: `ci: enforce laravel migration gates` | Files: `grind-buddy-v2/.github/workflows/*`, `grind-buddy-v2/composer.json`, `grind-buddy-v2/package.json`

- [x] 11. Configure New Database and Deployment Environment

  **What to do**: Create/prepare the new target database and environment variable plan. Add Laravel env placeholders for database, sessions, app URL, Google/GitHub OAuth credentials, and redirect URIs. Ensure dev/staging/prod OAuth callback URI checklist exists in task evidence. Remove source Neon Auth env dependency from Laravel target. Use Neon MCP only to create/inspect the new database if the executor has project approval and credentials.
  **Must NOT do**: Do not print secrets. Do not reuse source Neon Auth base URLs. Do not modify production traffic yet.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: environment/deployment planning and validation.
  - Skills: [] - Infrastructure-adjacent, not Railway-specific unless deployment uses Railway.
  - Omitted: [`railway:use-railway`] - only load if deployment execution confirms Railway actions are required.

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: Task 12 | Blocked By: Task 4

  **References**:
  - Pattern: `README.md` - source env uses `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `PUBLIC_NEON_AUTH_URL`.
  - Pattern: `grind-buddy-v2/.env.example` - target Laravel env template to update.
  - External: `https://laravel.com/docs/13.x/socialite` - provider env/service config.

  **Acceptance Criteria**:
  - [ ] Target `.env.example` documents Google/GitHub placeholders and no secret values.
  - [ ] Target env plan contains dev/staging/prod callback URIs for both providers.
  - [ ] Laravel target does not require `NEON_AUTH_BASE_URL` or `PUBLIC_NEON_AUTH_URL`.
  - [ ] New database connection is verified without touching source production data.

  **QA Scenarios**:
  ```
  Scenario: Env placeholder audit
    Tool: Bash
    Steps: Inspect target `.env.example` and config for OAuth/database variables.
    Expected: Placeholders exist; no real secrets; no Neon Auth URL dependency.
    Evidence: .sisyphus/evidence/task-11-env-audit.txt

  Scenario: Database connection check
    Tool: Bash
    Steps: From `grind-buddy-v2`, run Laravel database/schema inspection against the new target database.
    Expected: Connection succeeds and source database is not modified.
    Evidence: .sisyphus/evidence/task-11-db-connection.txt
  ```

  **Commit**: YES | Message: `chore(env): configure oauth database environment` | Files: `grind-buddy-v2/.env.example`, `grind-buddy-v2/config/services.php`, deployment env notes/evidence

- [x] 12. Direct Cutover Smoke Script and Go/No-Go Runbook

  **What to do**: Create an executable cutover smoke script under `grind-buddy-v2/scripts/` that checks build artifacts, key unauthenticated routes, OAuth redirect initiation, authenticated smoke path via test session or test helper, catalog row counts, no legacy log import, and health endpoint. Create an internal runbook in task evidence with pre-freeze, snapshot/import, deploy, smoke, switch traffic, and rollback boundary. Because user chose direct cutover, no dual-run implementation is required.
  **Must NOT do**: Do not switch traffic automatically. Do not decommission the source app until smoke passes and user approves outside this task.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: release safety and verification scripting.
  - Skills: [] - Shell/Laravel verification task.
  - Omitted: [`writing`] - runbook is operational and evidence-focused, not public docs.

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: Final Verification | Blocked By: Tasks 4, 6, 7, 8, 9, 10, 11

  **References**:
  - API/Type: `grind-buddy-v2/composer.json:62-73` - pre-cutover command gates.
  - API/Type: `grind-buddy-v2/package.json:5-13` - JS/type/build gates.
  - Pattern: `src/lib/server/db/schema.ts:101-135` - row-count and no-log assertions.

  **Acceptance Criteria**:
  - [ ] `scripts/cutover-smoke.sh` exits 0 only when all smoke checks pass.
  - [ ] Runbook defines exact go/no-go criteria and rollback boundary.
  - [ ] Smoke verifies no legacy logs are imported.
  - [ ] Smoke verifies OAuth redirect initiation for Google and GitHub.

  **QA Scenarios**:
  ```
  Scenario: Smoke script pass
    Tool: Bash
    Steps: From `grind-buddy-v2`, run `bash scripts/cutover-smoke.sh` against staging/preview config.
    Expected: Exit 0; output includes build, auth redirect, catalog count, and no-log checks.
    Evidence: .sisyphus/evidence/task-12-smoke-pass.txt

  Scenario: Smoke script failure behavior
    Tool: Bash
    Steps: Run smoke script with intentionally missing OAuth env or empty catalog fixture.
    Expected: Exit non-zero with clear failing check name.
    Evidence: .sisyphus/evidence/task-12-smoke-fail.txt
  ```

  **Commit**: YES | Message: `chore(cutover): add direct cutover smoke checks` | Files: `grind-buddy-v2/scripts/cutover-smoke.sh`, evidence/runbook notes if tracked

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.
- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high (+ playwright for UI)
- [ ] F4. Scope Fidelity Check — deep

## Commit Strategy
- Commit per task when that task's tests and QA evidence pass.
- Use conventional messages shown in each task.
- Do not commit secrets, `.env`, or source production exports.
- Do not modify root Svelte source except read-only reference unless a cutover/deployment task explicitly requires config removal after approval.

## Success Criteria
- Laravel app in `grind-buddy-v2/` replaces source app functionality with close UI parity.
- Google and GitHub OAuth are the only auth entry points.
- Fresh users can sign in, sign out, and access protected app pages.
- Source Neon Auth users/sessions/cookies do not authenticate the Laravel app.
- Public/reference catalog data is available in the new database with preserved IDs and valid relations.
- Legacy logs/user-owned data are not imported.
- Direct cutover smoke script and CI gates pass before traffic switch.
