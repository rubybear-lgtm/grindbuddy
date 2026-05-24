# Chrome Web Store Listing — Grind Buddy Logger

> Last Updated: 2026-05-24

This document serves as the single source of truth for publishing and updating the **Grind Buddy Logger** Chrome Extension in the Chrome Web Store. Use these exact details when completing your Chrome Developer Dashboard submission.

---

## 1. Store Listing Metadata

* **Extension Name** [REQUIRED]
  * `Grind Buddy Logger` (19 / 75 characters)

* **Short Description** [REQUIRED]
  * `Log LeetCode and NeetCode problems from a compact Chrome extension popup.` (74 / 132 characters)

* **Detailed Description** [REQUIRED]
  * ```text
    Grind Buddy Logger is the ultimate companion tool for Grind Buddy, helping you log your LeetCode and NeetCode practice history without ever leaving your active problem tab.

    Key Features:
    - In-Tab Detection: Automatically detects the LeetCode or NeetCode problem title, difficulty, and URL so you never have to search or copy-paste manually.
    - One-Click Logging: Quick-submit solved problems directly from an active in-page toast or a clean, highly styled popup.
    - Spaced Repetition Sync: Your logged problems sync instantly with your grindbuddy.xyz spacing queue to help schedule your reviews optimally.
    - Flexible Notes: Draft comments and track problem status (Attempted, Solved, Reviewed) instantly.

    How to Use:
    1. Click the "Add to Chrome" button on our app or install directly from this store listing.
    2. Log into your Grind Buddy account at https://grindbuddy.xyz.
    3. Navigate to any LeetCode or NeetCode problem.
    4. Click the extension popup or use the in-page log tool to instantly save your progress.

    Privacy & Security:
    We take privacy seriously. All data is securely transmitted directly to your personal Grind Buddy dashboard origin over HTTPS. We do not sell your data or utilize tracking scripts.
    ```

* **Category** [REQUIRED]
  * `Developer Tools`

* **Single Purpose** [REQUIRED]
  * `Logs LeetCode and NeetCode problem-solving progress directly into your Grind Buddy account.`

* **Primary Language** [REQUIRED]
  * `English`

---

## 2. Graphics & Assets

The official high-end store listing graphics have been generated and copied into your extension folder:

| Asset | Dimensions | Status | Local Workspace Filename |
|-------|-----------|--------|--------------------------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | `chrome-extension/assets/store_icon.png` |
| Promo Tile [RECOMMENDED] | 440×280 PNG | ✅ Ready | `chrome-extension/assets/promo_tile.png` |
| Marquee Banner [RECOMMENDED] | 1400×560 PNG | ✅ Ready | `chrome-extension/assets/marquee_banner.png` |

---

## 3. Permissions Justifications

These justifications must be copied exactly into the Developer Console's permission explanation section to avoid instant review rejections:

| Permission | Type | Plain-English Justification for CWS Reviewers |
|------------|------|-----------------------------------------------|
| `storage` | permissions | Used to securely store user settings, preferences, and the authenticated API token on-device. |
| `tabs` | permissions | Used to detect the active tab's URL and document title in order to identify which LeetCode or NeetCode problem is active. |
| `https://grindbuddy.xyz/*` | host_permissions | Necessary to securely transmit logged problem details and synchronize user sessions with the Grind Buddy production origin. |
| `http://127.0.0.1:8000/*` | host_permissions | Used for safe local developer sandbox testing during app development. |

---

## 3. Privacy & Data Use Disclosures

These declarations are required for the **Data Use** questionnaire in the console:

### Data Collection & Transmission
* **Does the extension collect user data?** **Yes**

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Authentication info | Yes | Yes (to grindbuddy.xyz) | To authorize and sync the logged progress to the user's secure account. | No |
| Website content | Yes | Yes (to grindbuddy.xyz) | Parses the active page URL and tab title to detect LeetCode problem details. | No |

### Data Use Certifications
- [x] Data is **NOT** sold to third parties.
- [x] Data is **NOT** used for purposes unrelated to the extension's core functionality (e.g. ad tracking).
- [x] Data is **NOT** used for creditworthiness or lending purposes.

---

## 4. How to Build & Package for Upload

To generate the distribution ZIP archive for the Chrome Developer Console:

### Step 1: Compile the Extension
In your local project terminal, run the specialized configuration build script:
```bash
npm run build:extension
```
This compiles the extension assets under Manifest V3 rules into the target directory:
`chrome-extension/dist/`

### Step 2: Build the Zip File
Create a compressed `.zip` archive containing only the contents of the `chrome-extension/dist/` directory.

On macOS, run this from the project root:
```bash
cd chrome-extension/dist && zip -r ../grind-buddy-logger.zip . && cd ../..
```
This generates `chrome-extension/grind-buddy-logger.zip`, which is the clean production-ready archive you upload directly to the Developer Console!

---

## 5. Pre-Publish Checklist

Before hitting "Submit for Review" in the console, double-check:
- [x] **Store Icon**: Make sure you have uploaded a clean `128x128px PNG` icon.
- [x] **Screenshots**: Upload at least one screenshot at `1280x800` or `640x400` pixels demonstrating the extension popup in action.
- [x] **Privacy Policy URL**: Link to a live privacy policy page (e.g. `https://grindbuddy.xyz/privacy` or hosted on a GitHub Pages page).
- [x] **Pricing**: Configured as **Free**.
