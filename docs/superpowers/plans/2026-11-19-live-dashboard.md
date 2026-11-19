# Dashboard Data Real Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace static dashboard KPI values and charts with metrics derived from authenticated live customer and sales-order data.

**Architecture:** Add pure dashboard aggregation helpers in `frontend/src/lib/dashboard.ts`, test through the existing assert-based test runner, and render those results in `App.tsx`. Expose customer `createdAt` in the current customer API response; no new endpoint or dependency.

**Tech Stack:** React, TypeScript, Node.js tests, MySQL.

**Spec:** `docs/superpowers/specs/2026-11-19-live-dashboard-design.md`

## Global Constraints

- Count current-month orders by `order_date` and new customers by `created_at`; all API dates are normalized to `YYYY-MM-DD` calendar strings.
- Treat `DRAFT` orders as unbilled; sum their real SO totals.
- Trend covers six calendar months including current month.
- Status chart covers all non-archived SOs with `DRAFT`, `INVOICED`, `CANCELLED` statuses.
- Keep existing dashboard layout; no new endpoint, chart package, lifecycle changes, or filter/auth changes.
- Empty datasets show zero counts and avoid invalid chart geometry or percentages.

## Review Focus

- Month/year boundary and local date interpretation: helpers must use the date fields' `YYYY-MM-DD` calendar date, not UTC conversion.
- No records or only zero records: donut percentages and trend geometry remain valid.
- Customer creation date missing from API: update DTO and list query together, preserve existing fields.
- Cancelled SOs: exclude from current-month business count? Spec says SO count by order date and unbilled means DRAFT; include all statuses for monthly count/trend, with status donut retaining all three statuses.

---

### Task 1: Customer creation date in live API data

**Files:**
- Modify: `backend/src/repositories.js`
- Test: `backend/test/repositories.test.js`
- Modify: `frontend/src/lib/dashboard.ts`

**Interfaces:**
- `Customer.createdAt: string` carries the API `created_at` date as `YYYY-MM-DD`.
- Customer list query selects `c.created_at`; DTO maps it to `createdAt`.

- [ ] Add repository assertion that customer list SQL selects/maps `created_at` to `createdAt`.
- [ ] Run `npm test` in `backend`; verify the new assertion fails because date is absent.
- [ ] Add `created_at` to query/DTO and `createdAt` to frontend `Customer` type.
- [ ] Run `npm test` in `backend` and `npm run build` in `frontend`; expect pass.

### Task 2: Dashboard metric and chart aggregations

**Files:**
- Modify: `frontend/src/lib/dashboard.ts`
- Modify: `frontend/src/lib/dashboard.test.ts`

**Interfaces:**
- `dashboardMetrics(customers, orders, today)` returns `{ monthlyOrders, newCustomers, unbilledCount, unbilledTotal, trend, statusCounts }`.
- `trend` is six ascending `{ month: 'YYYY-MM', count }` points; `statusCounts` has all three known statuses.

- [ ] Add checks for monthly boundary, six-month trend, draft count/sum, all status counts, and empty input with fixed `today`.
- [ ] Run `npm run check` in `frontend`; confirm it fails because `dashboardMetrics` is absent.
- [ ] Implement aggregation using date string prefixes and six local calendar month keys; no extra abstractions/dependencies.
- [ ] Run `npm run check` in `frontend`; expect dashboard checks passed.

### Task 3: Render data-backed KPI and charts

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/styles.css` only if needed for dynamic chart presentation.

**Interfaces:**
- Dashboard cards read `dashboardMetrics` from live state arrays.
- Trend SVG points, labels, y scale, and area derive from `trend`.
- Donut gradient, center total, legend counts/percentages derive from `statusCounts`; zero total renders neutral ring and 0% values.

- [ ] Replace static KPI fixtures with derived metrics; remove static sparkline deltas/paths rather than presenting invented comparisons.
- [ ] Replace trend and donut literals with computed values; preserve labels and accessible descriptions.
- [ ] Run `npm run check` and `npm run build` in `frontend`, `npm test` in `backend`; expect all pass.
