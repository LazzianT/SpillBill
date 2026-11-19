# Portainer Stack Deployment Design

- Goal: deploy SpillBill frontend and API as one Portainer Git-repository Stack; frontend at `http://<VPS>:1001`, API at `http://<VPS>:1002`. MySQL remains on the VPS.
- Approach: Compose builds both images from repository Dockerfiles. Portainer's Stack environment upload supplies backend runtime values from a local `.env`; Compose maps these values to the API. `VITE_API_URL` is provided as a build arg because Vite embeds it in the browser bundle. No secret file is committed.
- Alternatives considered: proxy API through frontend (smaller public surface but conflicts with direct API access); separately configured containers (more manual work). Chosen: direct API port + one Compose Stack.
- Constraints: host-to-container mappings `1001:80`, `1002:3000`; backend listens on container port 3000; frontend uses static production serving and SPA fallback; API URL must be browser-reachable; include `.env.example` placeholders and health checks.
- Non-goals: provisioning MySQL, TLS/domain setup, deployment automation, or changing app behavior.
- Acceptance: Stack builds both services; frontend API URL is configurable at build time; uploaded environment values configure backend; docs explain Git-based deployment, variable upload, MySQL connectivity, and exposed ports.
