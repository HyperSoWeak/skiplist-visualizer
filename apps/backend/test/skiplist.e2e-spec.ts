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

  it('inserts with deterministic flip results and exposes the final structure', async () => {
    const response = await request(httpServer)
      .post('/insert')
      .send({ value: 42, flipSequence: [true, false] })
      .expect(200);
    const body = operationBody(response);

    expect(body.success).toBe(true);
    expect(body.coinFlips).toEqual([true, false]);
    expect(body.finalState?.height).toBe(2);
    expect(body.finalState?.values).toEqual([42]);
    expect(body.steps.some((step) => step.type === 'add_level')).toBe(true);
  });

  it('finds and reports missing values with animation completion', async () => {
    await request(httpServer)
      .post('/insert')
      .send({ value: 10, flipSequence: [false] })
      .expect(200);
    await request(httpServer)
      .post('/insert')
      .send({ value: 25, flipSequence: [false] })
      .expect(200);

    const response = await request(httpServer)
      .post('/find')
      .send({ value: 20 })
      .expect(200);
    const body = operationBody(response);

    expect(body.success).toBe(false);
    expect(body.showAlert).toBe(true);
    expect(body.steps.at(-1)?.type).toBe('complete');
  });

  it('deletes a multi-level tower and removes empty top levels', async () => {
    await request(httpServer)
      .post('/insert')
      .send({ value: 10, flipSequence: [false] })
      .expect(200);
    await request(httpServer)
      .post('/insert')
      .send({ value: 20, flipSequence: [true, true, false] })
      .expect(200);
    await request(httpServer)
      .post('/insert')
      .send({ value: 30, flipSequence: [false] })
      .expect(200);

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
});
