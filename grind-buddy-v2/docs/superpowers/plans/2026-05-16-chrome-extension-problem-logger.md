# Chrome Extension Problem Logger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome extension that detects exact LeetCode/NeetCode problem pages, resolves them to Grind Buddy catalog entries, and lets the user log the problem from a compact popup with notes and status.

**Architecture:** The app remains the source of truth for problem matching and log creation. The extension only extracts page identity, asks the app to resolve it, and submits the log from a compact popup. Grind Buddy also gains a deep-link path so the same matched problem can be opened inside the existing logbook dialog when the user wants the larger app surface.

**Tech Stack:** Laravel 13, Inertia React 3, TypeScript 5, Chrome Manifest V3, Vite, Pest 4, Laravel CORS/session middleware.

---

### Task 1: Add an exact-match problem resolver API

**Files:**
- Create: `app/Http/Controllers/Api/ProblemMatchController.php`
- Modify: `routes/web.php`
- Modify: `tests/Feature/Api/ProblemMatchApiTest.php`

- [ ] **Step 1: Write the failing tests**

```php
it('requires authentication for the problem match endpoint', function () {
    $this->postJson('/api/problem-match', [
        'source' => 'leetcode',
        'url' => 'https://leetcode.com/problems/two-sum/',
        'title' => 'Two Sum',
        'number' => 1,
        'slug' => 'two-sum',
    ])->assertUnauthorized();
});

it('returns the exact problem match for a leetcode url', function () {
    $user = User::factory()->create();
    $problem = Problem::factory()->create([
        'id' => 'two-sum',
        'number' => 1,
        'title' => 'Two Sum',
        'difficulty' => 'Easy',
        'leetcode_url' => 'https://leetcode.com/problems/two-sum/',
    ]);

    Log::factory()->create([
        'user_id' => $user->id,
        'problem_id' => $problem->id,
        'status' => 'Optimal',
    ]);

    $this->actingAs($user)->postJson('/api/problem-match', [
        'source' => 'leetcode',
        'url' => 'https://leetcode.com/problems/two-sum/',
        'title' => 'Two Sum',
        'number' => 1,
        'slug' => 'two-sum',
    ])->assertOk()
      ->assertJsonPath('match.id', 'two-sum')
      ->assertJsonPath('match.number', 1)
      ->assertJsonPath('match.title', 'Two Sum')
      ->assertJsonPath('match.difficulty', 'Easy')
      ->assertJsonPath('match.lastLog.status', 'Optimal')
      ->assertJsonPath('matchType', 'url');
});

it('returns null match when the page is not an exact catalog hit', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->postJson('/api/problem-match', [
        'source' => 'neetcode',
        'url' => 'https://neetcode.io/problems/not-in-catalog',
        'title' => 'Not In Catalog',
        'number' => 999,
        'slug' => 'not-in-catalog',
    ])->assertOk()
      ->assertExactJson([
          'match' => null,
          'matchType' => null,
      ]);
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `php artisan test --compact tests/Feature/Api/ProblemMatchApiTest.php`
Expected: fail because the controller and route do not exist yet.

- [ ] **Step 3: Implement the minimal resolver**

Add a controller that:

```php
public function __invoke(Request $request): JsonResponse
{
    $validated = $request->validate([
        'source' => ['required', 'string', Rule::in(['leetcode', 'neetcode'])],
        'url' => ['required', 'string'],
        'title' => ['nullable', 'string'],
        'number' => ['nullable', 'integer'],
        'slug' => ['nullable', 'string'],
    ]);

    $query = Problem::query();
    $problem = match ($validated['source']) {
        'leetcode' => $query->where('leetcode_url', $validated['url'])->first(),
        'neetcode' => $query->where('neetcode_url', $validated['url'])->first(),
    };

    if (! $problem && isset($validated['number'], $validated['title'])) {
        $problem = Problem::query()
            ->where('number', $validated['number'])
            ->whereRaw('lower(title) = ?', [mb_strtolower(trim($validated['title']))])
            ->first();
    }

    if (! $problem) {
        return response()->json(['match' => null, 'matchType' => null]);
    }

    return response()->json([
        'match' => [
            'id' => $problem->id,
            'number' => $problem->number,
            'title' => $problem->title,
            'difficulty' => $problem->difficulty,
            'patterns' => $problem->patterns,
            'leetcodeUrl' => $problem->leetcode_url,
            'neetcodeUrl' => $problem->neetcode_url,
            'lastLog' => $request->user()->logs()
                ->where('problem_id', $problem->id)
                ->latest('timestamp')
                ->first()
                ?->only(['status', 'timestamp']),
        ],
        'matchType' => 'url',
    ]);
}
```

Add the route inside the authenticated group:

```php
Route::post('/api/problem-match', ProblemMatchController::class);
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `php artisan test --compact tests/Feature/Api/ProblemMatchApiTest.php`
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add app/Http/Controllers/Api/ProblemMatchController.php routes/web.php tests/Feature/Api/ProblemMatchApiTest.php
git commit -m "feat: add problem match resolver api"
```

### Task 2: Enable cross-origin extension requests

**Files:**
- Create: `config/cors.php`
- Modify: `bootstrap/app.php`
- Modify: `config/session.php`

- [ ] **Step 1: Write the failing verification**

Add a feature test that exercises a preflight-style request against the new API route and confirms the response includes permissive CORS headers for the extension origin. The request should use an `Origin` header such as `chrome-extension://test-extension-id` and assert the response allows credentials and the configured extension origin.

