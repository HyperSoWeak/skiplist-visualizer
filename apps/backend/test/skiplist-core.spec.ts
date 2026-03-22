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

  it('promotes a tower and adds top levels when flips continue', () => {
    const skipList = new SkipList();

    const result = skipList.insert(25, { flipSequence: [true, true, false] });

    expect(result.inserted).toBe(true);
    expect(result.coinFlips).toEqual([true, true, false]);
    expect(result.insertedNodes).toHaveLength(3);
    expect(result.addedLevels.map((level) => level.level)).toEqual([1, 2]);
    expect(result.state.height).toBe(3);
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

  it('uses a configured seed to keep promotion deterministic across resets', () => {
    const first = new SkipList({ seed: 7 });
    const second = new SkipList({ seed: 7 });

    const firstResult = first.insert(11);
    const secondResult = second.insert(11);

    expect(firstResult.coinFlips).toEqual(secondResult.coinFlips);
    expect(firstResult.state.height).toBe(secondResult.state.height);
  });
});
