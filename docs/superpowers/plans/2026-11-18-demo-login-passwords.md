# Demo Login Passwords Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set the seed password hashes for the sales and accounting demo accounts to `sales123` and `finance123`.

**Architecture:** Update only the two `password_hash` values in `database/seed.sql`. Preserve usernames, roles, and insert behavior.

**Tech Stack:** MySQL seed SQL; bcrypt-compatible hashes.

**Spec:** `docs/superpowers/specs/2026-11-18-demo-login-passwords-design.md`

## Global Constraints

- Change only the two credential hashes.
- Do not modify login implementation, usernames, roles, or seed idempotence.
- Verify each hash against its requested password.

## Review Focus

- Both hashes match exactly their requested password; verify using bcrypt comparison.
- Sales/accounting usernames and roles remain unchanged; inspect seed rows.

---

### Task 1: Update demo credential hashes

**Files:**
- Modify: `database/seed.sql` user rows only

**Interfaces:**
- Consumes: bcrypt hash format already used by `users.password_hash`.
- Produces: `admin.sales` password `sales123`; `admin.accounting` password `finance123`.

- [ ] Generate bcrypt hashes without adding a project dependency.
- [ ] Replace only the two `password_hash` literals.
- [ ] Verify both hashes with bcrypt compare and inspect the diff.