- [ ] **Step 2: Run the test to see the current failure**

Run: `php artisan test --compact tests/Feature/Api/ProblemMatchApiTest.php`
Expected: no CORS headers yet, so the new assertion fails.

- [ ] **Step 3: Implement the cross-origin bridge**

Create a CORS config that allows the extension origin pattern and the app origin used during local development, then enable the framework CORS middleware in the HTTP bootstrap if this checkout does not already load it. Also exclude the extension-facing API URIs from CSRF protection in `bootstrap/app.php` so the popup can submit credentialed requests without needing to read the session token out of the browser cookie jar.

Use session cookie settings that support credentialed extension requests:

```php
'same_site' => env('SESSION_SAME_SITE', 'none'),
'secure' => env('SESSION_SECURE_COOKIE', true),
```

The goal is for the popup to send authenticated `fetch()` requests with `credentials: 'include'` and the existing session to remain usable from the extension origin.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `php artisan test --compact tests/Feature/Api/ProblemMatchApiTest.php`
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add config/cors.php bootstrap/app.php config/session.php tests/Feature/Api/ProblemMatchApiTest.php
git commit -m "feat: allow chrome extension requests"
```

### Task 3: Add logbook deep-link support for the matched problem

**Files:**
- Modify: `app/Http/Controllers/LogbookController.php`
- Modify: `resources/js/pages/logbook.tsx`
- Modify: `resources/js/components/dashboard/log-problem-dialog.tsx`
- Modify: `tests/Feature/LogbookPageTest.php`

- [ ] **Step 1: Write the failing test**

Add a logbook page test for a request like `/logbook?problemId=two-sum` that asserts the rendered Inertia page includes a `selectedProblemId` prop and the matched problem data is still present in `problems`.

```php
$this->actingAs($user)->get('/logbook?problemId=two-sum')
    ->assertOk()
    ->assertInertia(fn (AssertableInertia $page) => $page
        ->component('logbook')
        ->where('selectedProblemId', 'two-sum')
        ->has('problems', 1));
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `php artisan test --compact tests/Feature/LogbookPageTest.php`
Expected: failure because the controller does not yet pass a selected problem prop.

- [ ] **Step 3: Add the deep-link prop and open behavior**

Update the controller to look up `problemId` from the query string and pass a `selectedProblemId` prop alongside the existing `problems` and `logs`.

Update the logbook page so it:

```tsx
const [logDialogOpen, setLogDialogOpen] = useState(Boolean(selectedProblemId));
const selectedProblem = useMemo(
    () => problems.find((problem) => problem.id === selectedProblemId),
    [problems, selectedProblemId],
);

useEffect(() => {
    if (selectedProblemId) {
        setLogDialogOpen(true);
    }
}, [selectedProblemId]);
```

