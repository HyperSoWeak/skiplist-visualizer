# Skip List Visualizer Monorepo

This monorepo contains the backend service for a skip list visualizer and a reserved frontend workspace for future work.

## Workspace Layout

```text
apps/
  backend/   NestJS backend with Swagger, skip list logic, and tests
  frontend/  Placeholder directory only
```

## Quick Start

```bash
npm install
npm run start:dev
```

Backend API:

```text
http://localhost:3000
```

Swagger UI:

```text
http://localhost:3000/docs
```

## Monorepo Scripts

Run from the repository root:

```bash
npm run build
npm run start:dev
npm run lint
npm run test
npm run test:e2e
npm run format
```

## Development Rules

- Use Git and Conventional Commits
- Keep skip list core logic separate from animation step generation
- Write developer-facing documentation in English
- Treat deterministic testing and replayability as first-class requirements

## Documentation

- Backend guide: `apps/backend/README.md`
- Interactive API docs: Swagger at `http://localhost:3000/docs`
