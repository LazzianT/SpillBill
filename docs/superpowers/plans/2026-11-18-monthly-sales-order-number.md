# Monthly Sales Order Number Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate new Sales Order numbers as `SO-YYYY-MM-XXXX`, using the highest number for the order date month plus one.

**Architecture:** Keep numbering in `salesOrderRepository.save`. Query existing monthly numbers inside the transaction; retain the unique index as collision guard and retry generation on a duplicate order-number insert. Edits keep the existing number.

**Tech Stack:** Node.js, MySQL, `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-18-monthly-sales-order-number-design.md`

## Global Constraints

- Format: `SO-YYYY-MM-XXXX`; sequence resets by order date month.
- Generate only for new Sales Orders; editing a Draft preserves its number.
- Do not renumber existing Sales Orders or add a counter table.
- Keep `order_number` unique; do not emit malformed numbers after `9999`.

## Review Focus

- First order in a month: must be `0001` (test in Task 1).
- Existing sequence: increment highest suffix, not row count (test in Task 1).
- Different month: restart at `0001` (test in Task 1).
- Concurrent number collision: retry after duplicate-key insert failure (test in Task 1).
- Sequence exhausted at `9999`: fail safely, no malformed insert (test in Task 1).

---

### Task 1: Generate monthly Sales Order numbers

**Files:**
- Modify: `backend/src/repositories.js` (`salesOrderRepository.save`)
- Test: `backend/test/repositories.test.js`

**Interfaces:**
- Consumes: validated `body.orderDate`; existing MySQL unique key `uq_sales_orders_order_number`.
- Produces: returned and persisted `number` in `SO-YYYY-MM-XXXX` format; edit path preserves the stored number.

- [ ] **Step 1: Add failing repository tests**

Test `salesOrderRepository.save` asserts: empty month returns `SO-2026-11-0001`; highest `SO-2026-11-0007` returns `SO-2026-11-0008` even when mocked rows imply a different count; a December date starts at `SO-2026-12-0001`; a simulated duplicate `order_number` insert retries and commits one successful order; highest `9999` rejects and rolls back without a malformed insert. Also assert the monthly lookup uses the validated year-month prefix.

- [ ] **Step 2: Run targeted tests; confirm new cases fail**

Run: `node --test test/repositories.test.js` from `backend/`.
Expected: existing tests pass; new numbering tests fail against the current UUID-suffix implementation.

- [ ] **Step 3: Implement minimal monthly lookup and collision retry**

In `backend/src/repositories.js`, derive `SO-${body.orderDate.slice(0, 7)}-` and select the lexically greatest matching `order_number`; parse its four-digit suffix, increment, and zero-pad. Use the existing unique key as the final collision guard; on duplicate order-number insert, roll back and retry the transaction with a fresh lookup, bounded to three attempts. Throw a conflict after retries or when the sequence exceeds `9999`. Keep edit path's order number unchanged; do not query/generate a replacement for edits.

- [ ] **Step 4: Run backend tests**

Run: `npm test` from `backend/`.
Expected: all tests pass, including new numbering, retry, exhaustion, and existing repository/API tests.

- [ ] **Step 5: Review diff**

Verify only the intended repository/test changes; confirm schema and existing records remain untouched.