Update `LogProblemDialog` so it resets when the `defaultProblem` prop changes and uses the matched problem as the initial selected item.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `php artisan test --compact tests/Feature/LogbookPageTest.php`
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add app/Http/Controllers/LogbookController.php resources/js/pages/logbook.tsx resources/js/components/dashboard/log-problem-dialog.tsx tests/Feature/LogbookPageTest.php
git commit -m "feat: support logbook deep links"
```

### Task 4: Build the Chrome extension bundle

**Files:**
- Create: `chrome-extension/manifest.json`
- Create: `chrome-extension/popup.html`
- Create: `chrome-extension/vite.config.ts`
- Create: `chrome-extension/src/background.ts`
- Create: `chrome-extension/src/content.ts`
- Create: `chrome-extension/src/popup.tsx`
- Create: `chrome-extension/src/lib/api.ts`
- Create: `chrome-extension/src/lib/match.ts`
- Create: `chrome-extension/src/lib/storage.ts`
- Create: `chrome-extension/src/lib/types.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing build checks**

Add extension-specific TypeScript entrypoints and a Vite config, then run:

```bash
npm run types:check
npm run lint:check
```

Expected: fail until the extension sources exist.

- [ ] **Step 2: Implement the manifest and runtime flow**

Create a Manifest V3 extension with:

```json
{
  "manifest_version": 3,
  "name": "Grind Buddy Logger",
  "version": "0.1.0",
  "action": {
    "default_popup": "popup.html"
  },
  "background": {
    "service_worker": "src/background.ts"
  },
  "content_scripts": [
    {
      "matches": [
        "https://leetcode.com/*",
        "https://www.leetcode.com/*",
        "https://neetcode.io/*"
      ],
      "js": ["src/content.ts"]
    }
  ],
  "permissions": ["storage", "tabs", "activeTab"],
  "host_permissions": [
    "https://leetcode.com/*",
    "https://www.leetcode.com/*",
    "https://neetcode.io/*"
  ]
}
```

The extension should:

- read the current tab URL
- extract exact page identity from the LeetCode or NeetCode page
- call the new problem-match endpoint
- render the compact popup states
- POST the log with `problemId`, `status`, and `notes`
- open `/logbook?problemId=<id>` in the app when the user clicks `Open in app`

The page extractor should be conservative: prefer canonical URL and slug parsing over brittle DOM scraping, and never guess a match when identity is incomplete.
The build should inject the Grind Buddy app origin into the manifest `host_permissions`, popup, and background API client so authenticated requests target the correct host for the current environment.

- [ ] **Step 3: Wire up build scripts**

Add scripts so the extension can be built independently from the Laravel app, for example:

```json
{
  "scripts": {
    "build:extension": "vite build --config chrome-extension/vite.config.ts",
    "dev:extension": "vite build --watch --config chrome-extension/vite.config.ts"
  }
}
```

- [ ] **Step 4: Run the checks and confirm they pass**

Run:

```bash
npm run types:check
npm run lint:check
npm run build:extension
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add chrome-extension package.json
git commit -m "feat: add chrome extension logger bundle"
```

### Task 5: Verify the end-to-end flow

**Files:**
- Modify: `tests/Feature/Api/LogApiTest.php` if response shape changes
- Modify: `tests/Feature/LogbookPageTest.php` if the deep-link prop needs one more assertion

- [ ] **Step 1: Run the focused backend suite**

Run:

```bash
php artisan test --compact tests/Feature/Api/ProblemMatchApiTest.php tests/Feature/Api/LogApiTest.php tests/Feature/LogbookPageTest.php
```

Expected: all pass.

- [ ] **Step 2: Run the frontend checks**

Run:

```bash
npm run types:check
npm run lint:check
npm run build:extension
```

Expected: all pass.

- [ ] **Step 3: Sanity-check the app flow manually**

Open `/logbook?problemId=two-sum` in the browser, confirm the dialog opens with the matched problem preselected, then confirm the extension popup can resolve the same problem and post a log.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: ship chrome extension problem logger"
```
