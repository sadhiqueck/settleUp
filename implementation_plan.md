# Progressive Docker Setup Plan (Engine v29.3.1)

Based on your feedback, we will implement the Docker configuration progressively. This ensures each layer works properly before adding complexity, adhering strictly to modern Docker Compose specs (no `version` field, BuildKit default, legacy builder removed).

## Proposed Progressive Implementation

### Phase 1: Foundational Compose Dev Setup
The goal is to get the basic services talking to each other locally.
- **`docker-compose.yml` (Root)**: Create a modern spec file defining three services:
  - `postgres`: Running PostgreSQL 16+, bound to 5432, with a `db-data` local volume for persistence, and a healthcheck.
  - `api`: A minimal local `Dockerfile.dev` utilizing `node:22-alpine`, basic `pnpm install`, and `npm run start:dev` (port `3000`). It will mount the workspace codebase and `depends_on` the database healthcheck.
  - `web`: A minimal local `Dockerfile.dev` utilizing `node:22-alpine`, basic `pnpm install`, and `npm run dev` (port `5173`), mounting the workspace codebase.

### Phase 2: Add Hot-Reloading (`watch`)
Once the basic containers boot and communicate, we will optimize local development iteration speed.
- **`docker-compose.yml`**: Introduce [Compose Watch](https://docs.docker.com/compose/how-tos/file-watch/) functionality to the `api` and `web` services.
  - Sync source file changes instantly into the container without requiring image rebuilds or manual container restarts, specifically utilizing `action: sync`.
  - Trigger automatic package installation on `package.json` changes using `action: rebuild`.

### Phase 3: Add Production Multi-Stage Builds
When the local dev environment is flawless, we will introduce production-ready builds.
- **`apps/api/Dockerfile.prod`**: A two-stage Dockerfile that builds the NestJS app (including `npx prisma generate`) and produces a lean runner image without source code overhead.
- **`apps/web/Dockerfile.prod`**: A two-stage Dockerfile that builds the Vite static assets (`npm run build`) and serves them via a lightweight `nginx:alpine` image.

### Phase 4: Turborepo Pruning/Caching Optimizations
Finally, to optimize CI/CD pipelines and monorepo scale:
- Enhance the production Dockerfiles to leverage `turbo prune`.
- Setup BuildKit cache mounts (`--mount=type=cache,target=/pnpm/store`) for substantially faster subsequent dependency installations.
- Implement explicit `.dockerignore` restrictions.

## Open Questions

> [!NOTE]
> For Phase 1, Prisma migrations need to run so the NestJS backend can connect successfully. Would you prefer to define a `db-migrate` initialization service or run Prisma migrations via a `command` override inside the `api` container for local dev?

## Verification Plan
1. **End of Phase 1**: Run `docker compose up --build` and verify the basic containers boot, mount, and run servers.
2. **End of Phase 2**: Run `docker compose watch` and verify real-time file changes reflect locally.
3. **End of Phase 3**: Build production targets and test artifact deployments.
4. **End of Phase 4**: Perform clean builds (`--no-cache`) and successive builds to verify prune times & BuildKit cache hits.
