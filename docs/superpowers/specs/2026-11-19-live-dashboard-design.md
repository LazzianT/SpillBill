# Dashboard Data Real Design

- Goal: replace hard-coded dashboard metrics/charts with calculations from existing authenticated API data.
- Decisions: current-month SO count by `order_date`; current-month new customers by `created_at`; unbilled SO means `DRAFT`, count and total from real records; six-month monthly SO trend; status donut uses all non-archived SOs across `DRAFT`, `INVOICED`, `CANCELLED`.
- Approach: derive values client-side from already-fetched customers and sales orders; add `createdAt` to customer API DTO/list query. No dashboard endpoint or chart dependency.
- UX: preserve existing dashboard layout; replace fixed SVG/chart numbers with actual values and scale chart geometry from data; handle empty datasets without division-by-zero or misleading percentages.
- Non-goals: change SO lifecycle, introduce analytics packages, or alter dashboard filters/authorization.
- Verification: unit tests for date boundaries, empty/zero data, all statuses, monthly trends; frontend build and backend tests.
