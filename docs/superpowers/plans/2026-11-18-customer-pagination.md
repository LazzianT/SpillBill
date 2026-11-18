# Customer Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task.

**Goal:** Make Pelanggan pagination controls change visible customer rows.

**Architecture:** Paginate the existing filtered client-side list; reset to page 1 when search/filter changes and clamp after list shrink. No API or dependency changes.

**Tech Stack:** React, TypeScript, existing Node assert checks.

**Spec:** `docs/superpowers/specs/2026-11-18-customer-pagination-design.md`

## Global Constraints

- No fixture/fallback data.
- Search and filter apply before pagination.
- Empty result shows no rows; page controls reflect filtered count.

## Review Focus

- Zero results: show zero rows, page 1, disable navigation.
- Filter/search shrinks pages: clamp/reset so no blank page.
- First/last page: disable Previous/Next appropriately.

---

### Task 1: Paginate customer rows

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/lib/dashboard.ts`
- Test: `frontend/src/lib/dashboard.test.ts`

**Interfaces:**
- Consumes: `Customer[]` after `filterCustomers`.
- Produces: exported `paginate<T>(items: T[], page: number, pageSize: number): { items: T[]; pageCount: number }` used by `CustomerPage`.

- [ ] Add tests for first/last pages and empty list; run `npm run check` to confirm expected failure.
- [ ] Implement minimal generic pagination helper and wire Pelanggan page controls, preserving current page size shown in UI.
- [ ] Reset page on search/filter change; clamp page when filtered results shrink; disable out-of-range controls.
- [ ] Run `npm run build` and `npm run check` in `frontend`.
