import { SkipList } from '../src/skiplist/core/skip-list';

describe('SkipList core', () => {
  it('tracks a not-found search on an empty list', () => {
    const skipList = new SkipList();

    const result = skipList.find(10);

    expect(result.found).toBe(false);
    expect(result.trace.transitions.at(-1)?.action).toBe('stop');
    expect(result.state.values).toEqual([]);
    expect(result.state.height).toBe(1);
  });

  it('inserts values in sorted order on the bottom layer', () => {
    const skipList = new SkipList();

    skipList.insert(20, { flipSequence: [false] });
    skipList.insert(10, { flipSequence: [false] });
    const result = skipList.insert(15, { flipSequence: [false] });

    expect(result.inserted).toBe(true);
    expect(result.state.values).toEqual([10, 15, 20]);
    expect(result.insertedNodes).toHaveLength(1);
    expect(result.state.height).toBe(1);
  });

  it('inserts at the front and back boundaries without breaking order', () => {
    const skipList = new SkipList();

    skipList.insert(20, { flipSequence: [false] });
    skipList.insert(40, { flipSequence: [false] });
    const frontInsert = skipList.insert(10, { flipSequence: [false] });
    const backInsert = skipList.insert(50, { flipSequence: [false] });

    expect(frontInsert.insertedNodes[0]).toMatchObject({
      level: 0,
    });
    expect(backInsert.insertedNodes[0]).toMatchObject({
      level: 0,
    });
    expect(skipList.getState().values).toEqual([10, 20, 40, 50]);
  });

  it('promotes a tower and adds top levels when flips continue', () => {
    const skipList = new SkipList();

    const result = skipList.insert(25, { flipSequence: [true, true, false] });

    expect(result.inserted).toBe(true);
    expect(result.coinFlips).toEqual([true, true, false]);
    expect(result.insertedNodes).toHaveLength(3);
    expect(result.addedLevels.map((level) => level.level)).toEqual([1, 2]);
    expect(result.state.height).toBe(3);
  });

  it('traces a multi-level search with right and down moves before finding the target', () => {
    const skipList = new SkipList();

    skipList.insert(10, { flipSequence: [true, false] });
    skipList.insert(20, { flipSequence: [false] });
    skipList.insert(30, { flipSequence: [true, true, false] });
    skipList.insert(40, { flipSequence: [false] });

    const result = skipList.find(40);
    const actions = result.trace.transitions.map(
      (transition) => transition.action,
    );

    expect(result.found).toBe(true);
    expect(actions).toContain('move_right');
    expect(actions).toContain('move_down');
    expect(actions.at(-1)).toBe('found');
  });

  it('rejects duplicate inserts without mutating state', () => {
    const skipList = new SkipList();

    skipList.insert(5, { flipSequence: [false] });
    const result = skipList.insert(5, { flipSequence: [true, true, false] });

    expect(result.inserted).toBe(false);
    expect(result.reason).toBe('duplicate');
    expect(result.state.values).toEqual([5]);
    expect(result.state.height).toBe(1);
  });

  it('keeps state unchanged when deleting a missing value from a populated list', () => {
    const skipList = new SkipList();

    skipList.insert(10, { flipSequence: [false] });
    skipList.insert(20, { flipSequence: [true, false] });
    const beforeDelete = skipList.getState();

    const result = skipList.delete(15);

    expect(result.deleted).toBe(false);
    expect(result.reason).toBe('missing');
    expect(result.removedNodes).toEqual([]);
    expect(result.state).toEqual(beforeDelete);
  });

  it('reports a missing delete cleanly on an empty list', () => {
    const skipList = new SkipList();

    const result = skipList.delete(999);

    expect(result.deleted).toBe(false);
    expect(result.reason).toBe('missing');
    expect(result.trace.transitions.at(-1)?.action).toBe('stop');
    expect(result.state.values).toEqual([]);
    expect(result.state.height).toBe(1);
  });

  it('deletes an entire tower and prunes empty top levels', () => {
    const skipList = new SkipList();

    skipList.insert(10, { flipSequence: [false] });
    skipList.insert(20, { flipSequence: [true, true, false] });
    skipList.insert(30, { flipSequence: [false] });

    const result = skipList.delete(20);

    expect(result.deleted).toBe(true);
    expect(result.removedNodes).toHaveLength(3);
    expect(result.removedLevels.map((level) => level.level)).toEqual([2, 1]);
    expect(result.state.values).toEqual([10, 30]);
    expect(result.state.height).toBe(1);
  });

  it('preserves structure correctness across mixed inserts, finds, and deletes', () => {
    const skipList = new SkipList({ seed: 1234 });

    skipList.insert(30);
    skipList.insert(10);
    skipList.insert(50);
    skipList.insert(20);
    skipList.insert(40);

    const findExisting = skipList.find(20);
    const findMissing = skipList.find(35);
    const deleteExisting = skipList.delete(30);
    const deleteMissing = skipList.delete(999);

    expect(skipList.getState().values).toEqual([10, 20, 40, 50]);
    expect(findExisting.found).toBe(true);
    expect(findMissing.found).toBe(false);
    expect(deleteExisting.deleted).toBe(true);
    expect(deleteMissing.deleted).toBe(false);
    expect(skipList.getState().height).toBeGreaterThanOrEqual(1);
  });

  it('uses a configured seed to keep promotion deterministic across resets', () => {
    const first = new SkipList({ seed: 7 });
    const second = new SkipList({ seed: 7 });

    const firstResult = first.insert(11);
    const secondResult = second.insert(11);

    expect(firstResult.coinFlips).toEqual(secondResult.coinFlips);
    expect(firstResult.state.height).toBe(secondResult.state.height);
  });

  it('replays the same seeded operation sequence into an identical final state', () => {
    const first = new SkipList({ seed: 99 });
    const second = new SkipList({ seed: 99 });
    const values = [12, 7, 19, 3, 15];

    for (const value of values) {
      first.insert(value);
      second.insert(value);
    }

    first.delete(12);
    second.delete(12);
    first.insert(21);
    second.insert(21);

    expect(first.getState()).toEqual(second.getState());
  });
});
