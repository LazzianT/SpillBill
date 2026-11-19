# Portainer Stack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy frontend/API from one Git-backed Portainer Stack at host ports 1001 and 1002, using existing VPS MySQL.

**Architecture:** Docker Compose builds frontend and backend images from repo. Frontend static server embeds public API URL at build time; backend reads values supplied by Portainer's uploaded `.env` through Compose interpolation.

**Tech Stack:** Docker Compose, Node 22, Vite, nginx.

**Spec:** `docs/superpowers/specs/2026-11-19-portainer-stack-design.md`

## Global Constraints

- Map host ports `1001:80` and `1002:3000`.
- Do not commit secrets or `.env`.
- MySQL stays external on VPS.
- Frontend API URL must be reachable from the browser.

## Review Focus

- Missing Portainer variables fail deployment clearly; compose config validation.
- Frontend production route refresh works; image build and local HTTP smoke check.
- Wrong API build URL fails deployment setup; document exact `VITE_API_URL` value.
- Backend build context never contains `.env`; `.dockerignore` and staged-file review.
- Existing server health endpoint remains healthy on container port 3000; Compose healthcheck.

---

### Task 1: Production frontend image

**Files:** Create `frontend/Dockerfile`, `frontend/nginx.conf`, `frontend/.dockerignore`.

**Interfaces:** Build arg `VITE_API_URL`; serve Vite `dist` on container port 80 with SPA fallback.

- [ ] Build image with `VITE_API_URL` argument, verify successful Vite production build and SPA fallback config.
- [ ] Verify no dependency/build artifacts enter image context.

### Task 2: Portainer Compose Stack and backend context safety

**Files:** Create root `docker-compose.yml`; create `backend/.dockerignore`.

**Interfaces:** Services `frontend`, `backend`; `frontend` depends on backend startup only, not health availability; backend runtime environment uses required `${VAR:?message}` interpolation; API host mapping `1002:3000`; frontend `1001:80`; backend healthcheck `/health`.

- [ ] Add Compose config using Portainer-uploaded env variables and `VITE_API_URL` build argument.
- [ ] Validate interpolation and exact port mappings with `docker compose config` using temporary non-secret values.
- [ ] Confirm `.env` excluded from backend image context.

### Task 3: Portainer instructions

**Files:** Create root `.env.example`; update root `README.md` and backend setup docs as needed.

- [ ] Document Portainer Git Stack deployment, uploading local environment file, setting `VITE_API_URL` to `http://<VPS-IP-or-domain>:1002`, MySQL VPS reachability/firewall, and port mappings.
- [ ] Clearly warn: do not commit real `.env`; use a strong unique `AUTH_TOKEN_SECRET`.
- [ ] Verify docs agree with Compose variable names and ports.
