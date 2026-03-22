# Backend Developer Guide

This backend is a NestJS service that owns the skip list data structure, operation tracing, and Swagger documentation for the skip list visualizer project.

## What This Service Does

- Maintains the live skip list structure, including sentinel nodes and vertical towers
- Executes `find`, `insert`, `delete`, and `reset` operations
- Records step-by-step animation events that a frontend can replay in order
- Supports deterministic coin flips through a fixed seed or per-request `flipSequence`
- Exposes OpenAPI documentation through Swagger

## Project Structure

```text
src/
  configure-app.ts                 Shared Nest application configuration
  skiplist/
    core/                          Pure skip list data structure and domain mutations
    dto/                           Request validation DTOs
    models/                        Response contracts and Swagger models
    skiplist-operation-recorder.ts Maps domain mutations into animation steps
    skiplist.controller.ts         HTTP endpoints
    skiplist.service.ts            Application service boundary
test/
  skiplist-core.spec.ts            Core data structure tests
  skiplist.e2e-spec.ts             API-level integration tests
```

## Local Development

Install dependencies from the monorepo root:

```bash
npm install
```

Run the backend in watch mode from the monorepo root:

```bash
npm run start:dev
```

The API starts on `http://localhost:3000` by default.

Swagger UI is available at:

```text
http://localhost:3000/docs
```

## Useful Commands

Run these commands from the monorepo root unless you intentionally work inside `apps/backend`.

```bash
npm run build
npm run lint
npm run test
npm run test:e2e
npm run format
```

If you want to run backend scripts directly:

```bash
npm run build --workspace backend
npm run test --workspace backend -- --runInBand
```

## Deterministic Behavior

The backend supports two deterministic modes for insert promotions:

1. Fixed seed

Use `POST /reset` with a `seed` value. All later inserts will use the seeded pseudo-random generator until the next reset.

2. Explicit flip sequence

Use `POST /insert` with `flipSequence`, for example:

```json
{
  "value": 42,
  "flipSequence": [true, true, false]
}
```

The inserted node appears on the bottom layer first, then each `true` adds one more promoted layer. The first `false` stops the tower growth. If the sequence ends, promotion stops.

## Architecture Notes

- `core/skip-list.ts` does not know about HTTP or Swagger. It only mutates the data structure and returns domain-level facts.
- `skiplist-operation-recorder.ts` converts those domain facts into animation-friendly step objects.
- Controller and DTO layers only handle transport concerns such as validation and API metadata.

This separation is important. If you add a new animation event, prefer extending the recorder instead of mixing UI playback logic into the core skip list implementation.

## Testing Strategy

The backend currently covers:

- Empty-list search
- Ordered insertion
- Deterministic multi-level promotion
- Duplicate insert rejection
- Multi-level deletion and top-level pruning
- Seeded randomness replay
- API validation failures
- Reset with seed and preload values

When adding behavior, update both:

- core tests for data structure correctness
- e2e tests for HTTP contract and response shape

## Commit Convention

Use Conventional Commits. Examples:

```text
feat: add batch insert endpoint
fix: correct top-level pruning after delete
docs: document deterministic replay workflow
test: cover delete on empty skip list
```

Keep commits scoped to one meaningful change. This repository intentionally records large milestones as separate commits.
