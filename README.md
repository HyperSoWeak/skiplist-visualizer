# Skip List Visualizer Monorepo

This monorepo contains the backend service and frontend UI for a skip list visualizer.

## Workspace Layout

```text
apps/
  backend/   NestJS backend with Swagger, skip list logic, and tests
  frontend/  Vite React frontend, interative UI
```

## Quick Start

```bash
pnpm install
pnpm dev      # starts both frontend and backend
```

Backend API:

```text
http://localhost:3000
```

Swagger UI:

```text
http://localhost:3000/docs
```

Frontend Dev endpoint

```text
http://127.0.0.1:5173/
```

## Monorepo Scripts

Run from the repository root:

```bash
pnpm build
pnpm dev
pnpm lint
pnpm test
pnpm test:e2e
pnpm format
```

## Development Rules

- Use Git and Conventional Commits
- Keep skip list core logic separate from animation step generation
- Write developer-facing documentation in English
- Treat deterministic testing and replayability as first-class requirements

## Documentation

- Backend guide: `apps/backend/README.md`
- Interactive API docs: Swagger at `http://localhost:3000/docs`
- Frontend guide: `apps/frontend/README.md`