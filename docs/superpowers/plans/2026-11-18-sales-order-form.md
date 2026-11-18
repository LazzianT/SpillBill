# Sales Order Form Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Theme and animate Sales Order create-form selections; make item removal work without removing the final row.

**Architecture:** Add a small reusable custom select in `App.tsx`, scoped to customer/product choices in create form. Remove item rows immutably; CSS supplies focused, open, and row transitions.

**Tech Stack:** React, TypeScript, CSS, Node assert self-check.

**Spec:** `docs/superpowers/specs/2026-11-18-sales-order-form-design.md`

## Global Constraints

- No new dependency.
- Custom select supports Arrow keys, Enter/Space, Escape, type-to-select, outside click, and focus-visible.
- Preserve at least one item row.
- Respect reduced motion.
- Do not change backend or read-only edit form.

## Review Focus

- Empty/current selection displays correctly; keyboard can open/select/close.
- Outside click closes the list without selecting.
- Removing one row preserves all remaining values and calculated total.
- Last row cannot be removed.
- Narrow viewport and reduced-motion preference remain usable.

---

### Task 1: Item-row remove behavior

**Files:**
- Modify: `frontend/src/App.tsx`
- Test: `frontend/src/lib/sales-order-form.test.ts`

**Interfaces:** Add pure helper `removeOrderItem(items, index)` returning remaining rows, but never fewer than one; use helper in `SalesOrderPage`.

- [ ] Test removing a selected row preserves other row data; removing the only row returns it unchanged.
- [ ] Run `node --experimental-strip-types src/lib/sales-order-form.test.ts`; confirm the missing helper fails.
- [ ] Implement helper and a labeled minus button per row; disable when one row remains.
- [ ] Run the test; confirm pass.

### Task 2: Custom themed select

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/styles.css`

**Interfaces:** `ThemedSelect` accepts `value: string`, `options: { value: string; label: string }[]`, `placeholder: string`, `ariaLabel: string`, and `onChange(value: string): void`.

- [ ] Replace customer and product `<select>` controls in create form only.
- [ ] Implement button/listbox semantics; keyboard open, Arrow navigation, Enter/Space select, Escape close, type-to-select, and outside-click close.
- [ ] Style listbox, selected/hover/focus states using existing theme tokens; keep it inside modal scroll bounds and mobile width.
- [ ] Add short open/close and row-add/remove transitions; disable them under reduced motion.
- [ ] Verify `npm run build`, `npm run check`, and the helper self-check; inspect current, empty, and keyboard selection states.
