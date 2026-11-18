# React Router Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add React Router routes and route-specific document titles while preserving the existing dashboard UI and local demo behavior.

**Architecture:** Wrap the existing `App` with `BrowserRouter` in `main.tsx`. Keep page components and state in `App.tsx`; derive the active page from `useLocation()`, navigate menu clicks with `useNavigate()`, and update `document.title` from a small route metadata map.

**Tech Stack:** React, TypeScript, Vite, `react-router-dom`.

**Spec:** Existing request: React Router routes with different titles per page.

## Global Constraints

- Keep the existing navy/white/lime design tokens and page layout.
- No backend persistence or new abstraction beyond route metadata.
- Preserve role-based menu visibility and demo login behavior.
- Validate route access at the UI trust boundary: disallowed direct paths fall back to the first page available to the current role.
- No secrets in code.

## Review Focus

- Direct route refresh: renders the correct page and title.
- Browser back/forward: active menu and rendered page follow the location.
- Role restriction: Accounting cannot open Marketing-only routes by URL; Marketing cannot open Accounting-only routes by URL.
- Unknown route: falls back to `/dashboard` without rendering an invalid page.
- Login transition: successful demo login lands on `/dashboard` with the dashboard title.

---

### Task 1: Add React Router dependency and route metadata checks

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Modify: `frontend/src/lib/dashboard.test.ts`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Produce exported `pageRoutes`, `pageForPath(path: string)`, and `titleForPath(path: string)` helpers for route mapping checks.

- [ ] **Step 1: Write the failing route mapping checks**

Add assertions for `/invoice`, `/pembayaran`, an unknown path, and each page title.

- [ ] **Step 2: Run `npm run check` and confirm the route helpers are missing**

Run from `frontend/`: `npm run check`.

- [ ] **Step 3: Install `react-router-dom` using npm**

Run from `frontend/`: `npm install react-router-dom`.

- [ ] **Step 4: Implement minimal route metadata helpers in `App.tsx`**

Use one route metadata array containing label, path, and title. Unknown paths map to Dashboard. Export only the helpers needed by the existing check.

- [ ] **Step 5: Run `npm run check` and confirm route checks pass**

Expected: `dashboard checks passed`.

### Task 2: Wire BrowserRouter navigation and document titles

**Files:**
- Modify: `frontend/src/main.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- `main.tsx` renders `<BrowserRouter><App /></BrowserRouter>`.
- `App` consumes `useLocation` and `useNavigate` from `react-router-dom`.

- [ ] **Step 1: Implement BrowserRouter wrapping in `main.tsx`**

Keep the existing root render and StrictMode behavior.

- [ ] **Step 2: Replace local active-page navigation with location-based navigation**

Use `location.pathname` to derive `active`, `navigate(path)` in `selectPage`, and normalize unknown paths to `/dashboard` after authentication. Preserve current modal closing behavior.

- [ ] **Step 3: Add route-specific document title effect**

Set `document.title` to `SpillBill | Login` while unauthenticated and the mapped route title while authenticated.

- [ ] **Step 4: Guard role-inaccessible direct paths**

When authenticated, if the current page is not in `visibleNav`, navigate to the first allowed page without discarding existing data state.

### Task 3: Verify route behavior

**Files:**
- No new files.

- [ ] **Step 1: Run the complete checks**

From `frontend/`:

```bash
npm run build
npm run check
```

Expected: both commands pass.

- [ ] **Step 2: Verify browser flows**

Check login, `/dashboard`, Finance `/invoice`, Finance `/pembayaran`, direct `/invoice` refresh, browser back/forward, and role-restricted direct navigation. Confirm `document.title` changes per page and console errors remain zero.
