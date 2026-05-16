# Chrome Extension Problem Logger Design

## Summary

Add a Chrome extension that activates on exact LeetCode or NeetCode problem pages, resolves the page to a canonical Grind Buddy `Problem`, and opens a compact log popup prefilled with that match. The user can add notes, choose a status, and submit the log without opening the app. A secondary action opens the same problem in Grind Buddy for a larger review flow.

This feature should feel like a fast capture surface, not a separate product. The extension is only responsible for identifying the current problem, pre-filling the log card, and sending the log request.

## Goals

- Detect when the user is on a supported LeetCode or NeetCode problem page.
- Resolve the page to an exact canonical `Problem` in Grind Buddy.
- Show a compact popup with the matched problem, last log context, status, notes, and submit action.
- Support a direct log submission path from the extension.
- Offer an `Open in app` action for users who want the full Grind Buddy experience.
- Avoid fuzzy matching or guesswork.

## Non-Goals

- No semantic or fuzzy problem matching.
- No auto-creating logs without user confirmation.
- No new log status taxonomy.
- No attempt to parse solution code, runtime, or submission metadata.
- No side panel, dashboard replacement, or in-page overlay in the first version.

## User Flow

1. User opens a supported LeetCode or NeetCode problem page.
2. The extension detects the page and extracts exact problem identity data.
3. The extension calls Grind Buddy to resolve that identity against the canonical problem catalog.
4. If the match is exact, the popup shows the problem card prefilled.
5. The user chooses a status, adds optional notes, and submits the log.
6. The popup confirms success and can optionally open the problem in the app.
7. If the user wants the larger interface, `Open in app` opens the same problem in Grind Buddy with the log card already focused.

## Matching Rules

Matching must be exact only.

The resolver should treat the following as valid exact-match inputs, in priority order:

- Direct URL match against the stored `leetcode_url` or `neetcode_url`.
- Exact canonical slug or path match when a URL is not available.
- Exact number plus normalized title match when both are present.

Normalization must be intentionally narrow:

- lowercase only
- trim outer whitespace
- collapse repeated internal whitespace
- ignore punctuation differences that are functionally irrelevant for the same page title

If the resolver cannot prove an exact match, it must return `not_found`.

## Product Surface

### Extension Popup

The popup is the primary surface.

It should show:

- problem number
- title
- difficulty badge
- source label, such as `LeetCode` or `NeetCode`
- last log summary when available
- status selector
- notes textarea
- primary `Log` action
- secondary `Open in app` action

The popup should be compact and optimized for speed. It should not expose unrelated analytics or the full logbook list.

### App Deep Link

`Open in app` should deep-link to the existing Grind Buddy app and open the same problem in the log flow.

The app should accept a problem-focused route state on `/logbook`, such as `?problemId=<id>`, and open `LogProblemDialog` with the matched problem preselected. This reuses the current logbook experience instead of building a second form.

## Architecture

### Browser Extension

The extension should be split into three responsibilities:

- A content script that detects supported problem pages and extracts exact page identity.
- A popup UI that renders the prefilled log card.
- A background/service worker layer that coordinates page identity, cached match state, and log submission.

The extension should not contain catalog logic. It should delegate matching to Grind Buddy so the app stays the source of truth.

### Backend Resolver

Add a small API surface that resolves a page identity into a canonical problem record.

The resolver can use the existing `problems` table and the `leetcode_url` and `neetcode_url` columns already present on `Problem`.

Suggested resolver response:

```json
{
  "match": {
    "id": "problem-id",
    "number": 1,
    "title": "Two Sum",
    "difficulty": "Easy",
    "patterns": ["array", "hash-map"],
    "leetcodeUrl": "https://leetcode.com/problems/two-sum/",
    "neetcodeUrl": "https://neetcode.io/problems/two-sum",
    "lastLog": {
      "status": "Optimal",
      "timestamp": "2026-05-15T18:20:00.000Z"
    }
  },
  "matchType": "url"
}
```

If there is no exact match, return `match: null`.

### Log Submission

The extension should submit logs through the existing log creation path.

The payload should include:

- `problemId`
- `status`
- `notes`

The extension does not need to send time complexity or space complexity in the first version. Those fields can remain app-only until the product needs them.

## Data Flow

1. The content script extracts exact page metadata from the current LeetCode or NeetCode page.
2. The extension requests a match from Grind Buddy.
3. The backend resolves the page to a canonical `Problem` or returns `not_found`.
4. The popup renders the matched problem card and pre-fills any available last-log context.
5. The user submits the log from the popup.
6. The backend stores the log and returns success.
7. The popup updates state and offers `Open in app` if the user wants to continue in the full app.

## Error Handling

- If the user is not authenticated, the popup should show a sign-in state and offer `Open in app`.
- If the page is not an exact match, the popup should show a `Not in catalog` state and avoid guessing.
- If the backend is unavailable, the popup should show retry affordance and preserve the extracted page metadata.
- If submission fails validation, show the returned error message inline.
- If the user double-clicks submit, disable the action while the request is in flight.

## UX States

The popup needs these states:

- `inactive` - no supported problem detected
- `matching` - extracting and resolving the current page
- `matched` - exact match found and card is ready
- `not_found` - no exact canonical match
- `unauthenticated` - user must sign in to log
- `submitting` - log request in flight
- `success` - log saved
- `error` - lookup or submission failed

## API Considerations

The resolver endpoint should be narrow and explicit.

Suggested request shape:

```json
{
  "source": "leetcode",
  "url": "https://leetcode.com/problems/two-sum/",
  "title": "Two Sum",
  "number": 1,
  "slug": "two-sum"
}
```

Suggested response shape:

```json
{
  "match": {
    "id": "uuid",
    "number": 1,
    "title": "Two Sum",
    "difficulty": "Easy",
    "patterns": ["array", "hash-map"],
    "leetcodeUrl": "https://leetcode.com/problems/two-sum/",
    "neetcodeUrl": null,
    "lastLog": null
  },
  "matchType": "url"
}
```

This keeps the extension simple and preserves the backend as the catalog authority.

## Testing Strategy

### Backend Tests

- exact URL resolution for LeetCode
- exact URL resolution for NeetCode
- exact title and number resolution when URL is absent
- `not_found` when no exact match exists
- log creation from extension payload
- permission checks so only authenticated users can resolve and log

### Extension Tests

- popup renders matched problem state
- popup renders `not_found` state
- popup renders unauthenticated state
- popup submits notes and status successfully
- `Open in app` deep-link resolves the same problem in the app

### App Tests

- logbook route can open the log dialog for a specific problem from a deep link
- log dialog receives the correct prefilled problem

## Implementation Notes

- Reuse the existing `Problem` catalog instead of creating a parallel extension catalog.
- Reuse `LogProblemDialog` behavior for the app deep-link path so the extension and app stay visually and behaviorally aligned.
- Keep matching deterministic and conservative. If the resolver cannot prove identity, it should refuse to match.
- Keep the popup compact. The whole point is to reduce friction, not add another dashboard.
- Assume a single configured Grind Buddy base URL for the first version.
- Return only the latest log summary in the resolver response unless more detail is needed later.
- Use the existing `/logbook` route for the app handoff rather than creating a dedicated log route.
