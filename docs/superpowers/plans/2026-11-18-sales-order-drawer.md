# Sales Order Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep Sales Order detail drawer clear of the sidebar and close it on outside click.

**Architecture:** Add a fixed backdrop positioned over the content region only; place the existing detail drawer inside it. Backdrop click closes; drawer clicks do not.

**Tech Stack:** React, TypeScript, CSS.

**Spec:** `docs/superpowers/specs/2026-11-18-sales-order-drawer-design.md`

## Global Constraints

- No new dependency.
- Keep sidebar outside backdrop.
- Respect reduced motion and responsive layout.

## Review Focus

- Clicking drawer content must not close it.
- Clicking content outside drawer closes it.
- Sidebar remains visible and usable.
- Narrow viewport backdrop/drawer remain usable.
- Reduced motion disables added motion.

---

### Task 1: Backdrop and drawer positioning

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/styles.css`

**Interfaces:** Reuse `detailOrder` and `setDetailOrder`; no new dependencies or API behavior.

- [ ] Wrap `aside.so-detail` in a backdrop with a click handler that clears `detailOrder` only when `event.target === event.currentTarget`.
- [ ] Position backdrop from the content edge, not viewport edge; ensure drawer stays within content and above page content, below sidebar.
- [ ] Keep close button behavior; add/reuse reduced-motion rule if drawer/backdrop motion is introduced.
- [ ] Run `npm run build` and `npm run check` in `frontend`; inspect outside-click, drawer-click, and sidebar behavior.
