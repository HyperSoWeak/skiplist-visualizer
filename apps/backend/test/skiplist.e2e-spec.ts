import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Server } from 'http';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import type {
  OperationResult,
  SkipListState,
} from '../src/skiplist/models/skiplist.types';

describe('SkipList API (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;

  function stateBody(response: request.Response): SkipListState {
    return response.body as SkipListState;
  }

  function operationBody(response: request.Response): OperationResult {
    return response.body as OperationResult;
  }

  async function insertValue(
    value: number,
    flipSequence?: boolean[],
  ): Promise<OperationResult> {
    const response = await request(httpServer)
      .post('/insert')
      .send(flipSequence ? { value, flipSequence } : { value })
      .expect(200);

    return operationBody(response);
  }

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    httpServer = app.getHttpServer() as Server;
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns the current skip list state', async () => {
    const response = await request(httpServer).get('/state').expect(200);
    const body = stateBody(response);

    expect(body.height).toBe(1);
    expect(body.values).toEqual([]);
  });

  it('exposes the richer state payload used by the backend contract', async () => {
    const response = await request(httpServer).get('/state').expect(200);
    const body = stateBody(response);

    expect(typeof body.nodeCount).toBe('number');
    expect(body.configuredSeed).toBeNull();
    expect(body.rngState).toBeNull();
    expect(typeof body.levels[0]?.headId).toBe('string');
    expect(typeof body.levels[0]?.tailId).toBe('string');
    expect(Array.isArray(body.levels[0]?.nodeIds)).toBe(true);
    expect(body.levels[0]?.nodes[0]?.prevId).toBeNull();
    expect(body.levels[0]?.nodes[0]?.upId).toBeNull();
    expect(body.levels[0]?.nodes[0]?.downId).toBeNull();
  });

  it('allows CORS for the documented frontend origin', async () => {
    const response = await request(httpServer)
      .get('/state')
      .set('Origin', 'http://127.0.0.1:5173')
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBe(
      'http://127.0.0.1:5173',
    );
  });

  it('responds with a fixed 127.0.0.1 CORS origin even for localhost requests', async () => {
    const response = await request(httpServer)
      .get('/state')
      .set('Origin', 'http://localhost:5173')
      .expect(200);

    expect(response.headers).toEqual(
      expect.objectContaining({
        'access-control-allow-origin': 'http://127.0.0.1:5173',
      }),
    );
  });

  it('inserts with deterministic flip results and exposes the final structure', async () => {
    const body = await insertValue(42, [true, false]);

    expect(body.success).toBe(true);
    expect(body.coinFlips).toEqual([true, false]);
    expect(body.finalState?.height).toBe(2);
    expect(body.finalState?.values).toEqual([42]);
    expect(body.steps.some((step) => step.type === 'add_level')).toBe(true);
  });

  it('keeps API state sorted when inserting values at both boundaries', async () => {
    await insertValue(20, [false]);
    await insertValue(40, [false]);
    const frontInsert = await insertValue(10, [false]);
    const backInsert = await insertValue(50, [false]);

    expect(frontInsert.finalState?.values).toEqual([10, 20, 40]);
    expect(backInsert.finalState?.values).toEqual([10, 20, 40, 50]);
  });

  it('returns a structured business error when inserting a duplicate value', async () => {
    await insertValue(15, [false]);
    const duplicateInsert = await insertValue(15, [true, true, false]);

    expect(duplicateInsert.success).toBe(false);
    expect(duplicateInsert.showAlert).toBe(true);
    expect(duplicateInsert.message).toContain('already exists');
    expect(duplicateInsert.steps.some((step) => step.type === 'error')).toBe(
      true,
    );
    expect(duplicateInsert.finalState?.values).toEqual([15]);
  });

  it('finds and reports missing values with animation completion', async () => {
    await insertValue(10, [false]);
    await insertValue(25, [false]);

    const response = await request(httpServer)
      .post('/find')
      .send({ value: 20 })
      .expect(200);
    const body = operationBody(response);

    expect(body.success).toBe(false);
    expect(body.showAlert).toBe(true);
    expect(body.steps.at(-1)?.type).toBe('complete');
  });

  it('returns traversal steps for a successful multi-level find', async () => {
    await insertValue(10, [true, false]);
    await insertValue(20, [false]);
    await insertValue(30, [true, true, false]);
    await insertValue(40, [false]);

    const response = await request(httpServer)
      .post('/find')
      .send({ value: 40 })
      .expect(200);
    const body = operationBody(response);
    const stepTypes = body.steps.map((step) => step.type);

    expect(body.success).toBe(true);
    expect(stepTypes).toContain('move_right');
    expect(stepTypes).toContain('move_down');
    expect(stepTypes).toContain('found');
    expect(stepTypes.at(-1)).toBe('complete');
  });

  it('deletes a multi-level tower and removes empty top levels', async () => {
    await insertValue(10, [false]);
    await insertValue(20, [true, true, false]);
    await insertValue(30, [false]);

    const response = await request(httpServer)
      .post('/delete')
      .send({ value: 20 })
      .expect(200);
    const body = operationBody(response);

    expect(body.success).toBe(true);
    expect(body.finalState?.height).toBe(1);
    expect(body.finalState?.values).toEqual([10, 30]);
    expect(body.steps.some((step) => step.type === 'remove_level')).toBe(true);
  });

  it('reports a business error when deleting a missing value and keeps state unchanged', async () => {
    await insertValue(10, [false]);
    await insertValue(20, [true, false]);

    const beforeDelete = stateBody(
      await request(httpServer).get('/state').expect(200),
    );
    const response = await request(httpServer)
      .post('/delete')
      .send({ value: 999 })
      .expect(200);
    const body = operationBody(response);

    expect(body.success).toBe(false);
    expect(body.showAlert).toBe(true);
    expect(body.steps.some((step) => step.type === 'error')).toBe(true);
    expect(body.finalState).toEqual(beforeDelete);
  });

  it('resets the list with a seed and preloaded values', async () => {
    const response = await request(httpServer)
      .post('/reset')
      .send({ seed: 9, values: [3, 7] })
      .expect(200);
    const body = operationBody(response);

    expect(body.success).toBe(true);
    expect(body.finalState?.configuredSeed).toBe(9);
    expect(body.finalState?.values).toEqual([3, 7]);
  });

  it('replays the same seeded reset and insert sequence into the same state', async () => {
    const firstReset = operationBody(
      await request(httpServer)
        .post('/reset')
        .send({ seed: 77, values: [5, 10, 15] })
        .expect(200),
    );

    const firstInsert = await insertValue(25);
    const firstDelete = operationBody(
      await request(httpServer).post('/delete').send({ value: 10 }).expect(200),
    );

    const secondReset = operationBody(
      await request(httpServer)
        .post('/reset')
        .send({ seed: 77, values: [5, 10, 15] })
        .expect(200),
    );

    const secondInsert = await insertValue(25);
    const secondDelete = operationBody(
      await request(httpServer).post('/delete').send({ value: 10 }).expect(200),
    );

    expect(firstReset.finalState).toEqual(secondReset.finalState);
    expect(firstInsert.coinFlips).toEqual(secondInsert.coinFlips);
    expect(firstDelete.finalState).toEqual(secondDelete.finalState);
  });

  it('rejects duplicate values in reset preload input', async () => {
    const response = await request(httpServer)
      .post('/reset')
      .send({ seed: 1, values: [4, 4] })
      .expect(400);
    const body = operationBody(response);

    expect(body.success).toBe(false);
    expect(body.actionType).toBe('validation');
    expect(body.message).toContain('All values');
  });

  it('returns a structured validation error for invalid input', async () => {
    const response = await request(httpServer)
      .post('/insert')
      .send({ value: 'hello' })
      .expect(400);
    const body = operationBody(response);

    expect(body.success).toBe(false);
    expect(body.actionType).toBe('validation');
    expect(body.showAlert).toBe(true);
  });

  it('rejects an empty insert payload', async () => {
    const response = await request(httpServer)
      .post('/insert')
      .send({})
      .expect(400);
    const body = operationBody(response);

    expect(body.success).toBe(false);
    expect(body.actionType).toBe('validation');
    expect(body.message).toContain('value');
  });
});
