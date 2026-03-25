import { SkipListState, OperationResult } from '../types/types';

export const MOCK_INITIAL_STATE: SkipListState = {
  height: 3,
  values: [10, 25, 30],
  levels: [
    {
      level: 2,
      nodes: [
        { id: 's2', label: '-∞', numericValue: null, kind: 'start', level: 2, nextId: 'n25-2' },
        { id: 'n25-2', label: '25', numericValue: 25, kind: 'value', level: 2, nextId: 'e2' },
        { id: 'e2', label: '+∞', numericValue: null, kind: 'end', level: 2, nextId: null },
      ]
    },
    {
      level: 1,
      nodes: [
        { id: 's1', label: '-∞', numericValue: null, kind: 'start', level: 1, nextId: 'n10-1' },
        { id: 'n10-1', label: '10', numericValue: 10, kind: 'value', level: 1, nextId: 'n25-1' },
        { id: 'n25-1', label: '25', numericValue: 25, kind: 'value', level: 1, nextId: 'e1' },
        { id: 'e1', label: '+∞', numericValue: null, kind: 'end', level: 1, nextId: null },
      ]
    },
    {
      level: 0,
      nodes: [
        { id: 's0', label: '-∞', numericValue: null, kind: 'start', level: 0, nextId: 'n10-0' },
        { id: 'n10-0', label: '10', numericValue: 10, kind: 'value', level: 0, nextId: 'n25-0' },
        { id: 'n25-0', label: '25', numericValue: 25, kind: 'value', level: 0, nextId: 'n30-0' },
        { id: 'n30-0', label: '30', numericValue: 30, kind: 'value', level: 0, nextId: 'e0' },
        { id: 'e0', label: '+∞', numericValue: null, kind: 'end', level: 0, nextId: null },
      ]
    }
  ]
};

// --- Mock Operations ---

export const MOCK_FIND_SUCCESS = (val: number): OperationResult => ({
  success: true,
  message: `Found value ${val}.`,
  finalState: null,
  steps: [
    { index: 0, type: 'visit', message: `Visit start node on level 2.`, nodeIds: ['s2'], stateChanges: [{ nodeId: 's2', state: 'visited' }] },
    { index: 1, type: 'inspect_next', message: `Inspect next node.`, nodeIds: ['s2', 'n25-2'], stateChanges: [{ nodeId: 'n25-2', state: 'next' }] },
    { index: 2, type: 'move_down', message: `Move down to level 1.`, nodeIds: ['s1'], stateChanges: [{ nodeId: 's1', state: 'visited' }] },
    { index: 0, type: 'visit', message: `Visit start node on level 2.`, nodeIds: ['s1'], stateChanges: [{ nodeId: 's1', state: 'visited' }] },
    { index: 1, type: 'inspect_next', message: `Inspect next node.`, nodeIds: ['s1', 'n10-1'], stateChanges: [{ nodeId: 'n10-1', state: 'next' }] },
    { index: 3, type: 'found', message: `Found value ${val}.`, nodeIds: [`n${val}-1`], stateChanges: [{ nodeId: `n${val}-1`, state: 'found' }] },
    { index: 4, type: 'complete', message: `Find animation complete.`, nodeIds: [], stateChanges: [] }
  ]
});

export const MOCK_INSERT_SUCCESS = (val: number): OperationResult => {
  // Creating a new state where the value is inserted at level 0 and 1
  const newState = JSON.parse(JSON.stringify(MOCK_INITIAL_STATE));
  newState.values.push(val);
  newState.values.sort((a: number, b: number) => a - b);
  
  // Injecting node into level 0
  newState.levels[2].nodes.splice(2, 0, { id: `n${val}-0`, label: `${val}`, numericValue: val, kind: 'value', level: 0, nextId: 'n25-0' });

  return {
    success: true,
    message: `Inserted value ${val}.`,
    finalState: newState,
    steps: [
      { index: 0, type: 'visit', message: `Searching for insertion point...`, nodeIds: ['s2'], stateChanges: [{ nodeId: 's2', state: 'visited' }] },
      { index: 1, type: 'split_arrow', message: `Split arrow on level 0 to make room.`, nodeIds: ['n10-0', `n${val}-0`], stateChanges: [] },
      { index: 2, type: 'insert_node', message: `Inserted ${val} at level 0.`, nodeIds: [`n${val}-0`], stateChanges: [{ nodeId: `n${val}-0`, state: 'found' }] },
      { index: 3, type: 'promote_node', message: `Coin flip heads! Promoted ${val} to level 1.`, nodeIds: [`n${val}-0`, `n${val}-1`], stateChanges: [] },
      { index: 4, type: 'complete', message: `Insert animation complete.`, nodeIds: [], stateChanges: [] }
    ]
  };
};

export const MOCK_DELETE_SUCCESS = (val: number): OperationResult => {
  const newState = JSON.parse(JSON.stringify(MOCK_INITIAL_STATE));
  newState.values = newState.values.filter((v: number) => v !== val);
  newState.levels.forEach((lvl: any) => {
    lvl.nodes = lvl.nodes.filter((n: any) => n.numericValue !== val);
  });

  return {
    success: true,
    message: `Deleted value ${val}.`,
    finalState: newState,
    steps: [
      { index: 0, type: 'visit', message: `Locating ${val} for deletion...`, nodeIds: ['s2'], stateChanges: [{ nodeId: 's2', state: 'visited' }] },
      { index: 1, type: 'delete_node', message: `Removing node from level 0.`, nodeIds: [`n${val}-0`], stateChanges: [] },
      { index: 2, type: 'merge_arrow', message: `Merging arrows after deletion.`, nodeIds: [], stateChanges: [] },
      { index: 3, type: 'complete', message: `Delete animation complete.`, nodeIds: [], stateChanges: [] }
    ]
  };
};

export const MOCK_RESET: OperationResult = ({
  success: true,
  message: 'Skip list reset complete.',
  finalState: MOCK_INITIAL_STATE,
  steps: [
    { index: 0, type: 'reset', message: 'Resetting state...', nodeIds: [], stateChanges: [] },
    { index: 1, type: 'complete', message: 'Reset complete.', nodeIds: [], stateChanges: [] }
  ]
});