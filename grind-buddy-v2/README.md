# Grind Buddy

Grind Buddy is a Laravel + Inertia app for logging, reviewing, and analyzing LeetCode and NeetCode problems. It also ships with a Chrome extension that detects matching problem pages and opens a compact logging popup directly from the page.

## What It Does

- Logs problems from the app dashboard, logbook, and analytics views
- Matches problems by canonical catalog identity
- Lets you log from LeetCode and NeetCode without leaving the page
- Opens the extension popup from an in-page notification
- Supports a compact notification badge with configurable size
- Matches the current system theme in the extension UI

## Tech Stack

- Laravel 13
- Inertia.js v3
- React 19
- Tailwind CSS v4
- Chrome Extension Manifest V3

## Prerequisites

- PHP 8.5+
- Composer
- Node.js 22+
- npm
- Chrome

## Setup

1. Install dependencies.

```bash
composer install
npm install
```

2. Configure environment variables.

```bash
cp .env.example .env
php artisan key:generate
```

3. Set the app URL before building the Chrome extension.

```env
APP_URL=http://localhost:8000
```

If you deploy the app elsewhere, set `APP_URL` or `VITE_APP_URL` to the deployed origin before building the extension.

4. Run migrations.

```bash
php artisan migrate
```

## Run Locally

Use the Laravel helper script to run the app, queue listener, logs, and Vite together:

```bash
composer run dev
```

If you prefer to run pieces separately:

```bash
php artisan serve
npm run dev
```

## Chrome Extension

Build the extension bundle:

```bash
npm run build:extension
```

Then load the unpacked extension in Chrome:

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select `chrome-extension/dist`

The extension works on:

- `https://leetcode.com/*`
- `https://www.leetcode.com/*`
- `https://neetcode.io/*`

When it finds an exact match, it shows a small in-page notification. Clicking `Log` opens the extension popup, and `Open in app` takes you to the app log flow.

## Useful Commands

- `composer run dev` - run the app locally
- `php artisan test` - run the backend test suite
- `npm run lint:check` - run ESLint
- `npm run types:check` - run TypeScript checks
- `npm run build` - build the web app
- `npm run build:extension` - build the Chrome extension

## Notes

- The extension manifest permissions are built at compile time from `APP_URL` or `VITE_APP_URL`.
- Reload the unpacked extension after rebuilding.
- If the app or extension UI does not reflect a change, rebuild and refresh the page or extension first.
