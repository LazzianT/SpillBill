# Dashboard Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show dashboard skeleton for 2 seconds after successful login.

**Architecture:** Add a transient loading state in `App`; render dashboard-shaped placeholder until timer finishes. Add minimal shimmer styles.

**Tech Stack:** React, TypeScript, CSS.

**Spec:** `docs/superpowers/specs/2026-11-18-dashboard-skeleton-design.md`

## Global Constraints

- Skeleton duration: exactly 2 seconds.
- Keep current role selection and route behavior.
- No dependency; support `prefers-reduced-motion`.

## Review Focus

- Login failure/empty input must not enter skeleton; existing form validation remains.
- Reduced-motion users still see skeleton without shimmer; CSS media query.
- Successful login exits skeleton after 2 seconds; manual browser check.

---

### Task 1: Add dashboard skeleton gate

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/styles.css`

**Interfaces:**
- Consumes: existing `LoginScreen`, route and role state.
- Produces: accessible dashboard skeleton shown for 2000ms after valid submit.

- [ ] Add dashboard skeleton component/state with `aria-busy="true"` and placeholder blocks matching dashboard structure.
- [ ] Set loading on successful login, schedule removal after 2000ms, preserve role and navigation.
- [ ] Add CSS shimmer animation and disable motion under `prefers-reduced-motion`.
- [ ] Run `npm run build` in `frontend`; expected: successful TypeScript check and Vite build.
- [ ] Verify in browser: login success shows skeleton first, dashboard appears after 2 seconds; empty login remains on login screen.
