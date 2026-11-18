# Dashboard Skeleton After Login

**Intent:** Make dashboard entry feel responsive with a skeleton state immediately after login.

**Goal:** Show dashboard-shaped skeleton for exactly 2 seconds after successful login, then show existing dashboard content.

**Non-goals:** No login/auth behavior changes, API loading, navigation skeletons, or new dependency.

**Approaches:** (1) Add a two-second skeleton gate to login transition; selected for minimal scope and explicit duration. (2) Simulate data fetch latency; rejected because this adds fake network behavior. (3) Show only the existing Sales Order loading rows; rejected because it does not resemble the dashboard.

**Constraints:** Keep current role selection and route behavior. Use CSS for shimmer; respect `prefers-reduced-motion`. Modify `frontend/src/App.tsx` and `frontend/src/styles.css` only.