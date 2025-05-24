# Environment Specific Modifications

This file tracks changes made during development that need to be considered or reverted/adjusted for production deployment to Oracle VM (backend) and Vercel (frontend).

## Current Status: Debugging scraper execution and UI updates.

---

## Backend (`le-moissoneur-v2/backend`)

### 1. Browser Executable Paths (`.env` vs. Code Logic)

*   **Local Development (Windows):**
    *   Playwright/Puppeteer will attempt to use their locally installed browser binaries. We ran `npx playwright install`.
    *   To **override** the default local path (e.g., if you have a portable Chrome or a specific version for dev), you can optionally set in your local `.env`:
        *   `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH_DEV=C:/path/to/your/dev/chrome.exe`
        *   `PUPPETEER_EXECUTABLE_PATH_DEV=C:/path/to/your/dev/chrome.exe`
    *   If these `_DEV` vars are not set, the scrapers will let Playwright/Puppeteer auto-detect.
    *   The production vars (`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`, `PUPPETEER_EXECUTABLE_PATH`) should be commented out in the local `.env`.
    *   Code in `playwrightScraper.js` and `puppeteerScraper.js` was updated (around 2024-05-24) to prioritize these `_DEV` vars when `NODE_ENV !== 'production'`, then fall back to `null` (auto-detect) if not set.

*   **Production (Oracle VM - Linux):**
    *   `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser`
    *   `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser`
    *   These **must be set correctly** in the production `.env` file on the VM.
    *   The `process.env.NODE_ENV` should be set to `production`. The code in scraper files will then prioritize these env vars.
    *   Ensure `chromium-browser` (or the specified executable) is installed and accessible on the VM.

### 2. `NODE_ENV` Setting

*   **Local Development:** `.env` has `NODE_ENV=dev` (or similar non-production value).
*   **Production (Oracle VM):** `ecosystem.config.js` sets `NODE_ENV: "production"`. The `.env` on VM should also reflect this.

### 3. Scraper Script Structure (Playwright & Puppeteer)

*   **Change Made (Local Dev - 2024-05-24):**
    *   Both `playwrightScraper.js` and `puppeteerScraper.js` were significantly refactored.
    *   Added more detailed logging around browser launch, context creation, page creation, navigation (`page.goto`), and selector waiting.
    *   Standardized argument handling for `executablePath` based on `NODE_ENV` and optional `_DEV` environment variables.
    *   Improved error handling and browser closing in `try/catch/finally` blocks.
    *   Introduced browser contexts in Playwright.
    *   Set user-agent strings.
    *   Looping for pagination and data extraction now includes more status updates.
*   **Reason:** To debug issues where browsers launched but were stuck on `about:blank` and to make scraper execution more robust and transparent through logging.
*   **Production Consideration:** These structural improvements and enhanced logging are beneficial for production as well. Ensure the core data extraction and pagination logic within these refactored scripts is thoroughly tested and correct.

---

## Frontend (`le-moissoneur-v2/frontend`)

### 1. API Endpoint Configuration (`.env.local` vs. `.env.production`)

*   **Local Development (`.env.local`):**
    *   `VITE_API_URL=http://localhost:4000`
    *   `VITE_API_BASE_URL=http://localhost:4000/api`
    *   These should point to the local backend.

*   **Production (Vercel - `.env.production` or Vercel environment variables):**
    *   `VITE_API_URL=https://api.sikso.ch`
    *   `VITE_API_BASE_URL=https://api.sikso.ch/api`
    *   These must point to the deployed backend on the Oracle VM.

### 2. Scraper Execution UI (`Dashboard.tsx` vs. `ScrapersPage.tsx`)

*   **Change Made (Local Dev):**
    *   Removed `handleRunScraper`, local `scraperStatus` state, and related UI from `Dashboard.tsx`.
    *   Made `onRunScraper` prop optional in `ScraperCard.tsx` and conditionally rendered the run button.
*   **Reason:** To prevent conflicting WebSocket event handler registrations and simplify state management for scraper statuses, centralizing it to `ScrapersPage.tsx`.
*   **Production Consideration:** This change is likely beneficial for production as well, promoting a clearer UI flow. No specific reversal is probably needed, but it's a design choice to be aware of.

---

## Socket.IO Real-time Updates

### Issue: Frontend UI Stuck or Not Receiving All Scraper Status Updates

*   **Root Cause (Initial):** The `scraperStatusService.ts` had issues with managing socket connections, ensuring the client reliably joined the correct Socket.IO room (`scraper-<scraperId>`) after connection, and handling multiple scraper instances or reconnections gracefully. This led to the frontend often missing status updates after the initial "initializing" message.
*   **Fix (Initial):**
    *   Refactored `scraperStatusService.ts` (around 2024-05-24) to:
        *   Centralize socket instance creation and management.
        *   Ensure `join-scraper` is emitted only after the socket's `'connect'` event fires.
        *   Handle (re)joining rooms for *all* active scraper callbacks when a new socket connection is established (e.g., on initial connect or after a reconnect).
        *   Improved event listener management (using `.once` for initial connection setup, `.on` for persistent listeners like `scraper-status`).
        *   Simplified reconnection logic, relying more on Socket.IO's built-in mechanisms.
        *   Add more robust logging.
*   **Root Cause (Secondary - for multiple scrapers):** When multiple scrapers were run, the frontend `scraperStatusService.ts` could not reliably determine which `scraperId` an incoming `scraper-status` message belonged to if `data.scraperId` was not present in the event payload. The fallback logic was insufficient.
*   **Fix (Secondary):**
    *   Modified `backend/src/websocket/scraperStatusHandler.js` to **always include `scraperId` directly in the `scraper-status` event payload** sent to the client.
    *   Simplified the `scraperId` resolution logic in `frontend/src/services/scraperStatusService.ts` to directly use `data.scraperId` from the event payload, removing the more complex fallback mechanisms.
*   **Production Consideration:** These fixes are critical for both local development and production to ensure real-time UI updates function as expected. The backend must send `scraperId` in the payload, and the frontend must use it.

--- 